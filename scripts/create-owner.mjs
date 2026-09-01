/**
 * Script to create or update an Owner account in Ababeel.
 *
 * Usage:
 *   node scripts/create-owner.mjs
 *   node scripts/create-owner.mjs --email=admin@ababeel.com --password=SecurePassword123
 */
import { connectSeed } from "./lib/connect.mjs";
import bcrypt from "bcryptjs";

const args = process.argv.slice(2);
const emailArg = (args.find((a) => a.startsWith("--email=")) || "").slice(8);
const passwordArg = (args.find((a) => a.startsWith("--password=")) || "").slice(11);
const usernameArg = (args.find((a) => a.startsWith("--username=")) || "").slice(11);

const OWNER_EMAIL = (emailArg || process.env.OWNER_EMAIL || "owner@ababeel.com").toLowerCase().trim();
const OWNER_PASSWORD = passwordArg || process.env.OWNER_PASSWORD || "Ababeel@2026!";
const OWNER_USERNAME = usernameArg || "AbabeelOwner";

const force = args.includes("--force");

async function main() {
  const { client, db, name } = await connectSeed({
    uri: "",
    force: true,
    script: "Create / Update Owner Account",
  });

  try {
    console.log(`\nConnecting to database: ${name}`);

    const hashedPassword = await bcrypt.hash(OWNER_PASSWORD, 10);
    const usersCollection = db.collection("users");

    const existing = await usersCollection.findOne({
      $or: [{ email: OWNER_EMAIL }, { username: OWNER_USERNAME }, { role: "owner" }],
    });

    if (existing) {
      await usersCollection.updateOne(
        { _id: existing._id },
        {
          $set: {
            username: OWNER_USERNAME,
            email: OWNER_EMAIL,
            password: hashedPassword,
            role: "owner",
            authenticatedEmail: true,
            authenticatedByOwner: true,
            status: "active",
            country: "United Kingdom",
            updatedAt: new Date(),
          },
        }
      );
      console.log(`\n✅ Owner account updated successfully!`);
    } else {
      await usersCollection.insertOne({
        username: OWNER_USERNAME,
        email: OWNER_EMAIL,
        password: hashedPassword,
        role: "owner",
        authenticatedEmail: true,
        authenticatedByOwner: true,
        status: "active",
        country: "United Kingdom",
        accountBalance: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`\n✅ Owner account created successfully!`);
    }

    console.log("-----------------------------------------");
    console.log(`Username: ${OWNER_USERNAME}`);
    console.log(`Email:    ${OWNER_EMAIL}`);
    console.log(`Password: ${OWNER_PASSWORD}`);
    console.log(`Role:     owner`);
    console.log("-----------------------------------------\n");
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Failed to create owner:", err);
  process.exit(1);
});
