import { Server } from "socket.io";
import { AuthSocket } from "../socket.types";
import { Message } from "../../modules/messages/message.model";

export const registerReactionEvents = (io: Server, socket: AuthSocket) => {
  socket.on("message:react", async ({ messageId, emoji }, ack) => {
    if (!messageId || !emoji) {
      return ack?.({ ok: false, error: "Invalid payload" });
    }

    const userId = socket.userId;

    // Try REMOVE first (toggle off)
    const removed = await Message.findOneAndUpdate(
      {
        _id: messageId,
        [`reactions.${emoji}`]: userId,
      },
      {
        $pull: { [`reactions.${emoji}`]: userId },
      },
      { new: true },
    ).select("chatId");

    // If removed → emit unreact
    if (removed) {
      io.to(`chat:${removed.chatId}`).emit("message:reaction", {
        messageId,
        emoji,
        userId,
        action: "removed",
      });

      return ack?.({ ok: true, action: "removed" });
    }

    // Else ADD reaction
    const added = await Message.findByIdAndUpdate(
      messageId,
      {
        $addToSet: { [`reactions.${emoji}`]: userId },
      },
      { new: true },
    ).select("chatId");

    if (!added) {
      return ack?.({ ok: false, error: "Message not found" });
    }

    io.to(`chat:${added.chatId}`).emit("message:reaction", {
      messageId,
      emoji,
      userId,
      action: "added",
    });

    ack?.({ ok: true, action: "added" });
  });
};
