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
    projectName?: string;
  }): Promise<Drawing> {
    return prisma.drawing.create({
      data: {
        hash: data.hash,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        publicId: data.publicId,
        discipline: data.discipline,
        status: "UPLOADED",
        projectName: data.projectName || "500 Gaj Residence",
      } as any,
    });
  }

  async findById(id: string): Promise<Drawing | null> {
    return prisma.drawing.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<Drawing[]> {
    return prisma.drawing.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findByProject(projectName: string): Promise<Drawing[]> {
    return prisma.drawing.findMany({
      where: { projectName } as any,
      orderBy: { createdAt: "desc" },
    });
  }

  async delete(id: string): Promise<Drawing> {
    return prisma.drawing.delete({
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

  async updateParsedJson(
    id: string,
    parsedJson: any,
    documentType: string,
    classificationConfidence: number,
    status?: DrawingStatus
  ): Promise<Drawing> {
    return prisma.drawing.update({
      where: { id },
      data: {
        parsedJson,
        documentType,
        classificationConfidence,
        ...(status ? { status } : {}),
      } as any,
    });
  }
}
