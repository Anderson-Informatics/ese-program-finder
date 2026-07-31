import mongoose from "mongoose";

let connectionPromise: Promise<typeof mongoose> | null = null;

export function connectToDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose);
  }

  if (!connectionPromise) {
    const config = useRuntimeConfig();
    const uri = config.MONGO_URI || process.env.MONGO_URI;

    if (!uri) {
      return Promise.reject(
        new Error("MONGO_URI is not defined in the runtime environment")
      );
    }

    connectionPromise = mongoose
      .connect(uri, {
        bufferCommands: false,
        maxPoolSize: 10,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  return connectionPromise;
}
