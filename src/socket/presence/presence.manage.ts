const onlineUsers = new Map<string, Set<string>>();
// userId -> socketIds

export const addUserSocket = (userId: string, socketId: string) => {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId)!.add(socketId);
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