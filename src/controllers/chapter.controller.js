/*import Chapter from "../models/Chapter.js";


/* CREATE CHAPTER 
export const createChapter = async (req, res) => {
  try {
    const count = await Chapter.countDocuments({
      story: req.params.seriesId
    });

    const chapter = await Chapter.create({
      story: req.params.seriesId,
      title: req.body.title,
      content: req.body.content,
      chapterNumber: count + 1
    });

    res.json(chapter);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET ALL CHAPTERS OF SERIES 
export const getChapters = async (req, res) => {
  const chapters = await Chapter.find({
    story: req.params.seriesId,
    isPublished: true
  }).sort("chapterNumber");

  res.json(chapters);
};

/* PUBLISH CHAPTER 
export const publishChapter = async(req,res)=>{
  await Chapter.findByIdAndUpdate(req.params.id,{
    isPublished:true
  });

  res.json({message:"Chapter published"});
};
*/

import Chapter from "../models/Chapter.js";
import Story from "../models/Story.js";

/* ---------------------------------------------------
    CREATE CHAPTER
--------------------------------------------------- */
export const createChapter = async (req, res) => {
  try {
    const { title, content } = req.body;
    const { seriesId } = req.params;
    const userId = req.user._id; // From auth middleware

    console.log("📝 CREATE CHAPTER - Debug:");
    console.log("userId from token:", userId, typeof userId);
    console.log("seriesId from params:", seriesId);

    // ✅ Verify user is the story author
    const story = await Story.findById(seriesId);
    if (!story) {
      console.log("❌ Story not found:", seriesId);
      return res.status(404).json({ message: "Story not found" });
    }

    console.log("story.author:", story.author, typeof story.author);
    const storyAuthorId = story.author._id || story.author;
    const userIdString = userId.toString();
    const authorIdString = storyAuthorId.toString();

    console.log("Comparing - userIdString:", userIdString, "vs authorIdString:", authorIdString);
    console.log("Match?", userIdString === authorIdString);

    if (userIdString !== authorIdString) {
      console.log("❌ User is NOT the author");
      return res.status(403).json({ message: "Only the author can add chapters" });
    }

    console.log("✅ User IS the author - creating chapter");

    // Count chapters for auto chapter numbering
    const count = await Chapter.countDocuments({ story: seriesId });

    const chapter = await Chapter.create({
      story: seriesId,
      title,
      content,
      chapterNumber: count + 1,
      isPublished: false
    });

    console.log("✅ Chapter created:", chapter._id);
    res.json(chapter);
  } catch (err) {
    console.error("❌ CREATE CHAPTER ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }

};


/* ---------------------------------------------------
    GET ALL PUBLISHED CHAPTERS OF STORY
--------------------------------------------------- */
export const getChapters = async (req, res) => {
  try {
    const { seriesId } = req.params;

    const chapters = await Chapter.find({
      story: seriesId,
      isPublished: true
    }).sort("chapterNumber");

    res.json(chapters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ---------------------------------------------------
    PUBLISH SINGLE CHAPTER
--------------------------------------------------- */
export const publishChapter = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware
    const { id: chapterId } = req.params;

    console.log("📢 PUBLISH CHAPTER - Debug:");
    console.log("userId from token:", userId);
    console.log("chapterId:", chapterId);

    // Get the chapter to find its story
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      console.log("❌ Chapter not found:", chapterId);
      return res.status(404).json({ message: "Chapter not found" });
    }

    // Verify user is the story author
    const story = await Story.findById(chapter.story);
    if (!story) {
      console.log("❌ Story not found:", chapter.story);
      return res.status(404).json({ message: "Story not found" });
    }

    const storyAuthorId = story.author._id || story.author;
    const userIdString = userId.toString();
    const authorIdString = storyAuthorId.toString();

    console.log("Comparing - userIdString:", userIdString, "vs authorIdString:", authorIdString);
    console.log("Match?", userIdString === authorIdString);

    if (userIdString !== authorIdString) {
      console.log("❌ User is NOT the author");
      return res.status(403).json({ message: "Only the author can publish chapters" });
    }

    // Publish the chapter
    console.log("✅ User IS the author - publishing chapter");
    await Chapter.findByIdAndUpdate(chapterId, {
      isPublished: true
    });

    console.log("✅ Chapter published");
    res.json({ message: "Chapter published" });
  } catch (err) {
    console.error("❌ PUBLISH CHAPTER ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};


/* ---------------------------------------------------
    PUBLISH ALL CHAPTERS FOR A STORY
--------------------------------------------------- */
export const publishManyChapters = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware
    const { seriesId } = req.params;

    // Verify user is the story author
    const story = await Story.findById(seriesId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    if (story.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the author can publish chapters" });
    }

    // Publish all chapters
    await Chapter.updateMany(
      { story: seriesId },
      { $set: { isPublished: true } }
    );

    res.json({ message: "All chapters published!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};