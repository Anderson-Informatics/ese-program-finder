import type { Nitro } from "nitropack";
import { connectToDatabase } from "~~/server/utils/mongo";

export default async (_nitroApp: Nitro) => {
  try {
    await connectToDatabase();
    console.log("Connected to MongoDB");
  } catch (e) {
    console.error("MongoDB warm-up connection failed:", e);
  }
};
