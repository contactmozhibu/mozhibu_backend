import User from "../models/User.js";
import Story from "../models/Story.js";
import Chapter from "../models/Chapter.js";
import Review from "../models/Review.js";
import Report from "../models/report.model.js";
import AuditLog from "../models/auditLog.model.js";
import Category from "../models/category.js";
import AgeCategory from "../models/AgeCategory.js";
import Notification from "../models/Notification.js";

// Dashboard Statistics
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStories = await Story.countDocuments();
    const totalChapters = await Chapter.countDocuments();
    const totalComments = await Review.countDocuments(); // Count reviews as comments
    const activeUsers = await User.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      isActive: true
    });
    const newUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalUsers,
      totalStories,
      totalChapters,
      totalComments,
      activeUsers,
      newUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Recent Activity Feed
export const getRecentActivity = async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email createdAt");
    
    const recentStories = await Story.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title author createdAt")
      .populate("author", "name");
    
    const recentReports = await Report.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("reason contentType status createdAt");

    res.json({
      recentUsers,
      recentStories,
      recentReports
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// USER MANAGEMENT

// Get All Users with Pagination & Filtering
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", role = "", status = "" } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    if (role) filter.role = role;
    if (status === "active") filter.isActive = true;
    if (status === "blocked" || status === "inactive") filter.isActive = false;

    const users = await User.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .select("username email role isActive createdAt _id")
      .sort({ createdAt: -1 });

    // Get story count for each user
    const usersWithStories = await Promise.all(
      users.map(async (user) => {
        const storyCount = await Story.countDocuments({ author: user._id });
        return {
          ...user.toObject(),
          name: user.username,
          status: user.isActive ? "active" : "inactive",
          storyCount
        };
      })
    );

    const total = await User.countDocuments(filter);

    res.json({
      users: usersWithStories,
      pagination: { total, pages: Math.ceil(total / limit), currentPage: page }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single User
export const getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("stories");
    
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update User Information
export const updateUser = async (req, res) => {
  try {
    const { name, email, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, bio },
      { new: true }
    ).select("-password");

    await AuditLog.create({
      admin: req.user.id,
      action: "UPDATE_USER",
      targetId: req.params.id,
      description: `Updated user information for ${user.email}`
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Block/Unblock User
export const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Toggle isActive status
    const wasActive = user.isActive;
    user.isActive = !user.isActive;
    await user.save();

    await AuditLog.create({
      admin: req.user.id,
      action: user.isActive ? "UNBLOCK_USER" : "BLOCK_USER",
      targetId: req.params.id,
      description: `${user.isActive ? "Unblocked" : "Blocked"} user ${user.email}`
    });

    res.json({ 
      message: `User ${user.isActive ? "unblocked" : "blocked"}`, 
      user: {
        ...user.toObject(),
        status: user.isActive ? "active" : "inactive"
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete user's stories
    await Story.deleteMany({ author: req.params.id });

    await AuditLog.create({
      admin: req.user.id,
      action: "DELETE_USER",
      targetId: req.params.id,
      description: `Deleted user account ${user.email}`
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Promote User to Admin
export const promoteUserToAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: "admin" },
      { new: true }
    ).select("-password");

    await AuditLog.create({
      admin: req.user.id,
      action: "PROMOTE_ADMIN",
      targetId: req.params.id,
      description: `Promoted user ${user.email} to admin`
    });

    res.json({ message: "User promoted to admin", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// STORY MANAGEMENT

// Get All Stories with Pagination & Filtering
export const getAllStories = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", status = "", language = "" } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (search) filter.title = { $regex: search, $options: "i" };
    if (status) filter.status = status;
    if (language) filter.language = language;

    const stories = await Story.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .select("title author category status language readCount likes createdAt")
      .populate("author", "username email ageCategory")
      .sort({ createdAt: -1 });

    const total = await Story.countDocuments(filter);

    res.json({
      stories,
      pagination: { total, pages: Math.ceil(total / limit), currentPage: page }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Story Detail
export const getStoryDetail = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate("author", "name email")
      .populate("chapters");

    if (!story) return res.status(404).json({ message: "Story not found" });

    res.json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Story Details
export const updateStory = async (req, res) => {
  try {
    const { title, description, category, language, status } = req.body;
    const story = await Story.findByIdAndUpdate(
      req.params.id,
      { title, description, category, language, status },
      { new: true }
    ).populate("author", "name email");

    await AuditLog.create({
      admin: req.user.id,
      action: "UPDATE_STORY",
      targetId: req.params.id,
      description: `Updated story ${story.title}`
    });

    res.json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Story
export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findByIdAndDelete(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });

    // Delete related chapters and reviews
    await Chapter.deleteMany({ story: req.params.id });
    await Review.deleteMany({ story: req.params.id });

    await AuditLog.create({
      admin: req.user.id,
      action: "DELETE_STORY",
      targetId: req.params.id,
      description: `Deleted story ${story.title}`
    });

    res.json({ message: "Story deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Story By Admin
export const deleteStoryByAdmin = async (req, res) => {
  try {
    const story = await Story.findByIdAndDelete(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });

    await Chapter.deleteMany({ story: req.params.id });
    await Review.deleteMany({ story: req.params.id });

    await AuditLog.create({
      admin: req.user.id,
      action: "ADMIN_DELETE_STORY",
      targetId: req.params.id,
      description: `Admin deleted story: ${story.title}`
    });

    res.json({ message: "Story deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Hide/Unhide Story
export const toggleHideStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });

    story.hidden = !story.hidden;
    await story.save();

    await AuditLog.create({
      admin: req.user.id,
      action: story.hidden ? "HIDE_STORY" : "UNHIDE_STORY",
      targetId: req.params.id,
      description: `${story.hidden ? "Hid" : "Unhid"} story ${story.title}`
    });

    res.json({ message: `Story ${story.hidden ? "hidden" : "unhidden"}`, story });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Feature/Unfeature Story
export const toggleFeatureStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });

    story.featured = !story.featured;
    await story.save();

    await AuditLog.create({
      admin: req.user.id,
      action: story.featured ? "FEATURE_STORY" : "UNFEATURE_STORY",
      targetId: req.params.id,
      description: `${story.featured ? "Featured" : "Unfeatured"} story ${story.title}`
    });

    res.json({ message: `Story ${story.featured ? "featured" : "unfeatured"}`, story });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CHAPTER MANAGEMENT

export const getAllChapters = async (req, res) => {
  try {
    const { page = 1, limit = 20, storyId = "", search = "", language = "" } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (storyId) filter.story = storyId;
    
    // Add search filter for chapter title
    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const chapters = await Chapter.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: "story",
        select: "title language author",
        populate: {
          path: "author",
          select: "username"
        }
      })
      .sort({ createdAt: -1 });

    // Filter out chapters with null/missing story, title, or author data
    let validChapters = chapters.filter(
      chapter =>
        chapter.story !== null &&
        chapter.story?.title &&
        chapter.story?.author !== null &&
        chapter.story?.author?.username
    );

    // Apply language filter after population
    if (language) {
      validChapters = validChapters.filter(chapter => chapter.story?.language === language);
    }

    const total = await Chapter.countDocuments(filter);

    res.json({
      chapters: validChapters,
      pagination: { total, pages: Math.ceil(total / limit), currentPage: page }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndDelete(req.params.id);
    if (!chapter) return res.status(404).json({ message: "Chapter not found" });

    await AuditLog.create({
      admin: req.user.id,
      action: "DELETE_CHAPTER",
      targetId: req.params.id,
      description: `Deleted chapter from story`
    });

    res.json({ message: "Chapter deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REVIEW MANAGEMENT

export const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, storyId = "", search = "", language = "" } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (storyId) filter.story = storyId;
    
    // Add search filter for story title
    if (search) {
      const storyFilter = { title: { $regex: search, $options: "i" } };
      const stories = await Story.find(storyFilter).select("_id");
      const storyIds = stories.map(s => s._id);
      filter.story = { $in: storyIds };
    }

    const reviews = await Review.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: "story",
        select: "title language author",
        populate: {
          path: "author",
          select: "username"
        }
      })
      .populate("user", "username")
      .sort({ createdAt: -1 });

    // Filter out reviews with invalid/missing story or author data
    let validReviews = reviews.filter(
      review => 
        review.story !== null && 
        review.story?.title && 
        review.story?.author !== null &&
        review.story?.author?.username &&
        review.user !== null &&
        review.user?.username
    );

    // Apply language filter after population
    if (language) {
      validReviews = validReviews.filter(review => review.story?.language === language);
    }

    const total = await Review.countDocuments(filter);

    res.json({
      reviews: validReviews,
      pagination: { total, pages: Math.ceil(total / limit), currentPage: page }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    await AuditLog.create({
      admin: req.user.id,
      action: "DELETE_REVIEW",
      targetId: req.params.id,
      description: `Deleted review`
    });

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REPORT MANAGEMENT

export const getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = "pending" } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status) filter.status = status;

    const reports = await Report.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });

    const total = await Report.countDocuments(filter);

    res.json({
      reports,
      pagination: { total, pages: Math.ceil(total / limit), currentPage: page }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { status, action } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    await AuditLog.create({
      admin: req.user.id,
      action: `REPORT_${action}`,
      targetId: req.params.id,
      description: `Updated report status to ${status}`
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CATEGORY MANAGEMENT

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1 });
    
    // Add subcategories and stories count for each category
    const categoriesWithStats = await Promise.all(
      categories.map(async (cat) => {
        const stories = await Story.find({ category: cat.name, status: "PUBLISHED" });
        
        // Count unique subcategories
        const subcategoriesSet = new Set();
        stories.forEach(story => {
          if (story.subcategories && Array.isArray(story.subcategories)) {
            story.subcategories.forEach(sub => subcategoriesSet.add(sub));
          }
        });
        
        // Get story titles and IDs for display
        const storiesList = stories.map(s => ({
          storyId: s._id,
          title: s.title
        }));
        
        return {
          ...cat.toObject(),
          subcategoryCount: subcategoriesSet.size,
          storiesCount: stories.length,
          stories: storiesList
        };
      })
    );
    
    res.json(categoriesWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ LOAD CATEGORIES WITH STORIES FROM DATABASE (REAL-TIME)
export const getCategoriesWithStoriesFromDB = async (req, res) => {
  try {
    const stories = await Story.find({
      status: "PUBLISHED"
    })
      .select("title category subcategories")
      .sort({ createdAt: -1 });

    const categoryData = stories.map(story => ({
      storyTitle: story.title,
      category: story.category || "-",
      subcategories: story.subcategories || []
    }));

    res.status(200).json(categoryData);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ✅ GET SPECIFIC CATEGORY WITH ALL ITS STORIES
export const getCategoryStoriesFromDB = async (req, res) => {
  try {
    const { categoryName } = req.params;
    
    console.log(`📚 Loading stories for category: ${categoryName}`);

    const stories = await Story.find({ 
      category: categoryName,
      status: "PUBLISHED"
    })
      .select("_id title description author language ageCategory subcategories readCount coverImage createdAt updatedAt")
      .populate("author", "username penName avatar")
      .sort({ createdAt: -1 });

    if (stories.length === 0) {
      return res.status(200).json({
        message: `No published stories found in category: ${categoryName}`,
        category: categoryName,
        storyCount: 0,
        stories: []
      });
    }

    // Collect subcategories
    const subcategoriesSet = new Set();
    stories.forEach(story => {
      if (story.subcategories && Array.isArray(story.subcategories)) {
        story.subcategories.forEach(sub => subcategoriesSet.add(sub));
      }
    });

    res.status(200).json({
      message: `✅ Found ${stories.length} stories in ${categoryName}`,
      category: categoryName,
      storyCount: stories.length,
      subcategoryCount: subcategoriesSet.size,
      subcategories: Array.from(subcategoriesSet),
      stories: stories.map(s => ({
        storyId: s._id,
        title: s.title,
        description: s.description,
        author: s.author?.username || "Unknown",
        language: s.language,
        ageCategory: s.ageCategory,
        subcategories: s.subcategories || [],
        readCount: s.readCount || 0,
        coverImage: s.coverImage,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }))
    });
  } catch (error) {
    console.error("❌ Error loading category stories:", error);
    res.status(500).json({ 
      message: error.message, 
      error: error.toString() 
    });
  }
};

// ✅ NEW - Test endpoint to check published stories
export const checkPublishedStories = async (req, res) => {
  try {
    const publishedCount = await Story.countDocuments({ status: "PUBLISHED" });
    const allCount = await Story.countDocuments();
    const stories = await Story.find({ status: "PUBLISHED" }).select("title category subcategories status");
    
    res.json({
      publishedCount,
      allCount,
      stories,
      message: `Found ${publishedCount} published stories out of ${allCount} total`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ NEW - Populate categories from existing stories data
export const populateCategoriesFromStories = async (req, res) => {
  try {
    console.log("🔍 Starting to populate categories from stories...");
    
    // Get all published stories
    const stories = await Story.find({ status: "PUBLISHED" });
    console.log(`📚 Found ${stories.length} published stories`);
    
    if (stories.length === 0) {
      return res.status(400).json({ 
        message: "No published stories found. Please publish some stories first.",
        storiesCount: 0
      });
    }

    // Extract unique categories
    const uniqueCategories = new Set();
    stories.forEach(story => {
      if (story.category) {
        uniqueCategories.add(story.category);
      }
    });

    console.log(`📂 Found ${uniqueCategories.size} unique categories:`, Array.from(uniqueCategories));

    // For each category, calculate subcategories and stories count
    const categoriesData = [];
    for (const categoryName of uniqueCategories) {
      const categoryStories = stories.filter(s => s.category === categoryName);
      const subcategoriesSet = new Set();
      
      categoryStories.forEach(story => {
        if (story.subcategories && Array.isArray(story.subcategories)) {
          story.subcategories.forEach(sub => subcategoriesSet.add(sub));
        }
      });

      // Extract story titles and IDs for this category
      const storiesList = categoryStories.map(story => ({
        storyId: story._id,
        title: story.title
      }));

      categoriesData.push({
        name: categoryName,
        description: `${categoryName} category with ${categoryStories.length} published stories`,
        order: categoriesData.length,
        subcategoryCount: subcategoriesSet.size,
        storiesCount: categoryStories.length,
        stories: storiesList,
        isActive: true
      });

      console.log(`  📋 ${categoryName}: ${categoryStories.length} stories, ${subcategoriesSet.size} subcategories`);
    }

    // Clear existing categories and insert new ones
    await Category.deleteMany({});
    console.log("🗑️ Cleared existing categories");
    
    const insertedCategories = await Category.insertMany(categoriesData);
    console.log(`✅ Inserted ${insertedCategories.length} categories`);

    res.status(201).json({
      message: `Successfully populated ${insertedCategories.length} categories from ${stories.length} stories`,
      categories: insertedCategories,
      storiesCount: stories.length
    });
  } catch (error) {
    console.error("❌ Error populating categories:", error);
    res.status(500).json({ message: error.message, error: error.toString() });
  }
};

// ✅ SYNC EXISTING STORIES WITH CATEGORIES
export const syncStoriesWithCategories = async (req, res) => {
  try {
    console.log("🔄 Starting to sync all stories with their categories...");
    
    const allStories = await Story.find({ status: "PUBLISHED" });
    console.log(`📚 Found ${allStories.length} published stories to sync`);
    
    let syncedCount = 0;
    let errors = [];

    for (const story of allStories) {
      try {
        // Check if story is already in category
        const categoryDoc = await Category.findOne({
          name: story.category,
          "stories.storyId": story._id
        });

        if (!categoryDoc) {
          // Add story to category if not already there
          const result = await Category.findOneAndUpdate(
            { name: story.category },
            { 
              $addToSet: { 
                stories: { 
                  storyId: story._id, 
                  title: story.title 
                } 
              } 
            },
            { upsert: false, new: true }
          );

          if (result) {
            syncedCount++;
            console.log(`  ✅ Synced: ${story.title} → ${story.category}`);
          }
        } else {
          console.log(`  ⏭️ Already synced: ${story.title}`);
        }
      } catch (error) {
        errors.push({
          storyId: story._id,
          title: story.title,
          error: error.message
        });
        console.warn(`  ⚠️ Error syncing ${story.title}:`, error.message);
      }
    }

    console.log(`\n✅ Sync complete! Successfully synced ${syncedCount} stories`);
    
    res.status(200).json({
      message: `Successfully synced ${syncedCount} stories with categories`,
      syncedCount,
      totalStories: allStories.length,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    console.error("❌ Error syncing stories:", error);
    res.status(500).json({ message: error.message, error: error.toString() });
  }
};

// ✅ UPDATE INDIVIDUAL STORY IN CATEGORY
export const updateStoryCategoryEntry = async (req, res) => {
  try {
    const { storyId } = req.params;
    
    // Find the story
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    console.log(`🔄 Updating story: ${story.title} in category: ${story.category}`);

    // Check if story already exists in category
    const categoryCheck = await Category.findOne({
      name: story.category,
      "stories.storyId": story._id
    });

    if (categoryCheck) {
      // Update existing entry (in case title changed)
      const result = await Category.findOneAndUpdate(
        {
          name: story.category,
          "stories.storyId": story._id
        },
        {
          $set: {
            "stories.$.title": story.title
          }
        },
        { new: true }
      );
      
      return res.status(200).json({
        message: `✅ Story title updated in category`,
        story: {
          storyId: story._id,
          title: story.title,
          category: story.category
        },
        action: "updated"
      });
    } else {
      // Add new entry
      const result = await Category.findOneAndUpdate(
        { name: story.category },
        {
          $addToSet: {
            stories: {
              storyId: story._id,
              title: story.title
            }
          }
        },
        { new: true }
      );

      if (!result) {
        return res.status(404).json({ 
          message: `Category "${story.category}" not found` 
        });
      }

      return res.status(200).json({
        message: `✅ Story added to category`,
        story: {
          storyId: story._id,
          title: story.title,
          category: story.category
        },
        action: "added"
      });
    }
  } catch (error) {
    console.error("❌ Error updating story in category:", error);
    res.status(500).json({ 
      message: error.message, 
      error: error.toString() 
    });
  }
};

// ✅ REMOVE STORY FROM CATEGORY
export const removeStoryFromCategory = async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    const result = await Category.findOneAndUpdate(
      { name: story.category },
      {
        $pull: {
          stories: { storyId: story._id }
        }
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      message: `✅ Story removed from category`,
      story: {
        storyId: story._id,
        title: story.title,
        category: story.category
      }
    });
  } catch (error) {
    console.error("❌ Error removing story from category:", error);
    res.status(500).json({ 
      message: error.message, 
      error: error.toString() 
    });
  }
};

// ✅ GET STORY CATEGORY STATUS (check if story is in its category)
export const getStoryCategoryStatus = async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Check if story is in its category
    const categoryWithStory = await Category.findOne({
      name: story.category,
      "stories.storyId": story._id
    });

    const isInCategory = !!categoryWithStory;

    res.status(200).json({
      story: {
        storyId: story._id,
        title: story.title,
        category: story.category,
        status: story.status
      },
      inDatabase: isInCategory,
      message: isInCategory 
        ? "✅ Story is in category database" 
        : "⚠️ Story is NOT in category database"
    });
  } catch (error) {
    console.error("❌ Error checking story status:", error);
    res.status(500).json({ 
      message: error.message, 
      error: error.toString() 
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = new Category({ name, description });
    await category.save();

    await AuditLog.create({
      admin: req.user.id,
      action: "CREATE_CATEGORY",
      targetId: category._id,
      description: `Created category ${name}`
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );

    await AuditLog.create({
      admin: req.user.id,
      action: "UPDATE_CATEGORY",
      targetId: req.params.id,
      description: `Updated category ${name}`
    });

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      admin: req.user.id,
      action: "DELETE_CATEGORY",
      targetId: req.params.id,
      description: `Deleted category ${category.name}`
    });

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// NOTIFICATION MANAGEMENT

export const sendNotification = async (req, res) => {
  try {
    const { title, message, targetUsers = "all" } = req.body;

    let recipients;
    if (targetUsers === "all") {
      recipients = await User.find().select("_id");
    } else if (targetUsers === "writers") {
      recipients = await User.find({ role: { $in: ["user", "admin"] } }).select("_id");
    } else if (Array.isArray(targetUsers)) {
      recipients = targetUsers;
    }

    const notifications = recipients.map(user => ({
      user: user._id,
      title,
      message,
      type: "announcement"
    }));

    await Notification.insertMany(notifications);

    await AuditLog.create({
      admin: req.user.id,
      action: "SEND_NOTIFICATION",
      description: `Sent notification to ${targetUsers}`
    });

    res.json({ message: "Notification sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ========================
   GET ALL NOTIFICATIONS
   ======================== */
export const getAllNotifications = async (req, res) => {
  try {
    const { search = "", type = "", status = "" } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { message: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } }
      ];
    }

    if (type && type !== "all") {
      query.type = type;
    }

    if (status === "read") {
      query.isRead = true;
    } else if (status === "unread") {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate("user", "username email avatar")
      .populate("fromUser", "username avatar")
      .populate("story", "title coverImage")
      .sort({ createdAt: -1 });

    const stats = {
      total: await Notification.countDocuments(),
      read: await Notification.countDocuments({ isRead: true }),
      unread: await Notification.countDocuments({ isRead: false }),
      system: await Notification.countDocuments({ type: "SYSTEM" })
    };

    res.json({ notifications, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ========================
   UPDATE NOTIFICATION
   ======================== */
export const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, type, isRead } = req.body;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { message, type, isRead },
      { new: true }
    )
      .populate("user", "username email")
      .populate("fromUser", "username avatar");

    await AuditLog.create({
      admin: req.user.id,
      action: "UPDATE_NOTIFICATION",
      description: `Updated notification ${id}`,
      details: { notificationId: id }
    });

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ========================
   DELETE NOTIFICATION
   ======================== */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    await Notification.findByIdAndDelete(id);

    await AuditLog.create({
      admin: req.user.id,
      action: "DELETE_NOTIFICATION",
      description: `Deleted notification ${id}`,
      details: { notificationId: id }
    });

    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ========================
   MARK NOTIFICATION AS READ
   ======================== */
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ========================
   MARK ALL NOTIFICATIONS AS READ
   ======================== */
export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({}, { isRead: true });

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// AUDIT LOGS

export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action = "" } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (action) filter.action = action;

    const logs = await AuditLog.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("admin", "name email")
      .sort({ createdAt: -1 });

    const total = await AuditLog.countDocuments(filter);

    res.json({
      logs,
      pagination: { total, pages: Math.ceil(total / limit), currentPage: page }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ──────────────────────────────────────────────────────────
// ANALYTICS - COMPREHENSIVE DASHBOARD DATA
// ──────────────────────────────────────────────────────────

// ✅ Get User Growth Data (Monthly)
export const getUserGrowthData = async (req, res) => {
  try {
    const last12Months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const count = await User.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });

      const monthName = startOfMonth.toLocaleString("default", { month: "short" });
      last12Months.push({
        month: monthName,
        users: count
      });
    }

    res.json(last12Months);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Story Growth Data (Monthly)
export const getStoryGrowthData = async (req, res) => {
  try {
    const last12Months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const count = await Story.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        status: "PUBLISHED"
      });

      const monthName = startOfMonth.toLocaleString("default", { month: "short" });
      last12Months.push({
        month: monthName,
        stories: count
      });
    }

    res.json(last12Months);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Language Distribution
export const getLanguageDistribution = async (req, res) => {
  try {
    const languages = await Story.aggregate([
      { $match: { status: "PUBLISHED" } },
      { $group: { _id: "$language", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const colorMap = {
      "Tamil": "#6C63FF",
      "English": "#FF6584",
      "Hindi": "#43C6AC",
      "Tanglish": "#FFB347",
      "Telugu": "#22c55e",
      "Kannada": "#ec4899"
    };

    const data = languages.map((lang, index) => ({
      name: lang._id || "Unknown",
      value: lang.count,
      color: colorMap[lang._id] || `hsl(${index * 60}, 70%, 60%)`
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Category Performance
export const getCategoryPerformanceData = async (req, res) => {
  try {
    // Get all published stories grouped by category
    const categoryStats = await Story.aggregate([
      { $match: { status: "PUBLISHED" } },
      {
        $group: {
          _id: "$category",
          storyCount: { $sum: 1 },
          totalViews: { $sum: "$views" },
          totalReadCount: { $sum: "$readCount" },
          avgRating: { $avg: "$rating" }
        }
      },
      { $sort: { storyCount: -1 } },
      { $limit: 6 }
    ]);

    const data = categoryStats.map(cat => ({
      category: cat._id || "Uncategorized",
      stories: cat.storyCount || 0,
      reads: (cat.totalViews || 0) + (cat.totalReadCount || 0),
      rating: (cat.avgRating || 0).toFixed(1)
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Weekly Reading Activity
export const getReadingActivityData = async (req, res) => {
  try {
    const last7Days = [];
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const reads = await Story.aggregate([
        { $match: { lastReadAt: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, count: { $sum: 1 } } }
      ]);

      const chapters = await Chapter.countDocuments({
        updatedAt: { $gte: startOfDay, $lte: endOfDay }
      });

      last7Days.push({
        day: days[i],
        reads: reads[0]?.count || 0,
        chapters: chapters
      });
    }

    res.json(last7Days);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Top Authors
export const getTopAuthorsData = async (req, res) => {
  try {
    const topAuthors = await User.aggregate([
      {
        $lookup: {
          from: "stories",
          localField: "_id",
          foreignField: "author",
          as: "stories"
        }
      },
      {
        $project: {
          name: "$username",
          stories: { $size: "$stories" },
          views: { $sum: "$stories.views" },
          followers: { $size: { $ifNull: ["$followers", []] } },
          rating: 4.5 // Default rating - can be calculated from reviews
        }
      },
      { $match: { stories: { $gt: 0 } } },
      { $sort: { stories: -1 } },
      { $limit: 5 }
    ]);

    res.json(topAuthors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Age Group Distribution
export const getAgeGroupDistributionData = async (req, res) => {
  try {
    const ageGroups = await Story.aggregate([
      { $match: { status: "PUBLISHED" } },
      { $group: { _id: "$ageCategory", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const ageGroupMap = {
      "Kids": "Kids",
      "Teens": "Teens",
      "Young Adults": "Young Adults",
      "Adults": "Adults",
      "All Ages": "All Ages"
    };

    const data = ageGroups.map(age => ({
      group: ageGroupMap[age._id] || age._id || "Unknown",
      stories: age.count,
      readers: Math.ceil(age.count * 15) // Estimate readers
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Platform Health Metrics
export const getPlatformHealthData = async (req, res) => {
  try {
    const totalStories = await Story.countDocuments({ status: "PUBLISHED" });
    const totalViews = await Story.aggregate([
      { $group: { _id: null, total: { $sum: "$views" } } }
    ]);
    const totalFollows = await User.aggregate([
      { $group: { _id: null, total: { $sum: { $size: "$followers" } } } }
    ]);
    const avgRating = await Review.aggregate([
      { $group: { _id: null, avg: { $avg: "$rating" } } }
    ]);
    const totalReviews = await Review.countDocuments();
    const totalComments = await Chapter.aggregate([
      { $group: { _id: null, total: { $sum: { $size: "$comments" } } } }
    ]);

    const data = [
      { metric: "Stories", value: Math.min(totalStories * 10, 100) },
      { metric: "Views", value: Math.min(Math.floor(totalViews[0]?.total / 100), 100) },
      { metric: "Follows", value: Math.min(Math.floor(totalFollows[0]?.total / 100), 100) },
      { metric: "Rating", value: Math.min((avgRating[0]?.avg || 4.5) * 20, 100) },
      { metric: "Reviews", value: Math.min(Math.floor(totalReviews / 10), 100) },
      { metric: "Comments", value: Math.min(Math.floor(totalComments[0]?.total / 100), 100) }
    ];

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Daily Activity Timeline
export const getDailyActivityData = async (req, res) => {
  try {
    const times = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"];
    const activityData = [];

    for (const time of times) {
      const [hour] = time.split(":");
      const startOfHour = new Date();
      startOfHour.setHours(parseInt(hour), 0, 0, 0);
      const endOfHour = new Date();
      endOfHour.setHours(parseInt(hour) + 1, 0, 0, 0);

      const activeUsers = await User.countDocuments({
        lastActive: { $gte: startOfHour, $lte: endOfHour }
      });

      const stories = await Story.countDocuments({
        updatedAt: { $gte: startOfHour, $lte: endOfHour }
      });

      const chapters = await Chapter.countDocuments({
        updatedAt: { $gte: startOfHour, $lte: endOfHour }
      });

      activityData.push({
        time,
        users: activeUsers,
        stories,
        chapters
      });
    }

    res.json(activityData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Most Viewed Stories
export const getTopStoriesData = async (req, res) => {
  try {
    const topStories = await Story.find({ status: "PUBLISHED" })
      .sort({ views: -1 })
      .limit(5)
      .select("title views readCount readDuration rating")
      .exec();

    const data = topStories.map(story => ({
      title: story.title || "Untitled",
      views: story.views || 0,
      reads: story.readCount || 0,
      rating: story.rating || 4.5
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Ratings Distribution
export const getRatingsDistributionData = async (req, res) => {
  try {
    const ratingsData = await Review.aggregate([
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const data = [
      { stars: "5★", count: ratingsData.find(r => r._id === 5)?.count || 0, color: "#22c55e" },
      { stars: "4★", count: ratingsData.find(r => r._id === 4)?.count || 0, color: "#84cc16" },
      { stars: "3★", count: ratingsData.find(r => r._id === 3)?.count || 0, color: "#eab308" },
      { stars: "2★", count: ratingsData.find(r => r._id === 2)?.count || 0, color: "#f97316" },
      { stars: "1★", count: ratingsData.find(r => r._id === 1)?.count || 0, color: "#ef4444" }
    ];

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Overall Analytics Summary
export const getAnalyticsSummary = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStories = await Story.countDocuments({ status: "PUBLISHED" });
    const totalChapters = await Chapter.countDocuments();
    const totalReads = await Story.aggregate([
      { $group: { _id: null, total: { $sum: "$views" } } }
    ]);

    const activeToday = await User.countDocuments({
      lastActive: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lte: new Date()
      }
    });

    const avgRating = await Review.aggregate([
      { $group: { _id: null, avg: { $avg: "$rating" } } }
    ]);

    res.json({
      totalUsers,
      totalStories,
      totalChapters,
      totalReads: totalReads[0]?.total || 0,
      activeToday,
      avgRating: (avgRating[0]?.avg || 4.5).toFixed(1)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Legacy Analytics Endpoint (kept for backward compatibility)
export const getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStories = await Story.countDocuments();
    const totalReads = await Story.aggregate([
      { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);

    const topStories = await Story.find()
      .sort({ views: -1 })
      .limit(10)
      .select("title views likes author")
      .populate("author", "name");

    const topAuthors = await User.find({ role: "user" })
      .sort({ storyCount: -1 })
      .limit(10)
      .select("name storyCount email");

    res.json({
      totalUsers,
      totalStories,
      totalReads: totalReads[0]?.totalViews || 0,
      topStories,
      topAuthors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// AGE CATEGORY MANAGEMENT

export const getAllAgeCategories = async (req, res) => {
  try {
    const ageCategories = await AgeCategory.find()
      .sort({ displayOrder: 1, minAge: 1 });
    res.json(ageCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAgeCategory = async (req, res) => {
  try {
    const { name, minAge, maxAge, description, requiresEroticType } = req.body;

    // Check if age category already exists
    const existing = await AgeCategory.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Age category already exists" });
    }

    const ageCategory = new AgeCategory({
      name,
      minAge,
      maxAge: maxAge || null,
      description,
      requiresEroticType: requiresEroticType || false,
      displayOrder: (await AgeCategory.countDocuments()) + 1
    });

    await ageCategory.save();

    await AuditLog.create({
      admin: req.user.id,
      action: "CREATE_AGE_CATEGORY",
      targetId: ageCategory._id,
      description: `Created age category ${name} (${minAge}-${maxAge || '∞'})`
    });

    res.status(201).json(ageCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAgeCategory = async (req, res) => {
  try {
    const { name, minAge, maxAge, description, requiresEroticType, displayOrder, isActive } = req.body;

    const ageCategory = await AgeCategory.findByIdAndUpdate(
      req.params.id,
      {
        name,
        minAge,
        maxAge: maxAge || null,
        description,
        requiresEroticType,
        displayOrder,
        isActive
      },
      { new: true }
    );

    if (!ageCategory) {
      return res.status(404).json({ message: "Age category not found" });
    }

    await AuditLog.create({
      admin: req.user.id,
      action: "UPDATE_AGE_CATEGORY",
      targetId: req.params.id,
      description: `Updated age category ${name}`
    });

    res.json(ageCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAgeCategory = async (req, res) => {
  try {
    const ageCategory = await AgeCategory.findByIdAndDelete(req.params.id);

    if (!ageCategory) {
      return res.status(404).json({ message: "Age category not found" });
    }

    await AuditLog.create({
      admin: req.user.id,
      action: "DELETE_AGE_CATEGORY",
      targetId: req.params.id,
      description: `Deleted age category ${ageCategory.name}`
    });

    res.json({ message: "Age category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const reorderAgeCategories = async (req, res) => {
  try {
    const { categories } = req.body; // Array of { id, displayOrder }

    for (const cat of categories) {
      await AgeCategory.findByIdAndUpdate(cat.id, { displayOrder: cat.displayOrder });
    }

    await AuditLog.create({
      admin: req.user.id,
      action: "REORDER_AGE_CATEGORIES",
      description: "Reordered age categories"
    });

    const updated = await AgeCategory.find().sort({ displayOrder: 1 });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============ PLATFORM SETTINGS MANAGEMENT ============

// Store settings in a global variable (in production, use database collection)
let platformSettings = {
  platformName: "Mozhibu",
  platformLogo: "",
  maintenanceMode: false,
  allowNewRegistrations: true,
  allowGuestReading: true
};

// Get Platform Settings
export const getSettings = async (req, res) => {
  try {
    res.json(platformSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Platform Settings
export const updateSettings = async (req, res) => {
  try {
    const {
      platformName,
      platformLogo,
      maintenanceMode,
      allowNewRegistrations,
      allowGuestReading,
      newPassword
    } = req.body;

    // Update platform settings
    if (platformName) platformSettings.platformName = platformName;
    if (platformLogo !== undefined) platformSettings.platformLogo = platformLogo;
    if (maintenanceMode !== undefined) platformSettings.maintenanceMode = maintenanceMode;
    if (allowNewRegistrations !== undefined) platformSettings.allowNewRegistrations = allowNewRegistrations;
    if (allowGuestReading !== undefined) platformSettings.allowGuestReading = allowGuestReading;

    // Update admin password if provided
    if (newPassword) {
      await User.findByIdAndUpdate(req.user._id, { password: newPassword });
    }

    // Log settings change
    await AuditLog.create({
      admin: req.user.id,
      action: "UPDATE_SETTINGS",
      description: "Updated platform settings"
    });

    res.json({
      message: "Settings updated successfully",
      settings: platformSettings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
