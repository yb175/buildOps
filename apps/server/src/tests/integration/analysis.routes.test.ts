import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../app";
import { prisma } from "../../config/prisma";
import * as pdfUtil from "../../utils/pdf.util";
import * as pdfRenderer from "../../utils/pdf-renderer.util";
import { GeminiProvider } from "../../providers/gemini.provider";

describe("analysis.routes integration test", () => {
  let createdDrawingId: string;

  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.stubEnv("GEMINI_API_KEY", "mock-gemini-key");
    // Always skip real PDF rendering in integration tests
    vi.spyOn(pdfRenderer, "renderPdfToImages").mockResolvedValue(null);

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
      if (createdDrawingId) {
        await prisma.drawing.delete({ where: { id: createdDrawingId } });
      }
    } catch (e) {
      // Ignore cleanup error if already deleted
    }
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("should perform E2E analysis, classify as ARCHITECTURAL_DRAWING, normalize, and return JSON", async () => {
    vi.spyOn(pdfUtil, "downloadPDF").mockResolvedValue(Buffer.from("%PDF-1.4 Architectural floor layout plan"));

    const response = await request(app)
      .post(`/drawings/${createdDrawingId}/analyze`);

    expect(response.status).toBe(200);
    expect(response.body.drawingId).toBe(createdDrawingId);
    expect(response.body.parsedJson.schemaVersion).toBe("1.0");
    expect(response.body.parsedJson.metadata.title).toContain("Floor Plan Mock");

    // Verify it is saved in the database
    const updatedDrawing = await prisma.drawing.findUnique({
      where: { id: createdDrawingId },
    });
    expect(updatedDrawing?.parsedJson).not.toBeNull();
    expect((updatedDrawing as any)?.documentType).toBe("ARCHITECTURAL_DRAWING");
    expect(updatedDrawing?.status).toBe("PARSED");
  });

  it("should perform E2E analysis, classify as STRUCTURAL_DRAWING, and return JSON", async () => {
    vi.spyOn(pdfUtil, "downloadPDF").mockResolvedValue(Buffer.from("%PDF-1.4 Beams and columns structural design details"));

    const response = await request(app)
      .post(`/drawings/${createdDrawingId}/analyze`);

    expect(response.status).toBe(200);
    expect(response.body.parsedJson.schemaVersion).toBe("1.0");

    const updatedDrawing = await prisma.drawing.findUnique({
      where: { id: createdDrawingId },
    });
    expect((updatedDrawing as any)?.documentType).toBe("STRUCTURAL_DRAWING");
    expect(updatedDrawing?.status).toBe("PARSED");
  });

  it("should perform E2E analysis, classify as INTERIOR_DRAWING, and return JSON", async () => {
    vi.spyOn(pdfUtil, "downloadPDF").mockResolvedValue(Buffer.from("%PDF-1.4 Interior furniture and finish plans"));

    const response = await request(app)
      .post(`/drawings/${createdDrawingId}/analyze`);

    expect(response.status).toBe(200);
    expect(response.body.parsedJson.schemaVersion).toBe("1.0");

    const updatedDrawing = await prisma.drawing.findUnique({
      where: { id: createdDrawingId },
    });
    expect((updatedDrawing as any)?.documentType).toBe("INTERIOR_DRAWING");
    expect(updatedDrawing?.status).toBe("PARSED");
  });

  it("should return HTTP 422 if the document is classified as a RESUME", async () => {
    vi.spyOn(pdfUtil, "downloadPDF").mockResolvedValue(Buffer.from("%PDF-1.4 Professional Resume of John Doe with employment experience"));

    const response = await request(app)
      .post(`/drawings/${createdDrawingId}/analyze`);

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      error: "Unsupported document type.",
      documentType: "RESUME",
      confidence: 0.99,
      reason: "Detected employment history instead of construction drawing.",
    });

    // Verify drawing status is updated to FAILED
    const updatedDrawing = await prisma.drawing.findUnique({
      where: { id: createdDrawingId },
    });
    expect(updatedDrawing?.status).toBe("FAILED");
  });

  it("should return HTTP 422 if the document is classified as an INVOICE", async () => {
    vi.spyOn(pdfUtil, "downloadPDF").mockResolvedValue(Buffer.from("%PDF-1.4 Billing Invoice statement showing total payment due"));

    const response = await request(app)
      .post(`/drawings/${createdDrawingId}/analyze`);

    expect(response.status).toBe(422);
    expect(response.body.documentType).toBe("INVOICE");

    const updatedDrawing = await prisma.drawing.findUnique({
      where: { id: createdDrawingId },
    });
    expect(updatedDrawing?.status).toBe("FAILED");
  });

  it("should return cached parsed JSON on subsequent analysis requests without calling Gemini", async () => {
    // 1. Perform first E2E analysis to cache it
    vi.spyOn(pdfUtil, "downloadPDF").mockResolvedValue(Buffer.from("%PDF-1.4 Architectural floor layout plan"));

    const response1 = await request(app).post(`/drawings/${createdDrawingId}/analyze`);
    expect(response1.status).toBe(200);

    // 2. Mock GeminiProvider to spy on invocations
    vi.restoreAllMocks();
    const geminiSpy = vi.spyOn(GeminiProvider.prototype, "generateJson");
    const downloadSpy = vi.spyOn(pdfUtil, "downloadPDF");

    // 3. Call endpoint a second time
    const response2 = await request(app).post(`/drawings/${createdDrawingId}/analyze`);
    expect(response2.status).toBe(200);
    expect(response2.body.parsedJson).toBeDefined();

    // Verify Gemini and downloads were skipped
    expect(geminiSpy).not.toHaveBeenCalled();
    expect(downloadSpy).not.toHaveBeenCalled();
  });

  it("should return 404 if the drawing ID is not found", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const response = await request(app).post(`/drawings/${fakeId}/analyze`);

    expect(response.status).toBe(404);
    expect(response.body.error).toContain("Drawing not found");
  });

  it("should return 500 if Gemini API fails during classification", async () => {
    vi.spyOn(pdfUtil, "downloadPDF").mockResolvedValue(Buffer.from("%PDF-1.4 Valid building floor layout"));

    // Make Gemini throw an error
    vi.spyOn(GeminiProvider.prototype, "generateJson").mockRejectedValue(new Error("Gemini quota exceeded"));

    const response = await request(app).post(`/drawings/${createdDrawingId}/analyze`);

    expect(response.status).toBe(500);
    expect(response.body.error).toContain("Unexpected server error during analysis.");
  });
});
