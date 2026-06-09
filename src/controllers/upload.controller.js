import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const uploadCoverImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Generate image URL
    const imageUrl = `/uploads/covers/${req.file.filename}`;

    console.log("✅ Image uploaded successfully:", imageUrl);

    res.json({
      success: true,
      imageUrl,
      filename: req.file.filename,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};
