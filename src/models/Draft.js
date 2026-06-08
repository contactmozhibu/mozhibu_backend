import mongoose from "mongoose";

const draftSchema = new mongoose.Schema(
  {
    title: String,
    description: String,

    content: {
      type: String,
      required: true,
    },

    contentType: {
  type: String,
  enum: ["Erotic", "Non-Erotic", null],
  default: null,
},

    category: {
      type: String,
      required: true,
    },
/*
    topic: {
      type: String,
      default: "General",
    },
*/
    subcategories: {
  type: [String],
  default: [],
},

    language: String,

ageCategory: {
  type: String,
  enum: [
    "Kids (0-9)",
    "Teens (10-17)",
    "Adults (18+)",
  ],
  required: true,
},
    coverImage: String,

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Draft", draftSchema);
