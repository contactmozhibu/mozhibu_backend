import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema(
{
  story: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Story",
  required: true
},

  title: { type: String, required: true },
  content: { type: String, required: true },

  chapterNumber: Number,

  isPublished: { type: Boolean, default: false },

  views: { type: Number, default: 0 }
},
{ timestamps: true }
);

export default mongoose.model("Chapter", chapterSchema);
