
import Notification from "../models/Notification.js";

/* ======================
   GET MY NOTIFICATIONS
====================== */
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
    })
      .populate("fromUser", "username avatar")
      .populate("story", "title coverImage")
      .populate("review", "rating comment")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

/* ======================
   MARK SINGLE AS READ
====================== */
export const markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark as read" });
  }
};

/* ======================
   MARK ALL AS READ
====================== */
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark all read" });
  }
};

/* ======================
   GET UNREAD COUNT
====================== */
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.json(count);
  } catch (err) {
    res.status(500).json({ message: "Failed to get unread count" });
  }
};
