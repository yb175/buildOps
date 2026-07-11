import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { app } from "../../app";
import { prisma } from "../../config/prisma";
import { GeminiProvider } from "../../providers/gemini.provider";

describe("rfi.routes integration test", () => {
  let createdDrawingId: string;
  let createdConflictId: string;

  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.stubEnv("GEMINI_API_KEY", "mock-gemini-key");

    // 1. Seed a drawing record
    const drawing = await prisma.drawing.create({
      data: {
        hash: `test-hash-rfi-${Date.now()}`,
        fileName: "rfi-drawing.pdf",
        fileUrl: "https://cloudinary.com/test-pdf",
        publicId: "cloudinary-id-test",
        discipline: "ARCHITECTURAL",
        status: "PARSED",
        parsedJson: {
          schemaVersion: "1.0",
          metadata: {
            title: "Test Layout",
            drawingNumber: "A-101",
            discipline: "ARCHITECTURAL",
          },
          rooms: [],
          structural: { foundations: [], columns: [], beams: [], slabs: [], walls: [], gridLines: [] },
          openings: { doors: [], windows: [] },
          fixtures: [],
          annotations: [],
          schedules: [],
          notes: [],
        },
      },
    });
    createdDrawingId = drawing.id;

    // 2. Seed a conflict record linked to the drawing
    const conflict = await prisma.conflict.create({
      data: {
        drawingId: createdDrawingId,
        category: "GEOMETRY",
        severity: "HIGH",
        title: "Door intersects Column",
        description: "Door D4 intersects Column C2",
        entityA: "Door D4",
        entityB: "Column C2",
        recommendation: "Shift door to clear column.",
      },
    });
    createdConflictId = conflict.id;
  });

  afterEach(async () => {
    try {
      if (createdDrawingId) {
        await prisma.rfi.deleteMany({ where: { drawingId: createdDrawingId } });
        await prisma.conflict.deleteMany({ where: { drawingId: createdDrawingId } });
        await prisma.drawing.delete({ where: { id: createdDrawingId } });
      }
    } catch (e) {
      // Ignore cleanup error if already deleted
    }
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("should generate RFIs from conflicts on POST and return them", async () => {
    const postResponse = await request(app)
      .post(`/drawings/${createdDrawingId}/rfis`);

    expect(postResponse.status).toBe(200);
    expect(postResponse.body.drawingId).toBe(createdDrawingId);
    expect(postResponse.body.rfis).toBeDefined();
    expect(postResponse.body.rfis).toHaveLength(1);

    const rfi = postResponse.body.rfis[0];
    expect(rfi.conflictId).toBe(createdConflictId);
    expect(rfi.title).toContain("Door intersects Column");
    expect(rfi.priority).toBe("HIGH");
    expect(rfi.description).toContain("door layout was found to intersect");
    expect(rfi.question).toContain("Confirm correct coordinates for door assembly");

    // Verify it is saved in the database
    const dbRfis = await prisma.rfi.findMany({
      where: { drawingId: createdDrawingId },
    });
    expect(dbRfis).toHaveLength(1);
    expect((dbRfis[0] as any).conflictHash).toBeDefined();
  });

  it("should retrieve cached RFIs on GET", async () => {
    // 1. Run POST to generate RFIs
    await request(app).post(`/drawings/${createdDrawingId}/rfis`);

    // 2. Fetch via GET
    const getResponse = await request(app)
      .get(`/drawings/${createdDrawingId}/rfis`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.drawingId).toBe(createdDrawingId);
    expect(getResponse.body.rfis).toHaveLength(1);
  });

  it("should bypass Gemini and return cached RFIs on subsequent POST requests if conflict hash matches", async () => {
    // 1. First generation POST
    await request(app).post(`/drawings/${createdDrawingId}/rfis`);

    // 2. Spy on GeminiProvider
    const geminiSpy = vi.spyOn(GeminiProvider.prototype, "generateJson");

    // 3. Second POST (should hit cache)
    const postResponse = await request(app)
      .post(`/drawings/${createdDrawingId}/rfis`);

    expect(postResponse.status).toBe(200);
    expect(postResponse.body.rfis).toHaveLength(1);
    expect(geminiSpy).not.toHaveBeenCalled();
  });

  it("should return 404 on GET if drawing is not found", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const getResponse = await request(app)
      .get(`/drawings/${fakeId}/rfis`);

    expect(getResponse.status).toBe(404);
  });
});
