import { DrawingRepository } from "../repositories/drawing.repository";
import { ConflictRepository } from "../repositories/conflict.repository";
import { ConflictEngine } from "../conflict/engine/conflict.engine";
import { prisma } from "../config/prisma";
import { NotFoundError } from "../errors/not-found.error";
import { Conflict as DBConflict } from "@prisma/client";

export class ConflictService {
  private drawingRepository: DrawingRepository;
  private conflictRepository: ConflictRepository;
  private conflictEngine: ConflictEngine;

  constructor(
    drawingRepository = new DrawingRepository(),
    conflictRepository = new ConflictRepository(),
    conflictEngine = new ConflictEngine()
  ) {
    this.drawingRepository = drawingRepository;
    this.conflictRepository = conflictRepository;
    this.conflictEngine = conflictEngine;
  }

  /**
   * Runs conflict detection on a drawing and persists results.
   */
  async detectAndPersistConflicts(drawingId: string): Promise<DBConflict[]> {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(drawingId)) {
      throw new NotFoundError("Drawing not found");
    }

    const drawing = await this.drawingRepository.findById(drawingId);
    if (!drawing) {
      throw new NotFoundError("Drawing not found");
    }

    if (!drawing.parsedJson) {
      // If drawing has not been parsed yet, return empty list (cannot run conflicts without parsed JSON)
      return [];
    }

    // Fetch all other parsed drawings to perform cross-discipline validation
    const dbDrawings = await prisma.drawing.findMany({
      where: {
        status: "PARSED",
      },
    });

    const allDrawings = dbDrawings.map((d) => ({
      id: d.id,
      discipline: d.discipline,
      drawing: d.parsedJson as any,
    }));

    // Analyze using the Conflict Engine
    const conflicts = await this.conflictEngine.analyze({
      drawing: drawing.parsedJson as any,
      drawingId: drawing.id,
      allDrawings,
    });

    // Save and return conflicts
    return this.conflictRepository.saveConflicts(drawing.id, conflicts);
  }

  /**
   * Retrieves already persisted conflicts for a drawing.
   */
  async getConflictsForDrawing(drawingId: string): Promise<DBConflict[]> {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(drawingId)) {
      throw new NotFoundError("Drawing not found");
    }

    const drawing = await this.drawingRepository.findById(drawingId);
    if (!drawing) {
      throw new NotFoundError("Drawing not found");
    }

    return this.conflictRepository.findByDrawingId(drawingId);
  }
}
