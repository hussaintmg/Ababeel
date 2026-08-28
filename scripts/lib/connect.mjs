/**
 * Shared connection guard for the seed scripts.
 *
 * A MongoDB URI with no database name — `mongodb://host:27017/?opts` — is
 * perfectly valid and silently resolves to the `test` database. A seed script
 * that accepts one writes a whole homepage into a database nothing reads, and
 * the only symptom is "nothing changed on the site". So: refuse it, say what
 * is wrong, and show how to find the right name.
 *
 * It also reads MONGO_URI out of the project's own .env, because the surest
 * way to end up connected to the wrong database is to retype the connection
 * string on the command line.
 */
import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

/**
 * One value from the project's env files.
 *
 * Deliberately minimal: `KEY=value`, optionally quoted, `#` comments and blank
 * lines skipped. It is only ever asked for MONGO_URI, and the real environment
 * still wins so a one-off override works.
 */
export function envValue(key, files = [".env.local", ".env", ".env.production"]) {
  if (process.env[key]) return { value: process.env[key], from: "the environment" };
  for (const file of files) {
    const full = path.join(ROOT, file);
    let text;
    try {
      text = fs.readFileSync(full, "utf8");
    } catch {
      continue;
    }
    for (const line of text.split(/\r?\n/)) {
      const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
      if (!m || m[1] !== key) continue;
      let v = m[2].trim();
      // Strip one matching pair of quotes; an unquoted value ends at a comment.
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      } else {
        v = v.split(" #")[0].trim();
      }
      if (v) return { value: v, from: file };
    }
  }
  return { value: "", from: "" };
}

/** The database named in a connection string, or "" when it names none. */
export function databaseFromUri(uri) {
  const m = /^mongodb(?:\+srv)?:\/\/[^/?]+(?:\/([^?]*))?/.exec(String(uri || ""));
  const name = m?.[1] ? decodeURIComponent(m[1]) : "";
  return name.trim();
}

function fail(lines) {
  console.error(`\n${lines.join("\n")}\n`);
  process.exit(1);
}

/**
 * Connect, or explain exactly what is wrong.
 *
 * @param {object} opts
 * @param {string} opts.uri     MONGO_URI
 * @param {string} opts.db      optional --db= override
 * @param {boolean} opts.force  skip the "this database looks empty" guard
 * @returns {Promise<{client: MongoClient, db: import("mongodb").Db, name: string}>}
 */
export async function connectSeed({ uri, db: dbOverride = "", force = false, script = "the seed script" }) {
  let source = "the environment";
  if (!uri) {
    const found = envValue("MONGO_URI");
    uri = found.value;
    source = found.from;
  }
  if (!uri) {
    fail([
      "MONGO_URI is not set, and no .env file in this directory names one.",
      "",
      "The application reads it from .env — check that file exists and holds the line:",
      "",
      "  MONGO_URI=mongodb://127.0.0.1:27017/YourDatabase",
      "",
      "  grep MONGO_URI .env .env.local .env.production",
    ]);
  }
  console.log(`MONGO_URI:   read from ${source}`);

  const inUri = databaseFromUri(uri);
  const name = dbOverride || inUri;

  if (!name) {
    fail([
      "This connection string does not name a database, so MongoDB would default to `test`",
      `and ${script} would write where nothing reads it.`,
      "",
      `  given:  ${uri.replace(/\/\/[^@]*@/, "//****@")}`,
      "                              ↑ nothing between the host and the ?",
      "",
      "Add the database name before the query string, for example:",
      "",
      "  mongodb://HOST:27017/ababeel?directConnection=true&tls=false",
      "                       ^^^^^^^",
      "",
      "To see which databases exist and which one holds the site data:",
      "",
      "  mongosh 'mongodb://HOST:27017/?directConnection=true' --eval 'db.adminCommand({listDatabases:1}).databases.forEach(d=>print(d.name))'",
      "",
      "The right one is whichever contains a `users` collection. You can also pass it",
      "explicitly:  --db=ababeel",
    ]);
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
  } catch (err) {
    // A driver stack trace tells an operator nothing they can act on; the two
    // things worth saying are which host was tried and what usually causes it.
    fail([
      `Could not reach MongoDB at ${uri.replace(/\/\/[^@]*@/, "//****@")}`,
      "",
      `  ${err?.message || err}`,
      "",
      "Usually one of:",
      "  • the host or port in MONGO_URI is wrong",
      "  • MongoDB is not running        (systemctl status mongod)",
      "  • a firewall is blocking the port from this machine",
      "  • the credentials in the URI are wrong or missing",
    ]);
  }
  const database = client.db(name);

  // A database with no users collection is almost certainly not the app's.
  const collections = await database.listCollections().toArray();
  const names = collections.map((c) => c.name);
  const looksLikeTheApp = names.includes("users");

  console.log(`Database:  ${name}${dbOverride ? " (from --db)" : ""}`);
  console.log(`Collections: ${names.length ? names.slice(0, 8).join(", ") + (names.length > 8 ? ", …" : "") : "(none — this database is empty)"}`);

  if (!looksLikeTheApp && !force) {
    await client.close();
    fail([
      `"${name}" has no \`users\` collection, so it does not look like the database this`,
      "application uses. Writing here would leave the live site unchanged — which is",
      "exactly the failure this check exists to prevent.",
      "",
      "Find the right database:",
      "",
      `  mongosh '${uri.replace(/\/\/[^@]*@/, "//****@")}' --eval 'db.adminCommand({listDatabases:1}).databases.forEach(d=>print(d.name))'`,
      "",
      "Then re-run with that name in the URI, or pass --db=<name>.",
      "If you really do mean this database, re-run with --force.",
    ]);
  }

  return { client, db: database, name };
}
