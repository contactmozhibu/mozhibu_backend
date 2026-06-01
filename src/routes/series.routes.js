import express from "express";
import { createSeries, getMySeries } from "../controllers/series.controller.js";
import auth from "../middleware/auth.middleware.js";


const router = express.Router();

router.post("/", auth, createSeries);
router.get("/mine", auth, getMySeries);

export default router;
