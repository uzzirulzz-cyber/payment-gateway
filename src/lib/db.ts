import mongoose from "mongoose";
import { MONGODB_URI, MONGODB_DB_NAME } from "@/lib/env";

/**
 * MongoDB Atlas connection.
 *
 * Uses the hardcoded URI from src/lib/env.ts. Caches the connection across
 * hot reloads in development to avoid opening too many connections.
 */

declare global {
  var __mongooseConn:
    | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
    | undefined;
}

const cached =
  global.__mongooseConn ?? (global.__mongooseConn = { conn: null, promise: null });

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      dbName: MONGODB_DB_NAME,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
    console.log("[db] Connected to MongoDB Atlas");
  } catch (e) {
    cached.promise = null;
    console.error("[db] MongoDB connection error:", e);
    throw e;
  }

  return cached.conn;
}

/**
 * Convenience: connect to DB and return nothing.
 * Use `await connectDB()` at the top of any API route that needs the DB.
 */
export const db = {
  async connect() {
    await connectDB();
  },
};

// Re-export models so existing code that imports from "@/lib/db" works.
export { Order } from "@/lib/models/order";
export { Theme } from "@/lib/models/theme";
