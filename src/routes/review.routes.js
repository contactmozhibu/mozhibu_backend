import express from "express";
import { createReview, getReviewsByStory ,  addReply, likeReview,replyReview } from "../controllers/review.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createReview); // 🔐 login required
router.get("/:storyId", getReviewsByStory);
router.post(
  "/:reviewId/reply",
  authMiddleware,
  addReply
);

router.put(
  "/:reviewId/like",
  authMiddleware,
  likeReview
);

router.post("/:reviewId/reply", authMiddleware, replyReview);

export default router;
