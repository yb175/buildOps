import { DrawingRepository } from "../repositories/drawing.repository";
import { uploadToCloudinary } from "../providers/cloudinary.provider";
import { computeSHA256 } from "../utils/hash.util";
import { Drawing, Discipline, Prisma } from "@prisma/client";
import { cloudinary } from "../config/cloudinary";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { NotFoundError } from "../errors/not-found.error";

export class DrawingService {
  private drawingRepository: DrawingRepository;

  constructor(drawingRepository = new DrawingRepository()) {
    this.drawingRepository = drawingRepository;
  }

  async handleUpload(
    fileBuffer: Buffer,
    fileName: string,
    discipline: Discipline,
    projectName?: string,
    drawingNo?: string,
    revision?: string
  ): Promise<{ drawing: Drawing; isDuplicate: boolean }> {
    console.log(`[DrawingService] Starting upload processing for file: ${fileName}`);
    const hash = computeSHA256(fileBuffer, discipline);
    console.log(`[DrawingService] Computed SHA-256 hash: ${hash}`);
    
    // Check if a drawing with the same SHA-256 already exists
    const existingDrawing = await this.drawingRepository.findByHash(hash, projectName);
    if (existingDrawing) {
      console.log(`[DrawingService] Duplicate match found in database for hash: ${hash} (Drawing ID: ${existingDrawing.id})`);
      return { drawing: existingDrawing, isDuplicate: true };
    }

    // Upload to Cloudinary
    console.log(`[DrawingService] Uploading file '${fileName}' to Cloudinary...`);
    const uploadResult = await uploadToCloudinary(fileBuffer, fileName);
    console.log(`[DrawingService] Cloudinary upload successful. Public ID: ${uploadResult.public_id}`);

    // Persist drawing metadata to database
    console.log(`[DrawingService] Saving drawing metadata to database...`);
    try {
      const newDrawing = await this.drawingRepository.create({
        hash,
        fileName,
        fileUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        discipline,
        projectName,
        drawingNo,
        revision,
      });
      console.log(`[DrawingService] Successfully persisted drawing '${fileName}' with ID: ${newDrawing.id}`);
      return { drawing: newDrawing, isDuplicate: false };
    } catch (dbError) {
      console.error(`[DrawingService] Database save failed. Cleaning up Cloudinary asset: ${uploadResult.public_id}`, dbError);
      
      try {
        // Clean up the uploaded asset from Cloudinary
        if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
          await cloudinary.uploader.destroy(uploadResult.public_id, { resource_type: "raw" });
          console.log("[DrawingService] Successfully cleaned up orphaned Cloudinary asset.");
        }
      } catch (cleanupError) {
        console.error("[DrawingService] Failed to clean up Cloudinary asset:", cleanupError);
      }

      // Handle unique constraint violation (P2002) for concurrent uploads
      if (dbError instanceof Prisma.PrismaClientKnownRequestError && dbError.code === "P2002") {
        console.log(`[DrawingService] Concurrent unique constraint match for hash: ${hash}. Fetching existing drawing.`);
        const concurrentDrawing = await this.drawingRepository.findByHash(hash, projectName);
        if (concurrentDrawing) {
          return { drawing: concurrentDrawing, isDuplicate: true };
        }
      }

      throw dbError; // Rethrow original error if it's a different database error
    }
  }

  async deleteDrawing(id: string): Promise<void> {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundError("Drawing not found");
    }

    const drawing = await this.drawingRepository.findById(id);
    if (!drawing) {
      throw new NotFoundError("Drawing not found");
    }

    // Delete dependent records first in a transaction to satisfy foreign-key checks
    await prisma.$transaction(async (tx) => {
      await tx.rfi.deleteMany({ where: { drawingId: id } });
      await tx.conflict.deleteMany({ where: { drawingId: id } });
      await tx.drawing.delete({ where: { id } });
    });

    // Clean up corresponding Cloudinary asset
    if (drawing.publicId && env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      try {
        console.log(`[DrawingService] Deleting Cloudinary asset: ${drawing.publicId}`);
        await cloudinary.uploader.destroy(drawing.publicId, { resource_type: "raw" });
        console.log("[DrawingService] Successfully deleted Cloudinary asset.");
      } catch (err) {
        console.error(`[DrawingService] Failed to delete Cloudinary asset ${drawing.publicId}:`, err);
      }
    }
  }
}
