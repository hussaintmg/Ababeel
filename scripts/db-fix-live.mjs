import mongoose from "mongoose";

const MONGO_URI = "mongodb://187.124.233.197:27017/Ababeel?directConnection=true&tls=false";

async function run() {
  console.log("Connecting to live MongoDB...");
  await mongoose.connect(MONGO_URI);
  const sitecontents = mongoose.connection.db.collection("sitecontents");

  // 1. Clean up duplicate global docs, keeping only 6a5f833b83cdde019ebaccc0
  const keepId = new mongoose.Types.ObjectId("6a5f833b83cdde019ebaccc0");
  const deleteResult = await sitecontents.deleteMany({
    key: "global",
    _id: { $ne: keepId },
  });
  console.log("Deleted duplicate global docs:", deleteResult.deletedCount);

  // Ensure the remaining global doc has maintenance.enabled = false
  await sitecontents.updateOne(
    { _id: keepId },
    { $set: { "settings.maintenance.enabled": false, updatedAt: new Date() } }
  );
  console.log("Verified remaining global doc maintenance.enabled is false");

  // 2. Set contact-us enabled to false so the real designed contact page renders
  const contactResult = await sitecontents.updateOne(
    { key: "contact-us" },
    { $set: { enabled: false, updatedAt: new Date() } }
  );
  console.log("Updated contact-us enabled to false:", contactResult.modifiedCount);

  const remainingGlobals = await sitecontents.find({ key: "global" }).toArray();
  console.log("Remaining global docs count:", remainingGlobals.length);
  console.log("Global doc maintenance setting:", remainingGlobals[0]?.settings?.maintenance);

  const contactDoc = await sitecontents.findOne({ key: "contact-us" });
  console.log("Contact-us enabled is now:", contactDoc?.enabled);

  await mongoose.disconnect();
  console.log("Done!");
}

run().catch((err) => {
  console.error("Database update error:", err);
  process.exit(1);
});
