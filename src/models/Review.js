/*
import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  comment: {
    type: String,
    required: true,
  },

   parentReplyId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // 👈 allows nested replies
    },
    
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
}, { timestamps: true });

const reviewSchema = new mongoose.Schema(
  {
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      default: "",
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    //replies: [replySchema],
     replies: { type: [replySchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("Review", reviewSchema);
*/

import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  comment: {
    type: String,
    required: true,
  },

   parentReplyId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // 👈 allows nested replies
    },
    
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
}, { timestamps: true });

const reviewSchema = new mongoose.Schema(
  {
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      default: "",
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    //replies: [replySchema],
     replies: { type: [replySchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("Review", reviewSchema);