import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    contentType: {
      type: String,
      enum: ["story", "chapter", "comment"],
      required: true
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    reason: {
      type: String,
      enum: ["spam", "abuse", "harassment", "copyright", "inappropriate"],
      required: true
    },
    description: {
      type: String
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt: Date,
    action: {
      type: String,
      enum: ["removed", "warned_user", "suspended_user", "no_action"]
    }
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ contentType: 1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;
