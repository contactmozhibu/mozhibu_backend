import mongoose from "mongoose";

const ageCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // e.g., "Kids (0-12)", "Teens (13-17)", "Adults (18+)"
    },
    minAge: {
      type: Number,
      required: true,
      default: 0,
    },
    maxAge: {
      type: Number,
      default: null, // null means no upper limit (for Adults)
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    requiresEroticType: {
      type: Boolean,
      default: false, // Only true for 18+
    },
    description: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AgeCategory", ageCategorySchema);
