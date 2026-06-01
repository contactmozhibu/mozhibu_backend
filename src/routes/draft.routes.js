/* correct code

import express from "express";
import Draft from "../models/Draft.js";
import authMiddleware from "../middleware/auth.middleware.js";
import Story from "../models/Story.js";

const router = express.Router();

/* ======================
   CREATE DRAFT
====================== 
router.post("/", authMiddleware, async (req, res) => {
  try {
    const draft = new Story({
      ...req.body,
      author: req.user._id,
      status: "draft",
    });

    await draft.save();
    res.status(201).json(draft);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

/* ======================
   PUBLISH DRAFT  ✅ FIXED
====================== 
router.put("/:id/publish", authMiddleware, async (req, res) => {
  try {
    const story = await Story.findOneAndUpdate(
      {
        _id: req.params.id,
        author: req.user._id,
        status: "draft",
      },
      { status: "published" },
      { new: true }
    );

    if (!story) {
      return res.status(404).json({ message: "Draft not found" });
    }

    res.json({
      message: "Draft published successfully",
      story,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to publish draft" });
  }
});

/* ======================
   GET USER DRAFTS
====================== 
router.get("/", authMiddleware, async (req, res) => {
  try {
    const drafts = await Story.find({
      author: req.user._id,
      status: "draft",
    }).sort({ updatedAt: -1 });

    res.json(drafts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load drafts" });
  }
});

/* ======================
   GET DRAFT BY ID
====================== 
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const draft = await Story.findOne({
      _id: req.params.id,
      author: req.user._id,
      status: "draft",
    });

    if (!draft) {
      return res.status(404).json({ message: "Draft not found" });
    }

    res.json(draft);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load draft" });
  }
});

/* ======================
   UPDATE DRAFT
====================== 
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const draft = await Story.findOneAndUpdate(
      {
        _id: req.params.id,
        author: req.user._id,
        status: "draft",
      },
      req.body,
      { new: true }
    );

    res.json(draft);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update draft" });
  }
});

/* ======================
   DELETE DRAFT
====================== 
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const draft = await Story.findOneAndDelete({
      _id: req.params.id,
      author: req.user._id,
      status: "draft",
    });

    if (!draft) {
      return res.status(404).json({ message: "Draft not found" });
    }

    res.json({ message: "Draft deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete draft" });
  }
});

export default router;
*/

/*new code
import express from "express";
import Draft from "../models/Draft.js";
import Story from "../models/Story.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

/* ======================
   CREATE DRAFT
====================== 
router.post("/", authMiddleware, async (req, res) => {
  try {
    const draft = new Draft({
      ...req.body,
      author: req.user._id,
      status: "draft",
    });

    await draft.save();
    res.status(201).json(draft);
  } catch (err) {
    console.error("Draft save error:", err);
    res.status(400).json({ message: err.message });
  }
});


/* ======================
   UPDATE DRAFT
====================== 
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const draft = await Draft.findOneAndUpdate(
      { _id: req.params.id, author: req.user._id },
      req.body,
      { new: true }
    );

    if (!draft) return res.status(404).json({ message: "Draft not found" });

    res.json(draft);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

/* ======================
   GET USER DRAFTS
====================== 
router.get("/", authMiddleware, async (req, res) => {
  const drafts = await Draft.find({ author: req.user._id }).sort({ updatedAt: -1 });
  res.json(drafts);
});

/* ======================
   GET DRAFT BY ID
====================== 
router.get("/:id", authMiddleware, async (req, res) => {
  const draft = await Draft.findOne({
    _id: req.params.id,
    author: req.user._id,
  });

  if (!draft) return res.status(404).json({ message: "Draft not found" });
  res.json(draft);
});

/* ======================
   PUBLISH DRAFT
====================== 
router.put("/:id/publish", authMiddleware, async (req, res) => {
  try {
    const draft = await Draft.findOne({
      _id: req.params.id,
      author: req.user._id,
    });

    if (!draft) return res.status(404).json({ message: "Draft not found" });

    const story = new Story({
      ...draft.toObject(),
      status: "published",
      _id: undefined, // 🔥 create new doc
    });

    await story.save();
    await draft.deleteOne();

    res.json({ message: "Published", story });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Publish failed" });
  }
});

/* ======================
   DELETE DRAFT
====================== 
router.delete("/:id", authMiddleware, async (req, res) => {
  await Draft.findOneAndDelete({
    _id: req.params.id,
    author: req.user._id,
  });

  res.json({ message: "Draft deleted" });
});

export default router;
*/

/*
import express from "express";
import Draft from "../models/Draft.js";
import Story from "../models/Story.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const draft = new Draft({
      ...req.body,
      author: req.user._id,
    });

    await draft.save();
    res.status(201).json(draft);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const draft = await Draft.findOneAndUpdate(
    { _id: req.params.id, author: req.user._id },
    req.body,
    { new: true }
  );

  if (!draft) return res.status(404).json({ message: "Draft not found" });
  res.json(draft);
});

router.get("/", authMiddleware, async (req, res) => {
  const drafts = await Draft.find({ author: req.user._id }).sort({
    updatedAt: -1,
  });
  res.json(drafts);
});

router.get("/:id", authMiddleware, async (req, res) => {
  const draft = await Draft.findOne({
    _id: req.params.id,
    author: req.user._id,
  });

  if (!draft) return res.status(404).json({ message: "Draft not found" });
  res.json(draft);
});

router.put("/:id/publish", authMiddleware, async (req, res) => {
  try {
    const draft = await Draft.findOne({
      _id: req.params.id,
      author: req.user._id,
    });

    if (!draft) return res.status(404).json({ message: "Draft not found" });

    const story = new Story({
      ...draft.toObject(),
      _id: undefined,
    });

    await story.save();
    await draft.deleteOne();

    res.json({ message: "Published successfully", story });
  } catch (err) {
    res.status(500).json({ message: "Publish failed" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  await Draft.findOneAndDelete({
    _id: req.params.id,
    author: req.user._id,
  });

  res.json({ message: "Draft deleted" });
});

export default router;
*/

import express from "express";
import Draft from "../models/Draft.js";
import Story from "../models/Story.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { createDraft } from "../controllers/draftController.js";

const router = express.Router();

/* ======================
   CREATE DRAFT
====================== */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      content,
      ageCategory,
      contentType, // Erotic / Non-Erotic
    } = req.body;

    // 🔴 BASIC VALIDATION
    if (!title || !content || !ageCategory) {
      return res.status(400).json({
        message: "Title, content and age group are required",
      });
    }

    // 🔞 18+ VALIDATION
    if (
      (ageCategory.includes("18") || ageCategory.includes("Adults")) &&
      !contentType
    ) {
      return res.status(400).json({
        message: "Erotic / Non-Erotic required for 18+ age group",
      });
    }

    const draft = new Draft({
      ...req.body,
      author: req.user._id,
    });

    await draft.save();
    res.status(201).json(draft);
  } catch (err) {
    console.error("Draft save error:", err);
    res.status(400).json({ message: err.message });
  }
});

/* ======================
   UPDATE DRAFT
====================== */
router.put("/:id", authMiddleware, async (req, res) => {
  const draft = await Draft.findOneAndUpdate(
    { _id: req.params.id, author: req.user._id },
    req.body,
    { new: true }
  );

  if (!draft) {
    return res.status(404).json({ message: "Draft not found" });
  }

  res.json(draft);
});

/* ======================
   GET USER DRAFTS
====================== */
router.get("/", authMiddleware, async (req, res) => {
  const drafts = await Draft.find({ author: req.user._id }).sort({
    updatedAt: -1,
  });

  res.json(drafts);
});

/* ======================
   GET SINGLE DRAFT
====================== */
router.get("/:id", authMiddleware, async (req, res) => {
  const draft = await Draft.findOne({
    _id: req.params.id,
    author: req.user._id,
  });

  if (!draft) {
    return res.status(404).json({ message: "Draft not found" });
  }

  res.json(draft);
});

/* ======================
   🔥 PUBLISH DRAFT
====================== */
router.put("/:id/publish", authMiddleware, async (req, res) => {
  try {
    const draft = await Draft.findOne({
      _id: req.params.id,
      author: req.user._id,
    });

    if (!draft) {
      return res.status(404).json({ message: "Draft not found" });
    }

    // 🔴 SAFETY CHECK BEFORE PUBLISH
    if (
      (draft.ageCategory?.includes("18") ||
        draft.ageCategory?.includes("Adults")) &&
      !draft.contentType
    ) {
      return res.status(400).json({
        message: "Erotic / Non-Erotic required for 18+ age group",
      });
    }

    const story = new Story({
      ...draft.toObject(),
      _id: undefined,
      publishedAt: new Date(),
    });

    await story.save();
    await draft.deleteOne();

    res.json({ message: "Published successfully", story });
  } catch (err) {
    console.error("Publish error:", err);
    res.status(500).json({ message: "Publish failed" });
  }
});

/* ======================
   DELETE DRAFT
====================== */
router.delete("/:id", authMiddleware, async (req, res) => {
  await Draft.findOneAndDelete({
    _id: req.params.id,
    author: req.user._id,
  });

  res.json({ message: "Draft deleted" });
});

export default router;
