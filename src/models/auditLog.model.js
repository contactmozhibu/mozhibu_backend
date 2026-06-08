import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        "UPDATE_USER",
        "BLOCK_USER",
        "UNBLOCK_USER",
        "DELETE_USER",
        "PROMOTE_ADMIN",
        "UPDATE_STORY",
        "DELETE_STORY",
        "ADMIN_DELETE_STORY",
        "HIDE_STORY",
        "UNHIDE_STORY",
        "FEATURE_STORY",
        "UNFEATURE_STORY",
        "DELETE_CHAPTER",
        "DELETE_REVIEW",
        "REPORT_APPROVED",
        "REPORT_REJECTED",
        "CREATE_CATEGORY",
        "UPDATE_CATEGORY",
        "DELETE_CATEGORY",
        "SEND_NOTIFICATION",
        "UPDATE_SETTINGS"
      ]
    },
    targetId: mongoose.Schema.Types.ObjectId,
    targetType: {
      type: String,
      enum: ["User", "Story", "Chapter", "Review", "Report", "Category"]
    },
    description: {
      type: String,
      required: true
    },
    metadata: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

// Index for quick lookups
auditLogSchema.index({ admin: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
