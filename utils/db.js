import mongoose from "mongoose";
import dns from "node:dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

let isConnected = false;
let connecting = null;
let failedAt = 0;
const RETRY_AFTER_MS = 3000;

/**
 * Resilient SRV resolver for environments where the default local DNS resolver
 * refuses or does not support SRV lookups (e.g. Windows local loopback DNS).
 */
async function resolveSrvUri(uri) {
  if (!uri || !uri.startsWith("mongodb+srv://")) return uri;
  try {
    const m = /^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?$/.exec(uri);
    if (!m) return uri;
    const [_, user, pass, host, dbPath = "", query = ""] = m;

    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch {}

    const srvRecords = await new Promise((res, rej) =>
      dns.resolveSrv("_mongodb._tcp." + host, (err, r) => (err ? rej(err) : res(r)))
    );
    if (!srvRecords || srvRecords.length === 0) return uri;

    let txtOptions = "";
    try {
      const txtRecords = await new Promise((res, rej) =>
        dns.resolveTxt(host, (err, r) => (err ? rej(err) : res(r)))
      );
      txtOptions = (txtRecords || []).flat().join("&");
    } catch {}

    const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");
    const params = new URLSearchParams(txtOptions || "");
    if (query) {
      const extraParams = new URLSearchParams(query.replace(/^\?/, ""));
      for (const [k, v] of extraParams.entries()) params.set(k, v);
    }
    if (!params.has("tls") && !params.has("ssl")) params.set("tls", "true");
    if (!params.has("authSource")) params.set("authSource", "admin");

    return `mongodb://${user}:${pass}@${hosts}${dbPath}?${params.toString()}`;
  } catch {
    return uri;
  }
}

/**
 * Connect to MongoDB.
 *
 * `bufferCommands: false` — by default Mongoose queues every query while it is
 * disconnected and rejects each one ten seconds later. Off, a query fails at once
 * and the caller's fallback runs while the visitor is still waiting a normal amount
 * of time.
 */
export default async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  if (connecting) return connecting;
  if (failedAt && Date.now() - failedAt < RETRY_AFTER_MS) {
    throw new Error("MongoDB is unreachable");
  }

  const rawUri = (process.env.MONGO_URI || "").trim();
  const cleanUri = rawUri.replace(/\/+(\?)/, "$1").replace(/\/+$/, "");

  connecting = (async () => {
    const uriToConnect = await resolveSrvUri(cleanUri);
    return mongoose.connect(uriToConnect, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    });
  })()
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
