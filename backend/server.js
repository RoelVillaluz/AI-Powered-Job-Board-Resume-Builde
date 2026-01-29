// src/server.js
import dotenv from "dotenv";
import { createServer } from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./sockets/index.js";
import "./queues/workers.js";
import logger from "./utils/logger.js";

// Pick env file based on NODE_ENV
const envFile = process.env.NODE_ENV === "production"
  ? ".env.production"
  : process.env.NODE_ENV === "test"
    ? ".env.test"
    : ".env.dev";

dotenv.config({ path: envFile });

const server = createServer(app);

// Initialize sockets
initSocket(server);

// Connect DB
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 Server running at http://localhost:${PORT}`);
  logger.info(`✅ Queue workers active and processing jobs`);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('🛑 Shutting down gracefully...');
  
  // Close server
  server.close(() => {
    logger.info('✅ HTTP server closed');
  });
  
  // Workers will close via their own SIGTERM/SIGINT handlers
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);