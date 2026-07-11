import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Ensure drawing service is not mocked in this unit test
vi.unmock("../../services/drawing.service");

import { DrawingService } from "../../services/drawing.service";
import { DrawingRepository } from "../../repositories/drawing.repository";
import * as cloudinaryProvider from "../../providers/cloudinary.provider";
import { validateDiscipline } from "../../validations/drawing.validation";
import { Discipline } from "@prisma/client";

// Mock dependencies
vi.mock("../../repositories/drawing.repository");
vi.mock("../../providers/cloudinary.provider");

describe("drawing.service", () => {
  let drawingService: DrawingService;
  let mockDrawingRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDrawingRepository = new DrawingRepository() as any;
    drawingService = new DrawingService(mockDrawingRepository);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should upload and create a new drawing with the correct discipline", async () => {
    // Arrange
    const fileBuffer = Buffer.from("New PDF content");
    const fileName = "drawing.pdf";
    const discipline = Discipline.STRUCTURAL;
    const mockDrawing = {
      id: "uuid-1",
      hash: "new-hash",
      fileName,
      fileUrl: "http://cloudinary.com/pdf",
      publicId: "public-id",
      status: "UPLOADED",
      discipline: Discipline.STRUCTURAL,
      parsedJson: null,
      createdAt: new Date(),
    };

    mockDrawingRepository.findByHash.mockResolvedValue(null);
    mockDrawingRepository.create.mockResolvedValue(mockDrawing);
    
    vi.spyOn(cloudinaryProvider, "uploadToCloudinary").mockResolvedValue({
      secure_url: "http://cloudinary.com/pdf",
      public_id: "public-id",
    });

    // Act
    const result = await drawingService.handleUpload(fileBuffer, fileName, discipline);

    // Assert
    expect(mockDrawingRepository.findByHash).toHaveBeenCalled();
    expect(cloudinaryProvider.uploadToCloudinary).toHaveBeenCalledWith(fileBuffer, fileName);
    expect(mockDrawingRepository.create).toHaveBeenCalledWith({
      hash: expect.any(String),
      fileName,
      fileUrl: "http://cloudinary.com/pdf",
      publicId: "public-id",
      discipline: Discipline.STRUCTURAL,
    });
    expect(result.isDuplicate).toBe(false);
    expect(result.drawing).toEqual(mockDrawing);
  });

  it("should return the existing drawing without uploading to Cloudinary if hash match is found", async () => {
    // Arrange
    const fileBuffer = Buffer.from("Existing PDF content");
    const fileName = "drawing.pdf";
    const discipline = Discipline.ARCHITECTURAL;
    const mockDrawing = {
      id: "uuid-2",
      hash: "existing-hash",
      fileName,
      fileUrl: "http://cloudinary.com/pdf",
      publicId: "public-id",
      status: "UPLOADED",
      discipline: Discipline.ARCHITECTURAL,
      parsedJson: null,
      createdAt: new Date(),
    };

    mockDrawingRepository.findByHash.mockResolvedValue(mockDrawing);

    // Act
    const result = await drawingService.handleUpload(fileBuffer, fileName, discipline);

    // Assert
    expect(mockDrawingRepository.findByHash).toHaveBeenCalled();
    expect(cloudinaryProvider.uploadToCloudinary).not.toHaveBeenCalled();
    expect(mockDrawingRepository.create).not.toHaveBeenCalled();
    expect(result.isDuplicate).toBe(true);
    expect(result.drawing).toEqual(mockDrawing);
  });
});

describe("discipline validation utility", () => {
  it("should accept valid disciplines", () => {
    expect(validateDiscipline("STRUCTURAL")).toBe(true);
    expect(validateDiscipline("ARCHITECTURAL")).toBe(true);
    expect(validateDiscipline("UNKNOWN")).toBe(true);
  });

  it("should reject invalid disciplines", () => {
    expect(validateDiscipline("INVALID_DISCIPLINE")).toBe(false);
    expect(validateDiscipline("")).toBe(false);
    expect(validateDiscipline(null)).toBe(false);
  });
});
