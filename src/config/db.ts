import mongoose from "mongoose";
import { env } from "./env";

export const connectToDB = async () => {
  try {
    if (!env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in environment variables");
    }
    await mongoose.connect(env.MONGO_URI);
    console.log(`Database connection successfully`);
  } catch (error) {
    console.log("Error in Database connection");
    process.exit(1);
  }
};
