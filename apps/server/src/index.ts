import "./config/env";
import { app, prisma } from "./app";
import { seedDatabase } from "./config/seed";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // Run seed check
  await seedDatabase();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("Shutting down server...");
    server.close(async () => {
      console.log("HTTP server closed.");
      await prisma.$disconnect();
      console.log("Prisma client disconnected.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
});
