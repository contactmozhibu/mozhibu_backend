import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";
import { uploadCoverImage } from "../controllers/upload.controller.js";

const router = express.Router();

// Upload cover image (requires authentication)
router.post("/cover", authMiddleware, upload.single("coverImage"), uploadCoverImage);

export default router;
