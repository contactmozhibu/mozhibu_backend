import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import adminMiddleware from "../middleware/admin.middleware.js";

import {
  getAllUsers,
  deactivateUser,
  deleteUser,
  deleteStoryByAdmin,
} from "../controllers/admin.controller.js";

const router = express.Router();

/* =========================
   ADMIN ROUTES
========================= */

router.get("/users", authMiddleware, adminMiddleware, getAllUsers);

router.patch(
  "/users/:id/deactivate",
  authMiddleware,
  adminMiddleware,
  deactivateUser
);

router.delete(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  deleteUser
);

router.delete(
  "/stories/:id",
  authMiddleware,
  adminMiddleware,
  deleteStoryByAdmin
);

export default router;
