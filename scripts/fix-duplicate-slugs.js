const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Load environment variables
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith("#")) {
      const [key, ...valueParts] = trimmedLine.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
        process.env[key.trim()] = value;
      }
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI not found in .env file");
  process.exit(1);
}

async function fixDuplicateSlugs() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const categoriesCollection = db.collection("categories");

    // Drop old incorrect index if it exists (slug_1 - enforces uniqueness on slug alone)
    console.log("Checking for old incorrect indexes...");
    try {
      const indexes = await categoriesCollection.indexes();
      const hasOldSlugIndex = indexes.some(idx => idx.name === "slug_1");
      
      if (hasOldSlugIndex) {
        console.log("Found old 'slug_1' index. Dropping it...");
        await categoriesCollection.dropIndex("slug_1");
        console.log("Old 'slug_1' index dropped");
      }
    } catch (error) {
      console.log("Error checking/dropping old index:", error.message);
    }

    // Ensure the compound unique index exists
    console.log("Creating/ensuring compound unique index on (userId, slug)...");
    try {
      await categoriesCollection.createIndex(
        { userId: 1, slug: 1 },
        { unique: true, background: true }
      );
      console.log("Compound index created/verified");
    } catch (error) {
      if (error.message?.includes("already exists")) {
        console.log("Compound index already exists");
      } else {
        throw error;
      }
    }

    // Find all duplicate slugs per user
    console.log("Finding duplicate slugs per user...");
    const duplicates = await categoriesCollection
      .aggregate([
        {
          $group: {
            _id: { userId: "$userId", slug: "$slug" },
            count: { $sum: 1 },
            ids: { $push: "$_id" },
          },
        },
        {
          $match: {
            count: { $gt: 1 },
          },
        },
      ])
      .toArray();

    if (duplicates.length === 0) {
      console.log("No duplicate slugs found. Database is clean!");
    } else {
      console.log(`Found ${duplicates.length} duplicate slug groups. Fixing...`);
      
      for (const duplicate of duplicates) {
        const { userId, slug } = duplicate._id;
        const ids = duplicate.ids;
        
        // Keep the first one, append numbers to the rest
        console.log(`Fixing duplicates for userId: ${userId}, slug: ${slug}`);
        
        for (let i = 1; i < ids.length; i++) {
          let newSlug = `${slug}-${i}`;
          let counter = i;
          
          // Make sure the new slug doesn't already exist for this user
          while (true) {
            const existing = await categoriesCollection.findOne({
              userId: userId,
              slug: newSlug,
            });
            
            if (!existing) {
              break;
            }
            counter++;
            newSlug = `${slug}-${counter}`;
          }
          
          await categoriesCollection.updateOne(
            { _id: ids[i] },
            { $set: { slug: newSlug } }
          );
          
          console.log(`  Updated category ${ids[i]} to slug: ${newSlug}`);
        }
      }
      
      console.log("All duplicates fixed!");
    }

    // Verify the index is working
    console.log("Verifying index...");
    const indexInfo = await categoriesCollection.indexes();
    const hasIndex = indexInfo.some(
      (idx) =>
        idx.key &&
        idx.key.userId === 1 &&
        idx.key.slug === 1 &&
        idx.unique === true
    );

    if (hasIndex) {
      console.log("✓ Compound unique index is properly set up");
    } else {
      console.error("✗ Compound unique index is missing!");
    }

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixDuplicateSlugs();

