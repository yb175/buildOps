import { prisma } from "../config/prisma";
import { Drawing, Discipline } from "@prisma/client";

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
}
