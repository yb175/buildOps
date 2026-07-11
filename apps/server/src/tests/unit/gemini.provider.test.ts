import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GeminiProvider } from "../../providers/gemini.provider";

describe("GeminiProvider unit tests", () => {
  let provider: GeminiProvider;

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("GEMINI_API_KEY", "real-api-key");
    provider = new GeminiProvider();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("should successfully generate content and return parsed JSON", async () => {
    const mockJson = { test: "data" };
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(mockJson) }],
            },
          },
        ],
      }),
    } as any);

    const result = await provider.generateJson<any>("test prompt");

    expect(result).toEqual(mockJson);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": "real-api-key",
        },
      })
    );
  });

  it("should handle request failures correctly", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Gemini Server Error",
    } as any);

    await expect(provider.generateJson("test")).rejects.toThrow(
      "Gemini provider failure: Gemini API failed with status 500: Gemini Server Error"
    );
  });

  it("should fail in any environment if API key is missing", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const emptyKeyProvider = new GeminiProvider();

    await expect(emptyKeyProvider.generateJson("test")).rejects.toThrow("Gemini API key is missing.");
  });
});
