import OpenAI from "openai";
import { env } from "../../config/env";

const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export const aiService = {
  generate: async (
    messages: { role: "system" | "user" | "assistant"; content: string }[],
  ) => {
    if (!env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY in env");
    }

    const res = await client.chat.completions.create({
      model: env.AI_MODEL,
      messages,
      temperature: 0.7,
    });

    return res.choices[0]?.message?.content || "Sorry, I couldn't respond.";
  },
};
