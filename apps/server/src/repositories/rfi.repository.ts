import { prisma } from "../config/prisma";
import { Rfi as DBRfi, Prisma } from "@prisma/client";
import { DraftRFI } from "../models/rfi.types";

export class RfiRepository {
  /**
   * Finds all RFIs associated with a given drawing.
   */
  async findByDrawingId(drawingId: string): Promise<DBRfi[]> {
    return (prisma.rfi.findMany as any)({
      where: { drawingId },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Persists a set of RFIs for a drawing, replacing any existing ones in a transaction.
   */
  async saveRfis(drawingId: string, rfis: DraftRFI[], conflictHash: string): Promise<DBRfi[]> {
    return prisma.$transaction(async (tx) => {
      // 1. Delete existing RFIs for the drawing (if any) to prevent duplication on re-generation
      await (tx.rfi.deleteMany as any)({
        where: { drawingId },
      });

      if (rfis.length === 0) return [];

      // 2. Map and insert new RFI drafts
      const data = rfis.map((rfi) => ({
        id: rfi.id,
        drawingId,
        conflictId: rfi.relatedConflicts[0], // link to the main conflict
        title: rfi.title,
        priority: rfi.priority,
        discipline: rfi.discipline,
        subject: rfi.subject,
        description: rfi.description,
        question: rfi.question,
        recommendation: rfi.recommendation,
        status: "GENERATED",
        conflictHash,
      }));

      await (tx.rfi.createMany as any)({
        data,
      });

      return (tx.rfi.findMany as any)({
        where: { drawingId },
        orderBy: { createdAt: "asc" },
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });
  }

  /**
   * Updates an existing RFI by ID.
   */
  async update(id: string, data: Partial<DBRfi>): Promise<DBRfi> {
    return (prisma.rfi.update as any)({
      where: { id },
      data,
    });
  }
}
