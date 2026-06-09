import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";

dotenv.config();

const fixUserAgeKeys = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Fix users with invalid ageKeys
    console.log("🔄 Fixing user ageKeys...");
    const result = await User.updateMany(
      { ageKey: { $in: ["young_adults", "undefined", null, ""] } },
      { ageKey: "adults" }
    );
    console.log("✅ Updated", result.modifiedCount, "users to 'adults'");

    // Verify
    const usersWithInvalidAgeKeys = await User.find({
      ageKey: {
        $nin: ["kids", "teens", "adults"],
      },
    });

    if (usersWithInvalidAgeKeys.length > 0) {
      console.log(`⚠️  Still found ${usersWithInvalidAgeKeys.length} users with invalid ageKeys`);
    } else {
      console.log("✅ All users now have valid ageKeys");
    }

    // Show statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: "$ageKey",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    console.log("\n📊 Users by Age Key:");
    userStats.forEach((stat) => {
      console.log(`  ${stat._id}: ${stat.count} users`);
    });

    console.log("\n✅ User migration completed!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    process.exit(1);
  }
};

fixUserAgeKeys();
