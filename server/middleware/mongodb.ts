import { connectToDatabase } from "~~/server/utils/mongo";

export default defineEventHandler(async (event) => {
  if (!event.path?.startsWith("/api/")) {
    return;
  }

  try {
    await connectToDatabase();
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw createError({
      statusCode: 503,
      statusMessage: "Database unavailable",
    });
  }
});
