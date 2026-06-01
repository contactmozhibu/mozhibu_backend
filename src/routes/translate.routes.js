import express from "express";
import { translateText } from "../controllers/translate.controller.js";

const router = express.Router();

// ❗ NO authMiddleware here
router.post("/", translateText);

export default router;
