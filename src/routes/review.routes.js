import express from "express";
import { createReview, getReviewsByStory } from "../controllers/review.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createReview); // 🔐 login required
router.get("/:storyId", getReviewsByStory);

export default router;
