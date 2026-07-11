import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MistralProvider } from "../../providers/mistral.provider";

describe("MistralProvider unit tests", () => {
  let provider: MistralProvider;

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("MISTRAL_API_KEY", "mock-api-key");
    provider = new MistralProvider();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("should successfully upload file and return file ID", async () => {
    const mockResponse = { id: "test-file-id" };
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const buffer = Buffer.from("sample");
    const fileId = await provider.uploadFile(buffer, "drawing.pdf");

    expect(fileId).toBe("test-file-id");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.mistral.ai/v1/files",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer mock-api-key" },
      })
    );
  });

  it("should handle upload failure correctly", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal Error",
    } as any);

    const buffer = Buffer.from("sample");
    await expect(provider.uploadFile(buffer, "drawing.pdf")).rejects.toThrow(
      "Mistral API failure: Mistral file upload failed: 500 - Internal Error"
    );
  });

  it("should successfully call performOCR and return pages", async () => {
    const mockOcrResult = {
      pages: [{ markdown: "Extracted Content Page 1" }],
    };
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockOcrResult,
    } as any);

    const result = await provider.performOCR("test-file-id");

    expect(result).toEqual(mockOcrResult);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.mistral.ai/v1/ocr",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer mock-api-key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistral-ocr-latest",
          document: { file_id: "test-file-id" },
          include_image_base64: false,
        }),
      })
    );
  });

  it("should fail in any environment if API key is missing", async () => {
    vi.stubEnv("MISTRAL_API_KEY", ""); // Simulate missing API key
    const emptyKeyProvider = new MistralProvider();

    const buffer = Buffer.from("sample");
    await expect(emptyKeyProvider.uploadFile(buffer, "drawing.pdf")).rejects.toThrow("Mistral API key is missing.");
    await expect(emptyKeyProvider.performOCR("some-id")).rejects.toThrow("Mistral API key is missing.");
  });
});
