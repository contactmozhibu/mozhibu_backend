import mongoose from "mongoose";

const seriesSchema = new mongoose.Schema(
{
  title: { type: String, required: true },
  description: String,
  coverImage: String,

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  language: { type: String, default: "English" },

  isPublished: { type: Boolean, default: false },

  totalChapters: { type: Number, default: 0 }
},
{ timestamps: true }
);

export default mongoose.model("Series", seriesSchema);
