
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
/*
    topic: {
  type: String,
  default: "General",
},
*/

<<<<<<< HEAD
subcategories: {
  type: [String],
  default: [],
},
   // language: String,
=======
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
>>>>>>> 4d30518878c9140b21d8b518203420f28d106e7d

    ageCategory: {
  type: String,
  enum: [
    "Kids (0-9)",
    "Teens (10-17)",
    "Adults (18+)",
  ],
  required: true,
},


language: {
  type: String,
  enum: ["English", "Tamil"],
  default: "English"
},


    // 🔥 NEW FIELD (only for 18+)
   contentType: {
      type: String,
      enum: ["Erotic", "Non-Erotic"],
      required: function () {
  return this.ageCategory === "Adults (18+)";
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
