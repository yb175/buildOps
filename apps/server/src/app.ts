import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { HealthResponse } from "@buildops/shared";

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Health check endpoint
app.get("/health", async (_req, res) => {
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

    // Return the health status details
    res.json(health);
  } catch (error) {
    console.error("Database connection error in health check:", error);
    res.status(500).json({
      status: "error",
      database: "disconnected",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Extra endpoint to insert a log and query database logs to demonstrate real ORM use
app.post("/logs", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    const log = await prisma.systemLog.create({
      data: { message },
    });
    res.status(201).json(log);
  } catch (error) {
    console.error("Failed to create system log:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/logs", async (_req, res) => {
  try {
    const logs = await prisma.systemLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    res.json(logs);
  } catch (error) {
    console.error("Failed to fetch system logs:", error);
    res.status(500).json({ error: "Database error" });
  }
});

export { app, prisma };
