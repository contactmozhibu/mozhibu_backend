
import express from "express";
import jwt from "jsonwebtoken";
import Story from "../models/Story.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { getIO } from "../../socket.js";

import { publishStory } from "../controllers/story.controller.js";

const router = express.Router();

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch {
      req.user = null;
    }
  }
  next();
};

const getAgeCategoryFromDOB = (dob) => {
  if (!dob) return null;

  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();

  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (age <= 6) return "Kids (0-6)";
  if (age <= 9) return "Children (7-9)";
  if (age <= 12) return "Pre-Teens (10-12)";
  if (age <= 17) return "Teens (13-17)";
  if (age <= 25) return "Young Adults (18-25)";
  return "Adults (26+)";
};

// DEBUG ENDPOINT - Shows all categories and topics in database
router.get("/debug/categories", async (req, res) => {
  try {
    const distribution = await Story.aggregate([
      { $match: { status: "PUBLISHED" } },
      { $group: { 
        _id: { category: "$category", topic: "$topic" }, 
        count: { $sum: 1 } 
      }},
      { $sort: { "_id.category": 1, "_id.topic": 1 } }
    ]);

    // Group by category
    const categoriesMap = {};
    distribution.forEach((item) => {
      const category = item._id.category;
      const topic = item._id.topic;
      
      if (!categoriesMap[category]) {
        categoriesMap[category] = {
          title: category,
          topics: []
        };
      }
      
      if (!categoriesMap[category].topics.includes(topic)) {
        categoriesMap[category].topics.push(topic);
      }
    });

    // Convert to array and sort topics
    const categories = Object.values(categoriesMap).map((cat) => ({
      ...cat,
      topics: cat.topics.sort()
    })).sort((a, b) => a.title.localeCompare(b.title));

    res.json({
      total: distribution.length,
      categories: categories
    });
  } catch (err) {
    res.status(500).json({ message: "Debug error", error: err.message });
  }
});

// ✅ NEW ENDPOINT - Get all unique subcategories from published stories
router.get("/subcategories/all", async (req, res) => {
  try {
    // Fetch all published stories and extract unique subcategories
    const stories = await Story.find({ status: "PUBLISHED" }).select("subcategories");
    
    const uniqueSubcategories = new Set();
    stories.forEach((story) => {
      if (story.subcategories && Array.isArray(story.subcategories)) {
        story.subcategories.forEach((sub) => {
          uniqueSubcategories.add(sub);
        });
      }
    });
    
    // Convert to sorted array
    const sortedSubcategories = Array.from(uniqueSubcategories).sort();
    
    console.log("✅ Fetched unique subcategories:", sortedSubcategories.length);
    
    res.json({
      success: true,
      subcategories: sortedSubcategories,
      count: sortedSubcategories.length
    });
  } catch (err) {
    console.error("❌ Error fetching subcategories:", err);
    res.status(500).json({ message: "Failed to fetch subcategories", error: err.message });
  }
});

// ✅ NEW ENDPOINT - Get published stories organized by category with subcategories
router.get("/categories/published", async (req, res) => {
  try {
    console.log("📚 Fetching published stories organized by category...");
    
    // Fetch all published stories
    const stories = await Story.find({ status: "PUBLISHED" }).select("category topic subcategories title");
    
    // Build category map
    const categoryMap = {};
    
    stories.forEach((story) => {
      const category = story.category || "Uncategorized";
      
      if (!categoryMap[category]) {
        categoryMap[category] = {
          category: category,
          topics: new Set(),
          subcategories: new Set(),
          storyCount: 0
        };
      }
      
      categoryMap[category].storyCount += 1;
      
      // Add topic
      if (story.topic) {
        categoryMap[category].topics.add(story.topic);
      }
      
      // Add subcategories
      if (story.subcategories && Array.isArray(story.subcategories)) {
        story.subcategories.forEach((sub) => {
          categoryMap[category].subcategories.add(sub);
        });
      }
    });
    
    // Convert Sets to Arrays and sort
    const categoriesData = Object.values(categoryMap).map((cat) => ({
      category: cat.category,
      storyCount: cat.storyCount,
      topics: Array.from(cat.topics).sort(),
      subcategories: Array.from(cat.subcategories).sort()
    })).sort((a, b) => a.category.localeCompare(b.category));
    
    console.log("✅ Fetched", Object.keys(categoryMap).length, "categories with published stories");
    
    res.json({
      success: true,
      categories: categoriesData,
      totalPublishedStories: stories.length
    });
  } catch (err) {
    console.error("❌ Error fetching published stories by category:", err);
    res.status(500).json({ message: "Failed to fetch published stories", error: err.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const story = new Story({
      ...req.body,
      author: req.user._id,
    });

    await story.save();
    res.status(201).json(story);
  } catch (err) {
    console.error("Story save error:", err);
    res.status(400).json({ message: err.message });
  }
});
router.get("/", optionalAuth, async (req, res) => {
  try {
    let filter = { status: "PUBLISHED" };

    const { category, topic, language, ageCategory, eroticType, subcategory } = req.query;
    
    console.log("🔍 QUERY PARAMS:", { category, topic, language, ageCategory, eroticType, subcategory });

    // Category filtering
    if (category) {
      // Use exact string match instead of regex for category
      filter.category = category;
    }

    // ✅ NEW: Topic can now be a subcategory name or traditional topic
    // First try to filter by topic as subcategory
    if (topic) {
      // Topic can be a subcategory - check if topic matches any subcategory in the array
      filter.$or = [
        { topic: topic },                          // Traditional topic match
        { subcategories: { $in: [topic] } }        // Topic as subcategory
      ];
      console.log("📝 Filtering by topic/subcategory:", topic);
    }

    // Subcategory filtering - if provided, find stories with this subcategory
    // Subcategories can be searched independently or with category
    if (subcategory) {
      filter.subcategories = { $in: [subcategory] };
      console.log("🏷️ Filtering by subcategory:", subcategory);
    }

    // Language filtering: convert language codes to full names and filter
    if (language) {
      const languageMap = {
        "ta": "Tamil",
        "en": "English",
        "Tamil": "Tamil",
        "English": "English"
      };
      
      const mappedLanguage = languageMap[language] || language;
      filter.language = mappedLanguage;
    }

    // Age category filtering - ONLY if explicitly provided
    if (ageCategory) {
      filter.ageCategory = { $regex: `^${ageCategory}$`, $options: "i" };
    }

    // Erotic type filtering (Erotic/Non-Erotic) - ✅ FIXED FIELD NAME
    if (eroticType) {
      filter.eroticType = { $regex: `^${eroticType}$`, $options: "i" };
    }

    console.log("📖 FILTER APPLIED:", filter);

    const stories = await Story.find(filter)
      .populate("author", "username")
      .sort({ createdAt: -1 });

    console.log("📊 STORIES FOUND:", stories.length);
    if (stories.length === 0) {
      // Debug: show what categories exist in DB
      const allCategories = await Story.distinct("category", { status: "PUBLISHED" });
      console.log("📚 AVAILABLE CATEGORIES IN DB:", allCategories);
    }

    res.json(stories);
  } catch (err) {
    console.error("❌ ERROR IN GET /:", err);
    res.status(500).json({ message: "Failed to fetch stories" });
  }
});

router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const stories = await Story.find({
      author: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(stories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load user stories" });
  }
});

router.get("/author/:id", async (req, res) => {
  try {
    const stories = await Story.find({
      author: req.params.id,
    })
      .populate("author", "username avatar")
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load author stories" });
  }
});

router.get("/:id", optionalAuth, async (req, res) => {
  try {
    // ✅ Guard against invalid ObjectId
    if (!req.params.id.match(/^[a-f\d]{24}$/i)) {
      return res.status(400).json({ message: "Invalid story ID" });
    }

    const story = await Story.findById(req.params.id)
      .populate("author", "username penName avatar followers") // ✅ added avatar + followers
      .populate("reviews.user", "username");

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    await Story.findByIdAndUpdate(
  req.params.id,
  { $inc: { readCount: 1 } },
  { new: true }
);

    res.json(story);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load story" });
  }
});

router.put("/:id/publish", authMiddleware, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // ✅ Only author can publish
    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // ✅ Publish
    story.status = "PUBLISHED";
    await story.save();

    // 🔔 Notify followers
    const followers = await User.find({
      following: req.user._id,
    });

    // 🔔 Notify author (for drafts / my notifications)
await Notification.create({
  user: req.user._id,          // author himself
  story: story._id,
  type: "STORY_PUBLISHED",
  message: `Your story "${story.title}" has been published 🎉`,
});


    const notifications = followers.map((f) => ({
      user: f._id,                 // receiver
      fromUser: req.user._id,      // publisher
      story: story._id,
      type: "STORY_PUBLISHED",
      message: `${req.user.username} published a new story`,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // 🔔 ✅ BROADCAST STORY PUBLISHED TO ALL CONNECTED CLIENTS
    // This allows real-time updates in category/subcategory filters
    try {
      const io = getIO();
      io.emit("story-published", {
        storyId: story._id,
        title: story.title,
        category: story.category,
        topic: story.topic,
        subcategories: story.subcategories,
        author: req.user.username,
        authorId: req.user._id,
      });
      console.log("📡 Broadcasted story published event for:", story.title);
    } catch (error) {
      console.error("❌ Error emitting socket event:", error);
    }

    res.json({
      message: "Story published successfully",
      story,
    });
  } catch (err) {
    console.error("PUBLISH ERROR:", err);
    res.status(500).json({ message: "Failed to publish story" });
  }
});


export default router;
