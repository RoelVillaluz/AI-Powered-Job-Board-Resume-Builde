// src/server.js
import "./config/env.js";
import { createServer } from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./sockets/index.js";
import logger from "./utils/logger.js";
import "./infrastructure/jobs/processes/generateEmbeddings.js";   // boots all workers

const server = createServer(app);

initSocket(server);
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Server running at http://localhost:${PORT}`);
});

const shutdown = async () => {
    logger.info('🛑 Shutting down gracefully...');
    server.close(() => logger.info('✅ HTTP server closed'));
    process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);