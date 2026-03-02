// type Presence = {
//   sockets: Set<string>;
//   lastActive: number;
// };

// const onlineUsers = new Map<string, Set<string>>();
// // userId -> socketIds

// export const addUserSocket = (userId: string, socketId: string) => {
//   const sockets = onlineUsers.get(userId);

//   if (!sockets) {
//     onlineUsers.set(userId, new Set([socketId]));
//     return true; // user just came online
//   }

//   sockets.add(socketId);
//   return false; // user was already online
// };

// export const removeUserSocket = (userId: string, socketId: string) => {
//   const sockets = onlineUsers.get(userId);
//   if (!sockets) return false;

//   sockets.delete(socketId);

//   if (sockets.size === 0) {
//     onlineUsers.delete(userId);
//     return true; // user fully offline
//   }

//   return false;
// };

// export const getOnlineUsers = () => {
//   return Array.from(onlineUsers.keys());
// };

// export const isUserOnline = (userId: string) => {
//   return onlineUsers.has(userId);
// };

type Presence = {
  sockets: Set<string>;
  lastActive: number;
  status: "online" | "away";
};

const users = new Map<string, Presence>();

export const addUser = (userId: string, socketId: string) => {
  const existing = users.get(userId);

  if (!existing) {
    users.set(userId, {
      sockets: new Set([socketId]),
      lastActive: Date.now(),
      status: "online",
    });
    return true;
  }

  existing.sockets.add(socketId);
  existing.lastActive = Date.now();
  return false;
};

export const removeUser = (userId: string, socketId: string) => {
  const existing = users.get(userId);
  if (!existing) return false;

  existing.sockets.delete(socketId);

  if (existing.sockets.size === 0) {
    users.delete(userId);
    return true;
  }

  return false;
};

export const markActive = (userId: string) => {
  const user = users.get(userId);
  if (!user) return;

  const wasAway = user.status === "away";

  user.lastActive = Date.now();
  user.status = "online";

  return wasAway;
};

export const getPresenceSnapshot = () => {
  const snapshot: Record<string, any> = {};

  users.forEach((val, key) => {
    const idle = Date.now() - val.lastActive;

    snapshot[key] = {
      status: idle < 60_000 ? "online" : "away",
    };
  });

  return snapshot;
};
