import bcrypt from "bcryptjs";
import crypto from "crypto";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";
import User from "../models/User.js";
import { getAgeGroup } from "../utils/ageGroup.js";


export const register = async (req, res) => {
  try {
    const { username, email, password, dob } = req.body;

    // 🔒 Check existing user
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🎂 Calculate age
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
// 🧠 Determine ageGroup + ageKey
let ageGroup;
let ageKey;

if (age <= 9) {
  ageGroup = "Kids (0-9)";
  ageKey = "kids";
} else if (age <= 17) {
  ageGroup = "Teens (10-17)";
  ageKey = "teens";
} else {
  ageGroup = "Adults (18+)";
  ageKey = "adults";
}

    // 👤 Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      dob,
      ageGroup,
      ageKey,
    });

    // ✅ Response
    res.status(201).json({
      token: generateToken(user),
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role || "user",
        ageGroup: user.ageGroup,
        ageKey: user.ageKey,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Registration failed" });
  }
};


/* LOGIN */
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({
    token: generateToken(user),
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role || "user",
      isActive: user.isActive,
    },
  });
};

/* FORGOT PASSWORD */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: "Mozhibu - Reset Password",
    text: `Click here to reset your password:\n${resetUrl}`,
  });

  res.json({ message: "Reset link sent to email" });
};

/* RESET PASSWORD */
export const resetPassword = async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  user.password = await bcrypt.hash(req.body.password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.json({ message: "Password reset successful" });
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user || user.otp !== otp || user.otpExpire < Date.now()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpire = undefined;

  await user.save();

  res.json({ message: "OTP verified successfully" });
};

export const resendOtp = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.otp = otp;
  user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  // optional email sending (can log for now)
  console.log("Resent OTP:", otp);

  res.json({ message: "OTP resent successfully" });
};

export const protectedRoute = (req, res) => {
  res.json({
    message: "Access granted",
    user: req.user,
  });
};

/* CHANGE PASSWORD (LOGGED-IN USER) */
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // req.user is already set by authMiddleware
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Update only the password field using findByIdAndUpdate
    await User.findByIdAndUpdate(
      req.user._id,
      { password: await bcrypt.hash(newPassword, 10) },
      { runValidators: false } // Skip validation to avoid ageKey issues
    );

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   DEACTIVATE ACCOUNT
========================= */
export const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, {
      isActive: false
    });

    res.status(200).json({
      message: "Account deactivated successfully"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   DELETE ACCOUNT
========================= */
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      message: "Account deleted permanently"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
