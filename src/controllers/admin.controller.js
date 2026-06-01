import User from "../models/User.js";
import Story from "../models/Story.js";

/* =========================
   GET ALL USERS
========================= */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password");
    res.json(users);
  } catch {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

/* =========================
   DEACTIVATE USER
========================= */
export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deactivated" });
  } catch {
    res.status(500).json({ message: "Failed to deactivate user" });
  }
};

/* =========================
   DELETE USER (PERMANENT)
========================= */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ message: "Admin cannot be deleted" });
    }

    await Story.deleteMany({ author: user._id });
    await User.findByIdAndDelete(user._id);

    res.json({ message: "User permanently deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete user" });
  }
};

/* =========================
   DELETE ANY STORY
========================= */
export const deleteStoryByAdmin = async (req, res) => {
  try {
    const story = await Story.findByIdAndDelete(req.params.id);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    res.json({ message: "Story removed by admin" });
  } catch {
    res.status(500).json({ message: "Failed to delete story" });
  }
};

/* =========================
   ADMIN DASHBOARD STATS
========================= */
export const adminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalStories = await Story.countDocuments();

    res.json({
      totalUsers,
      activeUsers,
      totalStories,
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};
