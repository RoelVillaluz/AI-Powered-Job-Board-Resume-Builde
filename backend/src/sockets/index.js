import { Server } from "socket.io";
import { registerSocketHandlers } from "./handlers.js";
import logger from "../utils/logger.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    registerSocketHandlers(io, socket);
  });

  return io;
};

export const getIO = () => {
    if (!io) {
        logger.warn('Socket.io not initialized — skipping emit');
        return null;
    }
    return io;
};