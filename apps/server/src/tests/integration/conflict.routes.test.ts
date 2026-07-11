import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { app } from "../../app";
import { prisma } from "../../config/prisma";

describe("conflict.routes integration test", () => {
  let createdDrawingId: string;

  beforeEach(async () => {
    vi.restoreAllMocks();

    // Seed a drawing record in PostgreSQL
    const drawing = await prisma.drawing.create({
      data: {
        hash: `test-hash-conflict-${Date.now()}`,
        fileName: "conflict-drawing.pdf",
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
          rooms: [
            { id: "R-01", name: "Lobby", number: "101" },
            { id: "R-02", name: "Lobby", number: "101" }, // Duplicate Room name & number
          ],
          structural: {
            foundations: [],
            columns: [],
            beams: [],
            slabs: [],
            walls: [],
            gridLines: [],
          },
          openings: {
            doors: [],
            windows: [],
          },
          fixtures: [],
          annotations: [],
          schedules: [],
          notes: [],
        },
      },
    });
    createdDrawingId = drawing.id;
  });

  afterEach(async () => {
    try {
      if (createdDrawingId) {
        await prisma.conflict.deleteMany({ where: { drawingId: createdDrawingId } });
        await prisma.drawing.delete({ where: { id: createdDrawingId } });
      }
    } catch (e) {
      // Ignore
    }
  });

  it("should detect conflicts, persist them in database, and return results on POST", async () => {
    const postResponse = await request(app)
      .post(`/drawings/${createdDrawingId}/conflicts`);

    expect(postResponse.status).toBe(200);
    expect(postResponse.body.drawingId).toBe(createdDrawingId);
    expect(postResponse.body.conflicts.length).toBeGreaterThan(0);

    // Verify it is saved in the database
    const dbConflicts: any[] = await prisma.conflict.findMany({
      where: { drawingId: createdDrawingId },
    });
    expect(dbConflicts.length).toBe(postResponse.body.conflicts.length);
    expect(dbConflicts[0].category).toBeDefined();
    expect(dbConflicts[0].title).toBeDefined();
  });

  it("should retrieve persisted conflicts on GET", async () => {
    // 1. Run POST to create conflicts
    await request(app).post(`/drawings/${createdDrawingId}/conflicts`);

    // 2. Fetch via GET
    const getResponse = await request(app)
      .get(`/drawings/${createdDrawingId}/conflicts`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.drawingId).toBe(createdDrawingId);
    expect(getResponse.body.conflicts.length).toBeGreaterThan(0);
  });

  it("should return 404 on GET if drawing is not found", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const getResponse = await request(app)
      .get(`/drawings/${fakeId}/conflicts`);

    expect(getResponse.status).toBe(404);
  });
});
