import express from "express";
import cors from "cors";
import { setupStaticAssets } from "./config/staticAssets.js";
import { registerRoutes } from "./routes/index.js";
import logger from "./utils/logger.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Log every request
app.use(requestLogger);

// Parse JSON
app.use(cors());
app.use(express.json());

// Serve static assets
setupStaticAssets(app);

// Register routes
registerRoutes(app);

// Error handling
app.use(errorHandler);

// Example of logging custom messages
logger.info("✅ Express app initialized");

export default app;
