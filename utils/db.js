import mongoose from "mongoose";

let isConnected = false;
let connecting = null;
// When the database is unreachable, every request would otherwise wait out the
// selection timeout again. Remembering the failure for a moment means the first
// request in each short window pays that wait and the rest fail instantly, so an
// outage makes the site fall back to its built-in content quickly rather than
// making every visitor wait five seconds for the same answer.
let failedAt = 0;
const RETRY_AFTER_MS = 3000;

/**
 * Connect to MongoDB.
 *
 * Two things here are deliberate, and both were the difference between a
 * database blip and the whole site going down.
 *
 * `bufferCommands: false` — by default Mongoose queues every query while it is
 * disconnected and rejects each one ten seconds later. With the database down,
 * a page that reads three documents spent thirty seconds rendering and then
 * returned a 500. Off, a query fails at once and the caller's fallback runs
 * while the visitor is still waiting a normal amount of time.
 *
 * The failure is re-thrown rather than logged and swallowed. Swallowing it left
 * every caller believing it had a connection, so their `try` blocks never ran
 * and the error surfaced later as an unhandled rejection from deep inside a
 * render. A caller that wants to carry on without the database can catch this;
 * one that cannot, fails honestly.
 */
export default async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  // Several requests arriving together must share one attempt rather than
  // opening a connection each.
  if (connecting) return connecting;
  if (failedAt && Date.now() - failedAt < RETRY_AFTER_MS) {
    throw new Error("MongoDB is unreachable");
  }

  connecting = mongoose
    .connect(process.env.MONGO_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
      isConnected = true;
      failedAt = 0;
    })
    .catch((err) => {
      isConnected = false;
      failedAt = Date.now();
      console.error("MongoDB connection error:", err.message);
      throw err;
    })
    .finally(() => {
      connecting = null;
    });

  return connecting;
}
