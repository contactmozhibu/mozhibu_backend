
import express from "express";
import jwt from "jsonwebtoken";
import Story from "../models/Story.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import authMiddleware from "../middleware/auth.middleware.js";

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

if (age <= 9) return "Kids (0-9)";
if (age <= 17) return "Teens (10-17)";
return "Adults (18+)";
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
/*
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
*/
router.post("/", authMiddleware, async (req, res) => {
  try {
    const story = new Story({
      title: req.body.title,
      description: req.body.description,
      content: req.body.content,
      category: req.body.category,
      topic: req.body.topic || "General",
      subcategories: req.body.subcategories || [],   // ✅ ADD THIS
      ageCategory: req.body.ageCategory,
      language: req.body.language,
      contentType: req.body.contentType,
      coverImage: req.body.coverImage,
      storyType: req.body.storyType,
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

    //const { category, topic, language, ageCategory, contentType } = req.query;
    const { category, language, ageCategory, contentType, subcategory } = req.query;
    if (category) {
      filter.category = { $regex: `^${category}$`, $options: "i" };
    }
/*
    if (topic) {
      filter.topic = { $regex: `^${topic}$`, $options: "i" };
    }
*/
if (subcategory) {
  filter.subcategories = { $in: [subcategory] };
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

    // Age category filtering
    if (ageCategory) {
      filter.ageCategory = { $regex: `^${ageCategory}$`, $options: "i" };
    }

    // Content type filtering (Erotic/Non-Erotic)
    if (contentType) {
      filter.contentType = { $regex: `^${contentType}$`, $options: "i" };
    }

    // If user is logged in and no age filter is explicitly set, use their age category
    if (req.user?.dob && !ageCategory) {
      filter.ageCategory = getAgeCategoryFromDOB(req.user.dob);
    }

    const stories = await Story.find(filter)
      .populate("author", "username")
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (err) {
    console.error(err);
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

    res.json({
      message: "Story published successfully",
      story,
    });
  } catch (err) {
    console.error("PUBLISH ERROR:", err);
    res.status(500).json({ message: "Failed to publish story" });
  }
});


// UPDATE STORY (ALLOW BOTH DRAFT + PUBLISHED)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // only author can edit
    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // update fields
    Object.assign(story, req.body);

    await story.save();

    res.json({
      message: "Story updated successfully",
      story,
    });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: "Failed to update story" });
  }
});


// DELETE STORY (WORKS FOR PUBLISHED ALSO)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Story.findByIdAndDelete(req.params.id);

    res.json({ message: "Story deleted successfully" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Failed to delete story" });
  }
});

export default router;
