/*import express from "express";
import auth from "../middleware/auth.middleware.js";

import { createChapter, getChapters, publishChapter } from "../controllers/chapter.controller.js";

const router = express.Router();

router.post("/:seriesId", auth, createChapter);
router.get("/:seriesId", getChapters);
router.put("/publish/:id", auth, publishChapter);

export default router;
*/

import express from "express";
import auth from "../middleware/auth.middleware.js";

import {
  createChapter,
  getChapters,
  publishChapter,
  publishManyChapters
} from "../controllers/chapter.controller.js";

const router = express.Router();

// ➤ Create single chapter
router.post("/:seriesId", auth, createChapter);

// ➤ Get all published chapters for a story
router.get("/:seriesId", getChapters);

// ➤ Publish single chapter
router.put("/publish/:id", auth, publishChapter);

// ➤ Publish ALL chapters of a story
router.put("/publish-many/:seriesId", auth, publishManyChapters);

export default router;