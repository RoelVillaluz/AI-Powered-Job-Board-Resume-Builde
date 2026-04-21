import { addUser, removeUser } from "./presence.js";

export const registerSocketHandlers = (io, socket) => {
  const { userId } = socket.handshake.auth;

  if (userId) {
    addUser(userId, socket.id);
    io.emit("user-online", userId);
  }

  socket.on("join-user-room", (userId) => {
    socket.join(userId);
  });

  socket.on("send-message", (message) => {
    io.to(message.receiverId).emit("new-message", message);
  });

  socket.on("update-message", (message) => {
    io.to(message.receiverId).emit("update-message", message);
  });

  socket.on("pin-message", (message) => {
    io.to(message.receiverId).emit("pin-message", message);
  });

  socket.on("delete-message", (message) => {
    io.to(message.receiverId).emit("delete-message", message);
  });

  socket.on("messages-seen", (data) => {
    io.emit("messages-seen", {
      ...data,
      seenAt: data.seenAt || new Date().toISOString(),
    });
  });

  socket.on("disconnect", () => {
    if (userId) {
      removeUser(userId);
      io.emit("user-offline", userId);
    }
  });
};