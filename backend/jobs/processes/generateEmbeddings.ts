import { embeddingWorkers, shutdownWorkers } 
from "../../infrastructure/embedding/workers/workersRegistry";

import logger from "../../utils/logger";

logger.info("[EMBEDDING WORKERS] Initialized");

process.on("SIGTERM", async () => {
    await shutdownWorkers();
    process.exit(0);
});

process.on("SIGINT", async () => {
    await shutdownWorkers();
    process.exit(0);
});