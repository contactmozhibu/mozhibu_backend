import User from "../models/User.js";

const activeUserMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // ✅ CHECK IF ACCOUNT IS ACTIVE
    if (!user.isActive) {
      return res.status(403).json({
        message:
          "Your account has been deactivated. Please contact support to reactivate.",
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export default activeUserMiddleware;
