
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["REVIEW", "PUBLISHED", "FOLLOW", "COMMENT", "SYSTEM"],
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
    },

    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
