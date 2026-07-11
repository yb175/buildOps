import { GeminiProvider, GEMINI_PRO_MODEL } from "../providers/gemini.provider";
import { ROOM_AGENT_PROMPT } from "../prompts/agents/room-agent.prompt";
import { OPENING_AGENT_PROMPT } from "../prompts/agents/opening-agent.prompt";
import { DETAILS_AGENT_PROMPT } from "../prompts/agents/details-agent.prompt";
import { ParsedDrawing } from "../types/parsed-drawing.types";
import { logger } from "../utils/logger";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * MVP 3-Agent Extraction Pipeline (temperature=0)
 *
 * Runs 3 focused agents sequentially with short delays to avoid rate limit (429) spikes.
 * Automatically retries 429 Resource Exhausted errors with exponential backoff.
 */
export class ExtractionService {
  private gemini: GeminiProvider;

  constructor(gemini = new GeminiProvider(GEMINI_PRO_MODEL)) {
    this.gemini = gemini;
  }

  async extract(
    fileBuffers: Buffer | Buffer[],
    documentType: string,
    mimeType: string = "application/pdf"
  ): Promise<ParsedDrawing> {
    logger.log(
      `[ExtractionService] Starting robust sequential extraction for type=${documentType}`
    );

    // 1. Room Agent
    const rooms = await this.runAgentWithRetry("RoomAgent", ROOM_AGENT_PROMPT, fileBuffers, mimeType).catch((e) => {
      logger.error("[ExtractionService] RoomAgent failed after retries", e);
      return { rooms: [] };
    });

    await delay(1000);

    // 2. Opening Agent
    const openings = await this.runAgentWithRetry("OpeningAgent", OPENING_AGENT_PROMPT, fileBuffers, mimeType).catch((e) => {
      logger.error("[ExtractionService] OpeningAgent failed after retries", e);
      return { doors: [], windows: [] };
    });

    await delay(1000);

    // 3. Details Agent
    const details = await this.runAgentWithRetry("DetailsAgent", DETAILS_AGENT_PROMPT, fileBuffers, mimeType).catch((e) => {
      logger.error("[ExtractionService] DetailsAgent failed after retries", e);
      return { metadata: {}, structural: {}, fixtures: [], notes: [], callouts: [] };
    });

    logger.log("[ExtractionService] Sequential extraction complete. Merging...");

    const merged: ParsedDrawing = {
      schemaVersion: "1.0",

      metadata: {
        drawingNumber: details.metadata?.drawingNumber ?? null,
        title: details.metadata?.title ?? null,
        project: details.metadata?.project ?? null,
        revision: details.metadata?.revision ?? null,
        scale: details.metadata?.scale ?? null,
        date: details.metadata?.date ?? null,
      },

      rooms: Array.isArray(rooms.rooms) ? rooms.rooms : [],

      structural: {
        walls: details.structural?.walls ?? [],
        columns: details.structural?.columns ?? [],
        beams: details.structural?.beams ?? [],
        slabs: details.structural?.slabs ?? [],
        foundations: details.structural?.foundations ?? [],
      },

      openings: {
        doors: Array.isArray(openings.doors) ? openings.doors : [],
        windows: Array.isArray(openings.windows) ? openings.windows : [],
      },

      fixtures: Array.isArray(details.fixtures) ? details.fixtures : [],

      annotations: [
        ...((details.callouts as string[]) ?? []).map((text: string) => ({ text })),
      ],

      schedules: [],

      notes: Array.isArray(details.notes) ? details.notes : [],
    };

    logger.log(
      `[ExtractionService] Merge complete — ` +
        `rooms=${merged.rooms.length}, ` +
        `doors=${merged.openings.doors.length}, ` +
        `windows=${merged.openings.windows.length}, ` +
        `fixtures=${merged.fixtures.length}, ` +
        `walls=${merged.structural.walls.length}, ` +
        `columns=${merged.structural.columns.length}`
    );

    return merged;
  }

  private async runAgentWithRetry(
    agentName: string,
    prompt: string,
    fileBuffers: Buffer | Buffer[],
    mimeType: string,
    retries = 3,
    backoffMs = 2000
  ): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.log(`[ExtractionService] ${agentName} started (attempt ${attempt}/${retries})`);
        const result = await this.gemini.generateJson<any>(prompt, null, fileBuffers, mimeType);
        logger.log(`[ExtractionService] ${agentName} completed`);
        return result;
      } catch (error: any) {
        const isRateLimit = error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED");
        if (isRateLimit && attempt < retries) {
          logger.warn(
            `[ExtractionService] ${agentName} hit rate limit (429). Retrying in ${backoffMs}ms...`
          );
          await delay(backoffMs);
          backoffMs *= 2; // exponential backoff
          continue;
        }
        throw error;
      }
    }
  }
}
