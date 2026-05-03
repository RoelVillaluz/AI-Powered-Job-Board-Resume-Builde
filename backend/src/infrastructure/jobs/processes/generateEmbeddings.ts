import { shutdownWorkers } from "../workers/workersRegistry.js";
import { shutdownWorkersV2 } from "../workers/workerRegistryV2.js";
import logger from "../../../utils/logger.js";

logger.info("[EMBEDDING WORKERS] Initialized");

process.on("SIGTERM", async () => {
    await Promise.all([
        shutdownWorkers(),
        shutdownWorkersV2(),
    ]);
    process.exit(0);
});

process.on("SIGINT", async () => {
    await Promise.all([
        shutdownWorkers(),
        shutdownWorkersV2(),
    ]);
    process.exit(0);
});