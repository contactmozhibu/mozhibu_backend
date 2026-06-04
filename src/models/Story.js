
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now },
});

const storySchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    storyType: {
  type: String,
  enum: ["single", "multi"],
  default: "single"
},
    content: {
  type: String,
  required: function () {
    return this.storyType === "single";
  },
},
    contentType: {
  type: String,
  enum: ["Erotic", "Non-Erotic"],
  default: "Non-Erotic",
},


    category: {
      type: String,
      required: true,
    },

    topic: {
  type: String,
  default: "General",
},

    subcategories: {
      type: [String],
      default: [],
      validate: {
        validator: function(arr) {
          return arr.length <= 3;
        },
        message: "Maximum 3 subcategories allowed"
      }
    },

    //language: String,
    language: {
  type: String,
  enum: ["English", "Tamil"],
  default: "English"
},

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


    // 🔥 NEW FIELD (only for 18+)
    eroticType: {
      type: String,
      enum: ["Erotic", "Non-Erotic"],
      required: function () {
        return (
          this.ageCategory === "Young Adults" ||
          this.ageCategory === "Adults"
        );
      },
    },

    coverImage: String,

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

        status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED"],
      default: "PUBLISHED",
    },


    readCount: { type: Number, default: 0 },
    reviews: [reviewSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Story", storySchema);
