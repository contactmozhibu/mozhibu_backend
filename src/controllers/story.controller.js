
import { getIO } from "../../socket.js";

import Story from "../models/Story.js";
import Chapter from "../models/Chapter.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js"; // ✅ ADD THIS


/* ==============================
   GET ALL STORIES (PUBLIC)
============================== */
/*
export const getAllStories = async (req, res) => {
  try {
    const stories = await Story.find()
      .populate("author", "username")
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stories" });
  }
};
*/

/* ==============================
   GET ALL STORIES (PUBLIC)
============================== */
export const getAllStories = async (req, res) => {
  try {
    // Get language from frontend query
    const { language } = req.query;

    // Create filter object
    let filter = {};

    // If language exists, filter stories
    if (language) {
      filter.language = language;
    }

    const stories = await Story.find(filter)
      .populate("author", "username")
      .sort({ createdAt: -1 });

    console.log("📚 Language Filter:", language);
    console.log("📚 Stories Found:", stories.length);

    res.json(stories);
  } catch (err) {
    console.error("GET STORIES ERROR:", err);
    res.status(500).json({
      message: "Failed to fetch stories"
    });
  }
};



/* ==============================
   GET SINGLE STORY
============================== */
export const getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
  .populate({
    path: "author",
    select: "username penName avatar followers",
  });



    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    res.json(story);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch story" });
  }
};

/* ==============================
   ✅ GET LOGGED-IN USER STORIES
   (USED BY ACCOUNT DETAILS)
============================== */
export const getMyStories = async (req, res) => {
  try {
    const stories = await Story.find({
      author: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(stories);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch my stories" });
  }
};

/* ==============================
   ✅ PUBLISH STORY
============================== */
export const publishStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    story.status = "PUBLISHED";
    await story.save();

    // AFTER story is published
const notification = await Notification.create({
  user: story.author,
  type: "PUBLISHED",
  message: `🎉 Your story "${story.title}" has been published successfully.`,
  story: story._id,
});

const io = getIO();
io.to(story.author.toString()).emit("new-notification", notification);


    const author = await User.findById(req.user._id).select("username");

    // 🔔 Followers notification
    const followers = await User.find({
      following: req.user._id,
    });

    if (followers.length > 0) {
  const followerNotifications = followers.map((f) => ({
    user: f._id,
    fromUser: req.user._id,
    story: story._id,
    type: "PUBLISHED",
    message: `${author.username} published a new story`,
  }));

  const savedNotifications = await Notification.insertMany(
    followerNotifications
  );

  const io = getIO();

  // 🔔 REAL-TIME EMIT TO EACH FOLLOWER
  savedNotifications.forEach((notif) => {
    io.to(notif.user.toString()).emit("new-notification", notif);
  });
}


    res.json({ success: true, story });
  } catch (err) {
    console.error("PUBLISH ERROR:", err);
    res.status(500).json({ message: "Failed to publish story" });
  }
};

export const createStory = async (req, res) => {
  try {
    const {
      title,
      description,
      content,
      storyType,
      category,
      topic,
      ageCategory,
      contentType,
      language,
      coverImage,
      subcategories
    } = req.body;

    // Map contentType → eroticType for model
    const eroticType = contentType || "Non-Erotic";

    // Use provided topic or default to "General"
    const finalTopic = topic || "General";

    console.log("📝 CREATE STORY DEBUG:", {
      category,
      topic,
      subcategories,
      finalTopic,
      title
    });

    const story = await Story.create({
      title,
      description,
      storyType,
      content: storyType === "single" ? content : "",
      category,
      ageCategory,
      eroticType,      // FIXED: required field
      topic: finalTopic,           // FIXED: now accepts topic from frontend
      language,
      coverImage,
      author: req.user.id,
      subcategories
    });

    return res.status(201).json(story);
  } catch (err) {
    console.log("CREATE STORY ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};