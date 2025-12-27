// src/server.js
import dotenv from "dotenv";
import { createServer } from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./sockets/index.js";

dotenv.config();

const server = createServer(app);

// Initialize sockets
initSocket(server);

// Connect DB
await connectDB();

const PORT = process.env.dev.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
