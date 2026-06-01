/*
import Draft from "../models/Draft.js";

export const createDraft = async (req, res) => {
  try {
    const draft = await Draft.create({
      ...req.body,
      author: req.user.id, // 🔑 THIS is missing now
    });

    res.status(201).json(draft);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Draft save failed" });
  }
};
*/

import Draft from "../models/Draft.js";

export const createDraft = async (req, res) => {
  try {

    const draft = await Draft.create({
      ...req.body,
      author: req.user._id
    });

    res.status(201).json(draft);

  } catch (error) {

    console.error("Draft save error:", error);

    res.status(400).json({
      message: "Draft save failed"
    });

  }
};