const connectedUsers = new Map();

export const addUser = (userId, socketId) => {
  connectedUsers.set(userId, socketId);
};

export const removeUser = (userId) => {
  connectedUsers.delete(userId);
};

export const getSocketId = (userId) => {
  return connectedUsers.get(userId);
};