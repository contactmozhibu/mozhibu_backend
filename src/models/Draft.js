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

    topic: {
      type: String,
      default: "General",
    },

    language: String,

    ageCategory: {
      type: String,
      enum: [
        "Kids (0-6)",
        "Children (7-9)",
        "Pre-Teens (10-12)",
        "Teens (13-17)",
        "Young Adults (18-25)",
        "Adults (26+)",
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
