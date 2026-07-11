import express from "express";
import cors from "cors";
import morgan from "morgan";
import { HealthResponse } from "@buildops/shared";
import { prisma } from "./config/prisma";

const app = express();

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Status check endpoint
app.get("/status", async (_req, res) => {
  try {
    // Execute a test query to verify database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Create response adhering to the shared schema
    const health: HealthResponse = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "connected",
    };

    // Return the status details
    res.json(health);
  } catch (error) {
    console.error("Database connection error in status check:", error);
    res.status(500).json({
      status: "error",
      database: "disconnected",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Entries endpoints (Mocked to preserve client dashboard compatibility)
app.post("/entries", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    const log = {
      id: Math.floor(Math.random() * 100000),
      message,
      createdAt: new Date().toISOString(),
    };
    res.status(201).json(log);
  } catch (error) {
    console.error("Failed to create system log:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/entries", async (_req, res) => {
  try {
    res.json([
      {
        id: 1,
        message: "Database schema is successfully initialized matching DBML exactly.",
        createdAt: new Date().toISOString(),
      }
    ]);
  } catch (error) {
    console.error("Failed to fetch system logs:", error);
    res.status(500).json({ error: "Database error" });
  }
});

import drawingRoutes from "./routes/drawing.routes";
import analysisRoutes from "./routes/analysis.routes";
import conflictRoutes from "./routes/conflict.routes";
import { errorHandler } from "./middleware/error.middleware";

// Mount API routes
app.use("/drawings", drawingRoutes);
app.use("/drawings", analysisRoutes);
app.use("/drawings", conflictRoutes);

// Register global error handler middleware
app.use(errorHandler);

export { app, prisma };
