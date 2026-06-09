import mongoose from "mongoose";
import dotenv from "dotenv";
import Story from "../src/models/Story.js";
import User from "../src/models/User.js";

dotenv.config();

const migrateAgeCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Map old age categories to new ones
    const categoryMap = {
      "Kids (0-6)": "Kids (0-12)",
      "Children (7-9)": "Kids (0-12)",
      "Pre-Teens (10-12)": "Kids (0-12)",
      "Kids (0-9)": "Kids (0-12)",
      "Teens (10-17)": "Teens (13-17)",
      "Young Adults (18-25)": "Adults (18+)",
      "Adults (26+)": "Adults (18+)",
    };

    // Update Stories
    console.log("🔄 Migrating Story age categories...");
    for (const [oldCategory, newCategory] of Object.entries(categoryMap)) {
      const result = await Story.updateMany(
        { ageCategory: oldCategory },
        { ageCategory: newCategory }
      );
      if (result.modifiedCount > 0) {
        console.log(`  ✅ Updated ${result.modifiedCount} stories from "${oldCategory}" to "${newCategory}"`);
      }
    }

    // Map age keys for User ageKey field
    const userAgeKeyMap = {
      "kids": "kids",
      "teens": "teens",
      "adults": "adults",
    };

    // Verify all stories now have valid age categories
    const storiesWithInvalidAges = await Story.find({
      ageCategory: {
        $nin: ["Kids (0-12)", "Teens (13-17)", "Adults (18+)"],
      },
    });

    if (storiesWithInvalidAges.length > 0) {
      console.log(`⚠️  Found ${storiesWithInvalidAges.length} stories with invalid age categories:`);
      storiesWithInvalidAges.forEach((story) => {
        console.log(`   - ${story.title}: ${story.ageCategory}`);
      });
    } else {
      console.log("✅ All stories have valid age categories");
    }

    // Verify all users have valid ageKeys
    const usersWithInvalidAgeKeys = await User.find({
      ageKey: {
        $nin: ["kids", "teens", "adults"],
      },
    });

    if (usersWithInvalidAgeKeys.length > 0) {
      console.log(`⚠️  Found ${usersWithInvalidAgeKeys.length} users with invalid ageKeys:`);
      usersWithInvalidAgeKeys.forEach((user) => {
        console.log(`   - ${user.username}: ${user.ageKey}`);
      });
    } else {
      console.log("✅ All users have valid ageKeys");
    }

    // Show statistics
    const storyStats = await Story.aggregate([
      {
        $group: {
          _id: "$ageCategory",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    console.log("\n📊 Stories by Age Category:");
    storyStats.forEach((stat) => {
      console.log(`  ${stat._id}: ${stat.count} stories`);
    });

    console.log("\n✅ Migration completed successfully!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    process.exit(1);
  }
};

migrateAgeCategories();
