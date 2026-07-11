import { RfiRepository } from "../repositories/rfi.repository";
import { ConflictRepository } from "../repositories/conflict.repository";
import { DrawingRepository } from "../repositories/drawing.repository";
import { GeminiProvider, GEMINI_FLASH_LITE_MODEL } from "../providers/gemini.provider";
import { NotFoundError } from "../errors/not-found.error";
import { Conflict } from "../models/conflict.types";
import {
  computeConflictsHash,
  createRfiSkeleton,
  mergeRfiRefinements,
  generateFallbackRefinement,
} from "../rfi/formatter";
import { validateDraftRfi } from "../rfi/validator";
import { buildRfiPrompt } from "../rfi/prompt";
import { DraftRFI, GeminiRfiRefinement } from "../models/rfi.types";
import { Rfi as DBRfi } from "@prisma/client";

export class RfiService {
  private rfiRepository: RfiRepository;
  private conflictRepository: ConflictRepository;
  private drawingRepository: DrawingRepository;
  private geminiProvider: GeminiProvider;

  constructor(
    rfiRepository = new RfiRepository(),
    conflictRepository = new ConflictRepository(),
    drawingRepository = new DrawingRepository(),
    geminiProvider = new GeminiProvider(GEMINI_FLASH_LITE_MODEL)
  ) {
    this.rfiRepository = rfiRepository;
    this.conflictRepository = conflictRepository;
    this.drawingRepository = drawingRepository;
    this.geminiProvider = geminiProvider;
  }

  /**
   * Returns cached RFIs for a given drawing.
   */
  async getRfisForDrawing(drawingId: string): Promise<DBRfi[]> {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(drawingId)) {
      throw new NotFoundError("Drawing not found");
    }

    const drawing = await this.drawingRepository.findById(drawingId);
    if (!drawing) {
      throw new NotFoundError("Drawing not found");
    }
    return this.rfiRepository.findByDrawingId(drawingId);
  }

  /**
   * Generates and persists RFIs for a drawing from its deterministic conflicts.
   */
  async generateAndPersistRfis(drawingId: string): Promise<DBRfi[]> {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(drawingId)) {
      throw new NotFoundError("Drawing not found");
    }

    const drawing = await this.drawingRepository.findById(drawingId);
    if (!drawing) {
      throw new NotFoundError("Drawing not found");
    }

    // 1. Fetch current conflicts for the drawing
    const conflicts = await this.conflictRepository.findByDrawingId(drawingId) as unknown as Conflict[];
    if (conflicts.length === 0) {
      // No conflicts = no RFIs. Clean up and return empty array.
      await this.rfiRepository.saveRfis(drawingId, [], "");
      return [];
    }

    // 2. Compute conflict hash
    const hash = computeConflictsHash(conflicts);

    // 3. Caching: check if conflict hash is unchanged
    const cached = await this.rfiRepository.findByDrawingId(drawingId);
    if (cached.length > 0 && (cached[0] as any).conflictHash === hash) {
      console.log(`[RfiService] Cache hit for drawing ${drawingId}. Returning cached RFIs.`);
      return cached;
    }

    // 4. Cache miss - generate RFI skeletons in the backend
    const skeletons = conflicts.map((conflict) => ({
      skeleton: createRfiSkeleton(conflict, drawing.discipline || "UNKNOWN"),
      conflictId: conflict.id,
    }));

    let refinements: GeminiRfiRefinement[] = [];
    const BATCH_SIZE = 10;
    try {
      // 5. Process conflicts in batches and build prompts for Gemini
      for (let i = 0; i < conflicts.length; i += BATCH_SIZE) {
        const batch = conflicts.slice(i, i + BATCH_SIZE);
        const prompt = buildRfiPrompt(
          drawing.fileName || "Unknown",
          drawing.discipline || "UNKNOWN",
          batch as any
        );

        const batchRefinements = await this.geminiProvider.generateJson<any>(prompt);
        if (!Array.isArray(batchRefinements)) {
          console.warn(`[RfiService] Gemini response for batch ${i} is not an array. Using fallback.`);
          continue;
        }
        refinements.push(...(batchRefinements as GeminiRfiRefinement[]));
      }
    } catch (err) {
      console.warn("[RfiService] Gemini call failed during batch processing. Falling back for some conflicts.", err);
    }

    // 6. Merge refinements or use defaults as fallback
    const draftRfis = mergeRfiRefinements(skeletons, refinements, conflicts);

    // 7. Strict Schema Validation
    const validatedRfis: DraftRFI[] = [];
    const allowedConflictIds = new Set(conflicts.map((c) => c.id));

    for (const rfi of draftRfis) {
      const errors = validateDraftRfi(rfi, allowedConflictIds);
      if (errors.length > 0) {
        console.warn(`[RfiService] RFI validation failed: ${errors.join(", ")}. Falling back to default.`);
        
        // Re-generate default fallback for this specific conflict
        const conflictId = rfi.relatedConflicts[0];
        const conflict = conflicts.find((c) => c.id === conflictId)!;
        const fallback = generateFallbackRefinement(conflict);
        
        const skeleton = skeletons.find((s) => s.conflictId === conflictId)!.skeleton;
        const fallbackRfi: DraftRFI = {
          ...skeleton,
          description: fallback.description,
          question: fallback.question,
          recommendation: fallback.recommendation,
        };
        validatedRfis.push(fallbackRfi);
      } else {
        validatedRfis.push(rfi);
      }
    }

    // 8. Persist to database & return
    return this.rfiRepository.saveRfis(drawingId, validatedRfis, hash);
  }

  /**
   * Updates an existing RFI.
   */
  async updateRfi(_drawingId: string, rfiId: string, data: Partial<DBRfi>): Promise<DBRfi> {
    return this.rfiRepository.update(rfiId, data);
  }
}
