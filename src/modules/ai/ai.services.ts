// ==================================================================================

// import OpenAI from "openai";
import { env } from "../../config/env";
// import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

// const client = new OpenAI({
//   apiKey: env.OPENAI_API_KEY,
// });

// export const aiService = {
//   generate: async (
//     messages: { role: "system" | "user" | "assistant"; content: string }[],
//   ) => {
//     if (!env.OPENAI_API_KEY) {
//       throw new Error("Missing OPENAI_API_KEY in env");
//     }

//     const res = await client.chat.completions.create({
//       model: env.AI_MODEL,
//       messages,
//       temperature: 0.7,
//     });

//     return res.choices[0]?.message?.content || "Sorry, I couldn't respond.";
//   },
// };

// // ==================================================================================

// const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);

// // Use FREE fast model
// const model = genAI.getGenerativeModel({
//   model: "gemini-1.5-pro",
// });

// export const aiGeminiService = {
//   generate: async (
//     messages: { role: "system" | "user" | "assistant"; content: string }[],
//   ) => {
//     if (!env.GEMINI_API_KEY) {
//       throw new Error("Missing GEMINI_API_KEY in env");
//     }

//     /**
//      * Gemini expects ONE prompt
//      * So we convert chat history → prompt string
//      */

//     const formatted = messages
//       .map((m) => {
//         if (m.role === "system") {
//           return `System: ${m.content}`;
//         }
//         if (m.role === "user") {
//           return `User: ${m.content}`;
//         }
//         return `Assistant: ${m.content}`;
//       })
//       .join("\n");

//     const result = await model.generateContent(formatted);
//     const response = await result.response;
//     const text = response.text();

//     return text || "Sorry, I couldn't respond.";
//   },
// };

const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});


export const aiGroqService = {
  generate: async (
    messages: { role: "system" | "user" | "assistant"; content: string }[],
  ) => {
    if (!env.GROQ_API_KEY) {
      throw new Error("Missing GROQ_API_KEY in env");
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    });
    return completion.choices[0]?.message?.content || "Sorry, I couldn't respond.";
  },
};