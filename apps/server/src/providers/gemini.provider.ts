export const geminiConfig = {
  get apiKey(): string {
    return process.env.GEMINI_API_KEY || "";
  },
  get baseUrl(): string {
    return "https://generativelanguage.googleapis.com/v1beta";
  },
};

/** Model alias used for fast, cheap classification tasks. */
export const GEMINI_FLASH_MODEL = process.env.GEMINI_FLASH_MODEL || "gemini-3.1-flash-lite";

/** Model alias used for high-accuracy extraction agents. */
export const GEMINI_PRO_MODEL = process.env.GEMINI_PRO_MODEL || "gemini-3.1-flash-lite";

/** Model alias used for cost-efficient text-only tasks like RFI generation. */
export const GEMINI_FLASH_LITE_MODEL = process.env.GEMINI_FLASH_LITE_MODEL || "gemini-3.1-flash-lite";

export class GeminiProvider {
  private baseUrl: string;
  private model: string;

  constructor(model: string = GEMINI_PRO_MODEL) {
    this.baseUrl = geminiConfig.baseUrl;
    this.model = model;
  }

  /**
   * Sends a prompt to Gemini and returns the parsed JSON response.
   *
   * @param prompt        The text prompt
   * @param responseSchema  Optional Gemini responseSchema (flat schemas only — nested ones cause empty candidates)
   * @param fileBuffers     Single buffer or array of buffers (PDF or PNG pages)
   * @param mimeType        MIME type of the file buffers (default: "application/pdf")
   */
  async generateJson<T>(
    prompt: string,
    responseSchema?: any,
    fileBuffers?: Buffer | Buffer[],
    mimeType: string = "application/pdf"
  ): Promise<T> {
    const apiKey = geminiConfig.apiKey;
    if (!apiKey) {
      throw new Error("Gemini API key is missing.");
    }

    // In test environments with mock keys, bypass real API calls
    if (process.env.NODE_ENV !== "production" && apiKey.startsWith("mock")) {
      console.warn("⚠️ Mock Gemini API key detected. Returning local mock response.");
      const firstBuffer = Array.isArray(fileBuffers) ? fileBuffers[0] : fileBuffers;
      return this.getMockResponseForPrompt(prompt, firstBuffer) as T;
    }

    try {
      // Build parts array — images/PDF come BEFORE the text prompt for best results
      const parts: any[] = [];

      if (fileBuffers) {
        const bufferArray = Array.isArray(fileBuffers) ? fileBuffers : [fileBuffers];
        for (const buf of bufferArray) {
          parts.push({
            inlineData: {
              mimeType,
              data: buf.toString("base64"),
            },
          });
        }
      }

      parts.push({ text: prompt });

      // For image inputs: do NOT set responseMimeType — it causes Gemini to return
      // empty candidates when it can't guarantee valid JSON structure.
      // The agent prompts already instruct the model to return raw JSON.
      // For text/PDF inputs: responseMimeType:application/json works fine.
      const isImageInput = mimeType.startsWith("image/");
      const generationConfig: any = { temperature: 0 };
      if (!isImageInput) {
        generationConfig.responseMimeType = "application/json";
        if (responseSchema) generationConfig.responseSchema = responseSchema;
      }

      const retries = 3;
      let backoffMs = 2000;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 120000);

          let response: Response;
          try {
            response = await fetch(
              `${this.baseUrl}/models/${this.model}:generateContent`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-goog-api-key": apiKey,
                },
                body: JSON.stringify({
                  contents: [{ role: "user", parts }],
                  generationConfig,
                }),
                signal: controller.signal,
              }
            );
          } finally {
            clearTimeout(timeoutId);
          }

          if (!response.ok) {
            const errorText = await response.text();
            const isTransient = response.status === 429 || response.status === 503;
            if (isTransient && attempt < retries) {
              console.warn(`[GeminiProvider] Hit transient status ${response.status} (attempt ${attempt}/${retries}). Retrying in ${backoffMs}ms...`);
              await new Promise((resolve) => setTimeout(resolve, backoffMs));
              backoffMs *= 2;
              continue;
            }
            throw new Error(`Gemini API failed with status ${response.status}: ${errorText}`);
          }

          const data = (await response.json()) as any;

          if (data.usageMetadata) {
            const usage = data.usageMetadata;
            console.log(
              `[GeminiProvider] Token usage for model ${this.model}: ` +
              `input=${usage.promptTokenCount}, output=${usage.candidatesTokenCount}, total=${usage.totalTokenCount}`
            );
          }

          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) {
            const finishReason = data.candidates?.[0]?.finishReason;
            throw new Error(`Empty response from Gemini API. finishReason=${finishReason ?? "unknown"}`);
          }

          try {
            return this.extractJson<T>(text);
          } catch (parseError) {
            if (process.env.NODE_ENV !== "production") {
              console.error("GEMINI RAW TEXT RESPONSE ON PARSE FAILURE:", text);
            } else {
              console.error("GEMINI RAW TEXT RESPONSE ON PARSE FAILURE: [Redacted in production]");
            }
            throw parseError;
          }
        } catch (error: any) {
          lastError = error;
          const isNetworkOrTransient = error.name === "AbortError" || error.message?.includes("429") || error.message?.includes("503") || error.message?.includes("fetch") || error.message?.includes("aborted");
          if (isNetworkOrTransient && attempt < retries) {
            console.warn(`[GeminiProvider] Hit transient error (attempt ${attempt}/${retries}). Retrying in ${backoffMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            backoffMs *= 2;
            continue;
          }
          throw error;
        }
      }
      throw lastError || new Error("Gemini generation failed after retries");
    } catch (error) {
      throw new Error(
        `Gemini provider failure: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Extracts and parses JSON from a model response that may contain markdown
   * code fences (```json ... ```) around the JSON block.
   * Falls back to direct JSON.parse if no fences are found.
   */
  private extractJson<T>(text: string): T {
    // Strip ```json ... ``` or ``` ... ``` fences
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonText = fenceMatch ? fenceMatch[1].trim() : text.trim();
    return JSON.parse(jsonText) as T;
  }

  /**
   * Evaluates mock responses for test/dev environments based on prompt content.
   */
  private getMockResponseForPrompt(prompt: string, pdfBuffer?: Buffer): any {
    let textToCheck = prompt;
    if (pdfBuffer) {
      textToCheck = pdfBuffer.toString("utf8");
    } else {
      const parts = prompt.split("OCR Text:");
      textToCheck = parts[parts.length - 1] || prompt;
    }

    // 1. Classification prompts
    if (prompt.includes("classify") || prompt.includes("DocumentClassification")) {
      const lower = textToCheck.toLowerCase();
      if (lower.includes("resume") || lower.includes("employment")) {
        return {
          isConstructionDrawing: false,
          confidence: 0.99,
          documentType: "RESUME",
          reason: "Detected employment history instead of construction drawing.",
        };
      }
      if (lower.includes("invoice") || lower.includes("bill")) {
        return {
          isConstructionDrawing: false,
          confidence: 0.98,
          documentType: "INVOICE",
          reason: "Detected billing invoice instead of construction drawing.",
        };
      }
      if (lower.includes("structural") || lower.includes("beams")) {
        return {
          isConstructionDrawing: true,
          confidence: 0.95,
          documentType: "STRUCTURAL_DRAWING",
          reason: "Detected structural drawing containing structural beams layout.",
        };
      }
      if (lower.includes("interior") || lower.includes("furniture")) {
        return {
          isConstructionDrawing: true,
          confidence: 0.96,
          documentType: "INTERIOR_DRAWING",
          reason: "Detected interior layout with furniture annotation schedules.",
        };
      }
      return {
        isConstructionDrawing: true,
        confidence: 0.97,
        documentType: "ARCHITECTURAL_DRAWING",
        reason: "Detected architectural drawing showing floor plan details.",
      };
    }

    // 1.5. RFI generation prompts
    if (prompt.includes("coordinator") || prompt.includes("GeminiRfiRefinement") || prompt.includes("RFI")) {
      const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
      const matches = prompt.match(uuidRegex) || [];
      const uniqueIds = Array.from(new Set(matches));

      if (uniqueIds.length === 0) {
        return [
          {
            conflictId: "mock-conflict-id",
            description: "Mock RFI Description: During design review, a conflict was identified between architectural door assembly and structural elements.",
            question: "Confirm layout adjustments required to clear the door opening.",
            recommendation: "Shift the door or structural element as needed to resolve clearance issues."
          }
        ];
      }

      return uniqueIds.map((id) => ({
        conflictId: id,
        description: `Mock RFI Description for conflict ${id}: During structural review, door layout was found to intersect structural framing, preventing proper installation.`,
        question: `Confirm correct coordinates for door assembly to clear structural framing for conflict ${id}.`,
        recommendation: `Shift architectural door assembly location slightly to clear the structural element, subject to final design coordination.`
      }));
    }

    // 2. Normalization / extraction agent prompts
    return {
      schemaVersion: "1.0",
      metadata: {
        drawingNumber: "A-101",
        title: "Floor Plan Mock",
        project: "BuildOps Office Mock",
        scale: "1:100",
        date: null,
        revision: null,
        discipline: "ARCHITECTURAL",
      },
      rooms: [
        {
          id: "R-001",
          name: "Conference Room",
          rawLabel: "Conference Room",
          dimensions: "15' x 16'",
          areaSquareFeet: 240,
        },
      ],
      structural: { foundations: [], columns: [], beams: [], slabs: [], walls: [], gridLines: [] },
      openings: { doors: [], windows: [] },
      fixtures: [],
      annotations: [],
      schedules: [],
      notes: ["Mock normalized drawing notes."],
    };
  }
}
