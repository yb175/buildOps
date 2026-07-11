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
 * Relying on GeminiProvider internal retries for transient/429 errors.
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

    let roomSucceeded = false;
    let openingSucceeded = false;
    let detailsSucceeded = false;
    let lastError: any = null;

    // 1. Room Agent
    const rooms = await this.runAgentWithRetry("RoomAgent", ROOM_AGENT_PROMPT, fileBuffers, mimeType)
      .then((res) => {
        roomSucceeded = true;
        return res;
      })
      .catch((e) => {
        logger.error("[ExtractionService] RoomAgent failed", e);
        lastError = e;
        return { rooms: [] };
      });

    await delay(1000);

    // 2. Opening Agent
    const openings = await this.runAgentWithRetry("OpeningAgent", OPENING_AGENT_PROMPT, fileBuffers, mimeType)
      .then((res) => {
        openingSucceeded = true;
        return res;
      })
      .catch((e) => {
        logger.error("[ExtractionService] OpeningAgent failed", e);
        lastError = e;
        return { doors: [], windows: [] };
      });

    await delay(1000);

    // 3. Details Agent
    const details = await this.runAgentWithRetry("DetailsAgent", DETAILS_AGENT_PROMPT, fileBuffers, mimeType)
      .then((res) => {
        detailsSucceeded = true;
        return res;
      })
      .catch((e) => {
        logger.error("[ExtractionService] DetailsAgent failed", e);
        lastError = e;
        return { metadata: {}, structural: {}, fixtures: [], notes: [], callouts: [] };
      });

    // If ALL agents fail, throw the last error so PipelineService marks it as FAILED
    if (!roomSucceeded && !openingSucceeded && !detailsSucceeded) {
      throw lastError || new Error("All extraction agents failed");
    }

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
        discipline: details.metadata?.discipline ?? null,
      },

      rooms: Array.isArray(rooms.rooms) ? rooms.rooms : [],

      structural: {
        walls: details.structural?.walls ?? [],
        columns: details.structural?.columns ?? [],
        beams: details.structural?.beams ?? [],
        slabs: details.structural?.slabs ?? [],
        foundations: details.structural?.foundations ?? [],
        gridLines: Array.isArray(details.structural?.gridLines)
          ? details.structural.gridLines
          : [],
      },
      openings: {
        doors: Array.isArray(openings.doors) ? openings.doors : [],
        windows: Array.isArray(openings.windows) ? openings.windows : [],
      },

      fixtures: Array.isArray(details.fixtures) ? details.fixtures : [],

      annotations: Array.isArray(details.callouts)
        ? details.callouts.map((text: any) => ({ text: String(text) }))
        : [],

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
    mimeType: string
  ): Promise<any> {
    logger.log(`[ExtractionService] ${agentName} started`);
    const result = await this.gemini.generateJson<any>(prompt, null, fileBuffers, mimeType);
    logger.log(`[ExtractionService] ${agentName} completed`);
    return result;
  }
}
