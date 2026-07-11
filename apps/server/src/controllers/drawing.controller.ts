import { Request, Response, NextFunction } from "express";
import { DrawingService } from "../services/drawing.service";
import { validateDiscipline } from "../validations/drawing.validation";
import { prisma } from "../config/prisma";
import { Discipline } from "@prisma/client";
import { NotFoundError } from "../errors/not-found.error";

export class DrawingController {
  private drawingService: DrawingService;

  constructor(
    drawingService = new DrawingService()
  ) {
    this.drawingService = drawingService;
  }

  uploadDrawing = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      if (!file) {
        console.warn("[DrawingController] Upload failed: Missing file");
        return res.status(400).json({ error: "Missing file" });
      }

      const { discipline, projectName, drawingNo, revision } = req.body;
      if (!discipline) {
        console.warn(`[DrawingController] Upload failed: Missing discipline for file: ${file.originalname}`);
        return res.status(400).json({ error: "Missing discipline" });
      }

      if (!validateDiscipline(discipline)) {
        console.warn(`[DrawingController] Upload failed: Invalid discipline '${discipline}' for file: ${file.originalname}`);
        return res.status(400).json({ error: "Invalid discipline" });
      }

      console.log(`[DrawingController] Received upload request for file: ${file.originalname}, discipline: ${discipline}, project: ${projectName}`);

      const { drawing, isDuplicate } = await this.drawingService.handleUpload(
        file.buffer,
        file.originalname,
        discipline as Discipline,
        projectName,
        drawingNo,
        revision
      );

      const responseBody = {
        drawingId: drawing.id,
        status: drawing.status,
      };

      if (isDuplicate) {
        console.log(`[DrawingController] Duplicate drawing detected. Returning cached drawing ID: ${drawing.id}`);
        return res.status(200).json(responseBody);
      }

      console.log(`[DrawingController] New drawing uploaded successfully. Generated ID: ${drawing.id}`);
      return res.status(201).json(responseBody);
    } catch (error) {
      console.error("[DrawingController] Unexpected error in uploadDrawing:", error);
      next(error);
    }
  };

  getAllDrawings = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const drawings = await prisma.drawing.findMany({
        include: {
          _count: {
            select: { conflicts: true, rfis: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(drawings.map(d => ({
        ...d,
        conflictsCount: (d as any)._count?.conflicts || 0,
        rfisCount: (d as any)._count?.rfis || 0,
      })));
    } catch (error) {
      next(error);
    }
  };

  getProjects = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const drawings = (await prisma.drawing.findMany({
        select: {
          id: true,
          projectName: true,
          createdAt: true,
          status: true,
          _count: {
            select: { conflicts: true, rfis: true },
          },
        } as any,
      })) as any[];

      const projectMap = Object.create(null);

      // Stable static baseline date for demo projects
      const baseDate = new Date("2026-07-11T14:00:00Z");

      const isDatabaseEmpty = drawings.length === 0;

      if (isDatabaseEmpty) {
        // Return full empty-state demo data
        projectMap["500 Gaj Residence"] = {
          name: "500 Gaj Residence",
          lastUpdated: new Date(baseDate.getTime() - 12 * 60 * 1000),
          status: "IN REVIEW",
          issuesCount: 17,
          rfiCount: 4,
          manualTimeSaved: "2h 14m",
        };
        projectMap["Villa 302"] = {
          name: "Villa 302",
          lastUpdated: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000),
          status: "READY",
          issuesCount: 4,
          rfiCount: 1,
          manualTimeSaved: "0h 32m",
        };
        projectMap["Mall Expansion Phase 1"] = {
          name: "Mall Expansion Phase 1",
          lastUpdated: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000),
          status: "HIGH PRIORITY",
          issuesCount: 32,
          rfiCount: 9,
          manualTimeSaved: "4h 16m",
        };
      } else {
        // Initialize default empty projects with zero stats to guarantee they show up
        projectMap["500 Gaj Residence"] = {
          name: "500 Gaj Residence",
          lastUpdated: new Date(baseDate.getTime() - 12 * 60 * 1000),
          status: "READY",
          issuesCount: 0,
          rfiCount: 0,
          manualTimeSaved: "0h 0m",
        };
        projectMap["Villa 302"] = {
          name: "Villa 302",
          lastUpdated: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000),
          status: "READY",
          issuesCount: 0,
          rfiCount: 0,
          manualTimeSaved: "0h 0m",
        };
        projectMap["Mall Expansion Phase 1"] = {
          name: "Mall Expansion Phase 1",
          lastUpdated: new Date(baseDate.getTime() - 24 * 60 * 60 * 1000),
          status: "HIGH PRIORITY",
          issuesCount: 0,
          rfiCount: 0,
          manualTimeSaved: "0h 0m",
        };

        // Populate from real database records
        drawings.forEach((d) => {
          const projName = d.projectName || "500 Gaj Residence";
          
          // Validate project name to prevent prototype pollution or empty/garbage names
          if (typeof projName !== "string" || projName.trim() === "") return;

          if (!projectMap[projName]) {
            projectMap[projName] = {
              name: projName,
              lastUpdated: d.createdAt,
              status: "READY",
              issuesCount: 0,
              rfiCount: 0,
              manualTimeSaved: "0h 0m",
            };
          }

          const proj = projectMap[projName];
          // Use real drawing date if newer
          if (d.createdAt > proj.lastUpdated) {
            proj.lastUpdated = d.createdAt;
          }

          proj.issuesCount += d._count?.conflicts || 0;
          proj.rfiCount += d._count?.rfis || 0;

          if (d.status === "FAILED") {
            proj.status = "HIGH PRIORITY";
          } else if (d.status === "PARSING" || d.status === "UPLOADED") {
            proj.status = "IN REVIEW";
          }
        });

        // Compute manual time saved: 8 mins per issue
        Object.values(projectMap).forEach((p: any) => {
          const totalMinutes = p.issuesCount * 8;
          if (totalMinutes > 0) {
            const hrs = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            p.manualTimeSaved = `${hrs}h ${mins}m`;
          } else {
            p.manualTimeSaved = "0h 0m";
          }
        });
      }

      res.json(Object.values(projectMap));
    } catch (error) {
      next(error);
    }
  };

  getProjectDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectName } = req.params;
      const drawings = await prisma.drawing.findMany({
        where: { projectName } as any,
        include: {
          conflicts: true,
          rfis: true,
        },
        orderBy: { createdAt: "desc" },
      });

      // Find all RFIs belonging to this project
      const rfis = await prisma.rfi.findMany({
        where: {
          drawing: { projectName } as any,
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        name: projectName,
        drawings: drawings.map(d => ({
          ...d,
          conflictsCount: (d as any).conflicts?.length || 0,
          rfisCount: (d as any).rfis?.length || 0,
        })),
        rfis,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteDrawing = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.drawingService.deleteDrawing(id);
      res.json({ success: true, message: "Drawing deleted successfully" });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  };
}
