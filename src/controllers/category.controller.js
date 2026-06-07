import Story from "../models/Story.js";

export const getCategoryManagement = async (req, res) => {
  try {
    const stories = await Story.find({
      status: "PUBLISHED",
    })
      .populate("author", "username")
      .sort({ createdAt: -1 });

    const data = stories.map((story) => ({
      _id: story._id,
      title: story.title,
      author: story.author?.username,
      category: story.category,
      subcategories: story.subcategories || [],
      language: story.language,
      status: story.status,
      publishedAt: story.updatedAt,
    }));

    res.json({
      success: true,
      totalStories: data.length,
      stories: data,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch category management data",
    });
  }
};