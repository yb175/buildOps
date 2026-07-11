import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../app";
import { prisma } from "../../config/prisma";
import * as pdfUtil from "../../utils/pdf.util";
import { MistralProvider } from "../../providers/mistral.provider";

describe("analysis.routes integration test", () => {
  let createdDrawingId: string;

  beforeEach(async () => {
    vi.restoreAllMocks();
    
    // Seed a drawing record in PostgreSQL
    const drawing = await prisma.drawing.create({
      data: {
        hash: `test-hash-${Date.now()}`,
        fileName: "integration-drawing.pdf",
        fileUrl: "https://cloudinary.com/test-pdf",
        publicId: "cloudinary-id-test",
        discipline: "STRUCTURAL",
        status: "UPLOADED",
      },
    });
    createdDrawingId = drawing.id;
  });

  afterEach(async () => {
    // Clean up drawing records
    try {
      await prisma.drawing.deleteMany({});
    } catch (e) {
      // Ignore cleanup error if already deleted
    }
    vi.restoreAllMocks();
  });

  it("should perform E2E analysis, download PDF, call Mistral, persist and return OCR output", async () => {
    // Mock PDF download
    const downloadSpy = vi.spyOn(pdfUtil, "downloadPDF").mockResolvedValue(Buffer.from("%PDF-1.4 mock content"));

    // Mock MistralProvider methods
    const uploadSpy = vi.spyOn(MistralProvider.prototype, "uploadFile").mockResolvedValue("test-file-id");
    const ocrSpy = vi.spyOn(MistralProvider.prototype, "performOCR").mockResolvedValue({
      pages: [{ markdown: "Page 1 Extracted content" }],
    });

    const response = await request(app)
      .post(`/drawings/${createdDrawingId}/analyze`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      drawingId: createdDrawingId,
      ocrOutput: "Page 1 Extracted content",
    });

    expect(downloadSpy).toHaveBeenCalledWith("https://cloudinary.com/test-pdf");
    expect(uploadSpy).toHaveBeenCalledTimes(1);
    expect(ocrSpy).toHaveBeenCalledWith("test-file-id");

    // Verify it is saved in the database
    const updatedDrawing = await prisma.drawing.findUnique({
      where: { id: createdDrawingId },
    });
    expect(updatedDrawing?.ocrOutput).toBe("Page 1 Extracted content");
  });

  it("should return cached OCR output on subsequent analysis requests without invoking Mistral", async () => {
    // Perform first E2E analysis
    vi.spyOn(pdfUtil, "downloadPDF").mockResolvedValue(Buffer.from("%PDF-1.4 mock content"));
    vi.spyOn(MistralProvider.prototype, "uploadFile").mockResolvedValue("test-file-id");
    vi.spyOn(MistralProvider.prototype, "performOCR").mockResolvedValue({
      pages: [{ markdown: "Cached content text" }],
    });

    const response1 = await request(app).post(`/drawings/${createdDrawingId}/analyze`);
    expect(response1.status).toBe(200);
    expect(response1.body.ocrOutput).toBe("Cached content text");

    // Reset spies to check invocation counts
    vi.restoreAllMocks();
    const downloadSpy = vi.spyOn(pdfUtil, "downloadPDF");
    const uploadSpy = vi.spyOn(MistralProvider.prototype, "uploadFile");
    const ocrSpy = vi.spyOn(MistralProvider.prototype, "performOCR");

    // Perform second analysis request
    const response2 = await request(app).post(`/drawings/${createdDrawingId}/analyze`);
    expect(response2.status).toBe(200);
    expect(response2.body.ocrOutput).toBe("Cached content text");

    // Verify Mistral and download was not called again
    expect(downloadSpy).not.toHaveBeenCalled();
    expect(uploadSpy).not.toHaveBeenCalled();
    expect(ocrSpy).not.toHaveBeenCalled();
  });

  it("should return 404 if the drawing ID is not found", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const response = await request(app).post(`/drawings/${fakeId}/analyze`);

    expect(response.status).toBe(404);
    expect(response.body.error).toContain("Drawing not found");
  });

  it("should return 500 if Cloudinary download fails", async () => {
    vi.spyOn(pdfUtil, "downloadPDF").mockRejectedValue(new Error("Cloudinary download failure: Network connection lost"));

    const response = await request(app).post(`/drawings/${createdDrawingId}/analyze`);

    expect(response.status).toBe(500);
    expect(response.body.error).toContain("Cloudinary download failure");
  });

  it("should return 500 if Mistral API fails", async () => {
    vi.spyOn(pdfUtil, "downloadPDF").mockResolvedValue(Buffer.from("%PDF-1.4 mock content"));
    vi.spyOn(MistralProvider.prototype, "uploadFile").mockRejectedValue(new Error("Mistral API failure: rate limit"));

    const response = await request(app).post(`/drawings/${createdDrawingId}/analyze`);

    expect(response.status).toBe(500);
    expect(response.body.error).toContain("Mistral API failure");
  });
});
