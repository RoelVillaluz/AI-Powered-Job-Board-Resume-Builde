import express from "express";
import cors from "cors";
import { setupStaticAssets } from "./config/staticAssets.js";
import { registerRoutes } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

setupStaticAssets(app);
registerRoutes(app);

app.use(errorHandler);

export default app;
