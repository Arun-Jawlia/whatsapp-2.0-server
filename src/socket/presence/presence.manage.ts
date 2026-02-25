const onlineUsers = new Map<string, Set<string>>();
// userId -> socketIds

export const addUserSocket = (userId: string, socketId: string) => {
  const sockets = onlineUsers.get(userId);

  if (!sockets) {
    onlineUsers.set(userId, new Set([socketId]));
    return true; // user just came online
  }

  sockets.add(socketId);
  return false; // user was already online
};

export const removeUserSocket = (userId: string, socketId: string) => {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return false;

  sockets.delete(socketId);

  if (sockets.size === 0) {
    onlineUsers.delete(userId);
    return true; // user fully offline
  }

  return false;
};

export const getOnlineUserIds = () => {
  return Array.from(onlineUsers.keys());
};

export const isUserOnline = (userId: string) => {
  return onlineUsers.has(userId);
};
