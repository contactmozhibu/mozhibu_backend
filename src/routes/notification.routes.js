import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getMyNotifications,
  markAsRead,
  getUnreadCount,
  markAllRead,  
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getMyNotifications);
router.get("/unread-count", authMiddleware, getUnreadCount);
router.patch("/:id/read", authMiddleware, markAsRead);
router.put("/mark-read", authMiddleware, markAllRead);

export default router;
