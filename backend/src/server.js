// src/server.js

import "./config/env.js";
import { createServer } from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./sockets/index.js";
import logger from "./utils/logger.js";
import "./infrastructure/jobs/processes/generateEmbeddings.js";   // boots all workers
import { connectPinecone } from "./config/pinecone.js";
import { startReconciliationCron, stopReconciliationCron } from "./infrastructure/reconciliation/cron/reconciliationCron.js";
import { startQueueDepthPoller, stopQueueDepthPoller } from "./infrastructure/monitoring/queueDepthPoller.js";

const server = createServer(app);

initSocket(server);
await connectDB();
await connectPinecone();

// after connectDB() + connectPinecone():
startReconciliationCron();
startQueueDepthPoller();

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Server running at http://localhost:${PORT}`);
});

const shutdown = async () => {
    logger.info('🛑 Shutting down gracefully...');

    // Stop cron first — prevent new runs from starting
    stopReconciliationCron();
    stopQueueDepthPoller();

    // Close HTTP server — stop accepting new requests
    await new Promise(resolve => server.close(resolve));
    logger.info('✅ HTTP server closed');

    // Shut down BullMQ workers — let in-flight jobs complete
    await shutdownWorkersV2();

    logger.info('✅ Workers closed');
    process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);