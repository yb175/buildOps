import { prisma } from "../config/prisma";
import { Conflict as DBConflict, Prisma } from "@prisma/client";
import { Conflict as CoreConflict } from "../models/conflict.types";

export class ConflictRepository {
  /**
   * Fetches all conflicts for a specific drawing ID.
   */
  async findByDrawingId(drawingId: string): Promise<DBConflict[]> {
    return prisma.conflict.findMany({
      where: { drawingId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Replaces all conflicts for a drawing (delete and re-create in a transaction).
   */
  async saveConflicts(drawingId: string, conflicts: CoreConflict[]): Promise<DBConflict[]> {
    return prisma.$transaction(async (tx) => {
      // 1. Delete existing conflicts (to prevent duplicates on re-analysis)
      await tx.conflict.deleteMany({
        where: { drawingId },
      });

      // 2. Insert new ones
      const data = conflicts.map((c) => ({
        drawingId,
        category: c.category,
        severity: c.severity,
        title: c.title,
        description: c.description,
        entityA: c.entityA,
        entityB: c.entityB || null,
        recommendation: c.recommendation,
      }));

      // Create them and return the created records
      if (data.length === 0) return [];

      await tx.conflict.createMany({
        data,
      });

      return tx.conflict.findMany({
        where: { drawingId },
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });
  }
}
