import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

const router = express.Router();

router.post("/:id", authMiddleware, async (req, res) => {
  const targetId = req.params.id;

  if (targetId === req.user._id.toString()) {
    return res.status(400).json({ message: "Cannot follow yourself" });
  }

  const target = await User.findById(targetId);
  if (!target) return res.status(404).json({ message: "User not found" });

  if (!target.followers.includes(req.user._id)) {
    target.followers.push(req.user._id);
    await target.save();

    await Notification.create({
      user: target._id,
      fromUser: req.user._id,
      type: "FOLLOW",
      message: `${req.user.username} started following you`,
    });
  }

  res.json({ success: true });
});

export default router;
