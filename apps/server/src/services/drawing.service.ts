import { DrawingRepository } from "../repositories/drawing.repository";
import { uploadToCloudinary } from "../providers/cloudinary.provider";
import { computeSHA256 } from "../utils/hash.util";
import { Drawing, Discipline } from "@prisma/client";

export class DrawingService {
  private drawingRepository: DrawingRepository;

  constructor(drawingRepository = new DrawingRepository()) {
    this.drawingRepository = drawingRepository;
  }

  async handleUpload(
    fileBuffer: Buffer,
    fileName: string,
    discipline: Discipline
  ): Promise<{ drawing: Drawing; isDuplicate: boolean }> {
    console.log(`[DrawingService] Starting upload processing for file: ${fileName}`);
    const hash = computeSHA256(fileBuffer, discipline);
    console.log(`[DrawingService] Computed SHA-256 hash: ${hash}`);
    
    // Check if a drawing with the same SHA-256 already exists
    const existingDrawing = await this.drawingRepository.findByHash(hash);
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
    const newDrawing = await this.drawingRepository.create({
      hash,
      fileName,
      fileUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      discipline,
    });
    console.log(`[DrawingService] Successfully persisted drawing '${fileName}' with ID: ${newDrawing.id}`);

    return { drawing: newDrawing, isDuplicate: false };
  }
}
