import { Chat } from "../chats/chat.model";

export const ensureAiChatForUser = async (userId: string) => {
  let chat = await Chat.findOne({
    type: "ai",
    members: userId,
  });

  if (!chat) {
    chat = await Chat.create({
      type: "ai",
      members: [userId],
      title: "AI Assistant",
      createdBy: userId,
    });
  }

  return chat;
};