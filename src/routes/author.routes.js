
import express from "express";
import User from "../models/User.js";
import Story from "../models/Story.js";
import Notification from "../models/Notification.js"; // ✅ ADDED
import Review from "../models/Review.js"; // ✅ ADDED
import authMiddleware from "../middleware/auth.middleware.js";

import {
  followAuthor,
  unfollowAuthor,
} from "../controllers/author.controller.js";


import multer from "multer";
import fs from "fs";
import path from "path";

const uploadPath = path.join("uploads", "avatars");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const router = express.Router();

/* ======================
   MULTER CONFIG
====================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user._id}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

/* ======================
   GET LOGGED-IN AUTHOR
====================== */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const author = await User.findById(req.user._id)
      .select("username email mobile bio avatar isActive createdAt followers following")
      .lean();

    const stories = await Story.find({
      author: req.user._id,
      status: "PUBLISHED",
    });

    res.json({ author, stories });
  } catch {
    res.status(500).json({ message: "Failed to load profile" });
  }
});

/* ======================
   UPDATE PROFILE
====================== */
router.put(
  "/me",
  authMiddleware,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const { username, mobile, bio, deleteAvatar } = req.body;

      console.log("🔧 UPDATE PROFILE - deleteAvatar:", deleteAvatar, "has file:", !!req.file);

      const updateData = {
        ...(username && { username }),
        ...(mobile && { mobile }),
        ...(bio && { bio }),
      };

      // 🗑️ DELETE AVATAR
      if (deleteAvatar === "true") {
        console.log("🗑️ Deleting avatar...");
        updateData.avatar = ""; // Set to empty string, not null
      } else if (req.file) {
        // 🖼️ UPDATE AVATAR
        console.log("🖼️ Uploading new avatar...");
        updateData.avatar = `/uploads/avatars/${req.file.filename}`;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true }
      ).select("username email mobile bio avatar followers following");

      console.log("✅ Profile updated. Avatar value:", updatedUser.avatar);

      res.json({
        message: "Profile updated successfully",
        author: updatedUser,
      });
    } catch (err) {
      console.error("❌ Profile update error:", err);
      res.status(500).json({ message: "Failed to update profile" });
    }
  }
);

/* ======================
   DEACTIVATE ACCOUNT
   🟡 TEMPORARY - Profile hidden but data preserved
====================== */
router.patch("/deactivate", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isActive: false },
      { new: true }
    );

    res.json({
      message: "Account deactivated successfully",
      user,
    });
  } catch (err) {
    console.error("Deactivate error:", err);
    res.status(500).json({ message: "Failed to deactivate account" });
  }
});

/* ======================
   DELETE ACCOUNT
   🔴 PERMANENT - Deletes all user data
====================== */
router.delete("/delete", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // 🗑️ Delete all stories
    const stories = await Story.find({ author: userId });
    const storyIds = stories.map((s) => s._id);
    
    // 🗑️ Delete all reviews for this user's stories
    await Review.deleteMany({ story: { $in: storyIds } });
    
    // 🗑️ Delete all stories
    await Story.deleteMany({ author: userId });
    
    // 🗑️ Delete all reviews by this user
    await Review.deleteMany({ user: userId });
    
    // 🗑️ Delete all notifications for/from this user
    await Notification.deleteMany({
      $or: [{ user: userId }, { fromUser: userId }],
    });

    // 🗑️ Remove user from all followers/following lists
    await User.updateMany(
      { followers: userId },
      { $pull: { followers: userId } }
    );
    await User.updateMany(
      { following: userId },
      { $pull: { following: userId } }
    );

    // 🗑️ Delete the user
    await User.findByIdAndDelete(userId);

    res.json({ message: "Account permanently deleted" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ message: "Failed to delete account" });
  }
});

/* ======================
   GET AUTHOR BY ID (PUBLIC)
====================== */
router.get("/:id", async (req, res) => {
  try {
    const author = await User.findById(req.params.id).select(
      "username avatar createdAt followers following"
    );

    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    const stories = await Story.find({
      author: author._id,
      status: "PUBLISHED",
    });

    res.json({ author, stories });
  } catch {
    res.status(500).json({ message: "Failed to load author" });
  }
});

/* ======================
   GET FOLLOWERS LIST
====================== */
router.get("/:id/followers", async (req, res) => {
  try {
    const author = await User.findById(req.params.id).populate(
      "followers",
      "username avatar"
    );

    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    res.json(author.followers || []);
  } catch {
    res.status(500).json({ message: "Failed to load followers" });
  }
});

/* ======================
   GET FOLLOWING LIST
====================== */
router.get("/:id/following", async (req, res) => {
  try {
    const author = await User.findById(req.params.id).populate(
      "following",
      "username avatar"
    );

    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    res.json(author.following || []);
  } catch {
    res.status(500).json({ message: "Failed to load following" });
  }
});

/* ======================
   FOLLOW / UNFOLLOW AUTHOR
   🔔 NOTIFICATION ADDED
====================== */
router.post("/:authorId/follow", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { authorId } = req.params;

    if (userId === authorId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const author = await User.findById(authorId);
    const user = await User.findById(userId);

    if (!author || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = author.followers.some(
      (id) => id.toString() === userId
    );

    if (isFollowing) {
      // UNFOLLOW
      author.followers = author.followers.filter(
        (id) => id.toString() !== userId
      );
      user.following = user.following.filter(
        (id) => id.toString() !== authorId
      );
    } else {
      // FOLLOW
      author.followers.push(userId);
      user.following.push(authorId);

      // 🔔 CREATE FOLLOW NOTIFICATION
      await Notification.create({
        user: author._id,
        fromUser: user._id,
        type: "FOLLOW",
        message: `${user.username} started following you`,
      });
    }

    await author.save({ validateBeforeSave: false });
    await user.save({ validateBeforeSave: false });

    res.json({
      following: !isFollowing,
      followers: author.followers,
      followersCount: author.followers.length,
    });
  } catch (error) {
    console.error("FOLLOW TOGGLE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;


