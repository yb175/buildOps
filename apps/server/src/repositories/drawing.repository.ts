// DrawingRepository handles persistence operations for construction drawings.
import { prisma } from "../config/prisma";
import { Drawing, Discipline, DrawingStatus } from "@prisma/client";

export class DrawingRepository {
  async findByHash(hash: string): Promise<Drawing | null> {
    return prisma.drawing.findUnique({
      where: { hash },
    });
  }

  async create(data: {
    hash: string;
    fileName: string;
    fileUrl: string;
    publicId: string;
    discipline: Discipline;
  }): Promise<Drawing> {
    return prisma.drawing.create({
      data: {
        hash: data.hash,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        publicId: data.publicId,
        discipline: data.discipline,
        status: "UPLOADED",
      },
    });
  }

  async findById(id: string): Promise<Drawing | null> {
    return prisma.drawing.findUnique({
      where: { id },
    });
  }

  async updateOcrOutput(id: string, ocrOutput: string | null, status?: DrawingStatus): Promise<Drawing> {
    return prisma.drawing.update({
      where: { id },
      data: {
        ocrOutput,
        ...(status ? { status } : {}),
      },
    });
  }

  async updateStatus(id: string, status: DrawingStatus): Promise<Drawing> {
    return prisma.drawing.update({
      where: { id },
      data: { status },
    });
  }
}
