import { Server } from "socket.io";
import { registerSocketHandlers } from "./handlers.js";

export const initSocket = (server) => {
  const io = new Server(server, {
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