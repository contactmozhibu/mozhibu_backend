import express from "express";
import {
  register,
  login,
  protectedRoute,
  forgotPassword,
  resetPassword,
  verifyOtp,
  resendOtp,
  changePassword,
} from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

router.post("/change-password", authMiddleware, changePassword);

//router.get("/me", protect, getProfile);


export default router;
