import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../app";

// Hoist the mock function declaration so it is available to the hoisted mock block
const { mockHandleUpload } = vi.hoisted(() => {
  return {
    mockHandleUpload: vi.fn(),
  };
});

// Mock the DrawingService class constructor
vi.mock("../../services/drawing.service", () => {
  return {
    DrawingService: vi.fn().mockImplementation(() => {
      return {
        handleUpload: mockHandleUpload,
      };
    }),
  };
});

describe("drawing.routes integration test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should accept valid PDF file and valid discipline and return 201 UPLOADED", async () => {
    const mockDrawing = {
      id: "uuid-123",
      status: "UPLOADED",
    };

    mockHandleUpload.mockResolvedValue({
      drawing: mockDrawing as any,
      isDuplicate: false,
    });

    const pdfBuffer = Buffer.from("%PDF-1.4 mock content");

    const response = await request(app)
      .post("/drawings")
      .field("discipline", "STRUCTURAL")
      .attach("file", pdfBuffer, "sample.pdf");

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      drawingId: "uuid-123",
      status: "UPLOADED",
    });
    expect(mockHandleUpload).toHaveBeenCalledWith(expect.any(Buffer), "sample.pdf", "STRUCTURAL");
  });

  it("should return 200 with existing metadata if the drawing already exists (duplicate)", async () => {
    const mockDrawing = {
      id: "uuid-existing",
      status: "UPLOADED",
    };

    mockHandleUpload.mockResolvedValue({
      drawing: mockDrawing as any,
      isDuplicate: true,
    });

    const pdfBuffer = Buffer.from("%PDF-1.4 duplicate mock content");

    const response = await request(app)
      .post("/drawings")
      .field("discipline", "ARCHITECTURAL")
      .attach("file", pdfBuffer, "sample.pdf");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      drawingId: "uuid-existing",
      status: "UPLOADED",
    });
  });

  it("should return 415 if the file MIME type is not a PDF", async () => {
    const txtBuffer = Buffer.from("plaintext contents");

    const response = await request(app)
      .post("/drawings")
      .field("discipline", "MECHANICAL")
      .attach("file", txtBuffer, "sample.txt");

    expect(response.status).toBe(415);
    expect(response.body.error).toContain("Only PDF is allowed");
  });

  it("should return 415 if the file is labeled application/pdf but lacks %PDF signature", async () => {
    const fakePdfBuffer = Buffer.from("this is a text file masquerading as a pdf");

    const response = await request(app)
      .post("/drawings")
      .field("discipline", "STRUCTURAL")
      .attach("file", fakePdfBuffer, "fake.pdf");

    expect(response.status).toBe(415);
    expect(response.body.error).toContain("Invalid PDF file signature");
  });

  it("should return 400 if the file is missing", async () => {
    const response = await request(app)
      .post("/drawings")
      .field("discipline", "ELECTRICAL"); // No file attached

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Missing file");
  });

  it("should return 400 if the discipline is missing", async () => {
    const pdfBuffer = Buffer.from("%PDF-1.4 mock content");

    const response = await request(app)
      .post("/drawings")
      .attach("file", pdfBuffer, "sample.pdf"); // No discipline field

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Missing discipline");
  });

  it("should return 400 if the discipline value is invalid", async () => {
    const pdfBuffer = Buffer.from("%PDF-1.4 mock content");

    const response = await request(app)
      .post("/drawings")
      .field("discipline", "INVALID_DISCIPLINE_VALUE")
      .attach("file", pdfBuffer, "sample.pdf");

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Invalid discipline");
  });
});
