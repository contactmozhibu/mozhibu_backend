import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import adminMiddleware from "../middleware/admin.middleware.js";
import {
  // Dashboard
  getDashboardStats,
  getRecentActivity,

  // User Management
  getAllUsers,
  getUserDetail,
  updateUser,
  toggleBlockUser,
  deleteUser,
  promoteUserToAdmin,

  // Story Management
  getAllStories,
  getStoryDetail,
  updateStory,
  deleteStory,
  deleteStoryByAdmin,
  toggleHideStory,
  toggleFeatureStory,

  // Chapter Management
  getAllChapters,
  deleteChapter,

  // Review Management
  getAllReviews,
  deleteReview,

  // Report Management
  getAllReports,
  updateReportStatus,

  // Category Management
  getAllCategories,
  getCategoriesWithStoriesFromDB,
  getCategoryStoriesFromDB,
  checkPublishedStories,
  populateCategoriesFromStories,
  syncStoriesWithCategories,
  updateStoryCategoryEntry,
  removeStoryFromCategory,
  getStoryCategoryStatus,
  createCategory,
  updateCategory,
  deleteCategory,

  // Notification Management
  sendNotification,
  getAllNotifications,
  updateNotification,
  deleteNotification,
  markNotificationRead,
  markAllNotificationsRead,

  // Audit Logs
  getAuditLogs,

  // Analytics
  getAnalytics,
  getUserGrowthData,
  getStoryGrowthData,
  getLanguageDistribution,
  getCategoryPerformanceData,
  getReadingActivityData,
  getTopAuthorsData,
  getAgeGroupDistributionData,
  getPlatformHealthData,
  getDailyActivityData,
  getTopStoriesData,
  getRatingsDistributionData,
  getAnalyticsSummary,

  // Age Category Management
  getAllAgeCategories,
  createAgeCategory,
  updateAgeCategory,
  deleteAgeCategory,
  reorderAgeCategories,

  // Settings Management
  getSettings,
  updateSettings
} from "../controllers/admin.controller.js";

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authMiddleware, adminMiddleware);

// DASHBOARD ROUTES
router.get("/dashboard/stats", getDashboardStats);
router.get("/dashboard/activity", getRecentActivity);

// USER MANAGEMENT ROUTES
router.get("/users", getAllUsers);
router.get("/users/:id", getUserDetail);
router.put("/users/:id", updateUser);
router.patch("/users/:id/block", toggleBlockUser);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/promote", promoteUserToAdmin);

// STORY MANAGEMENT ROUTES
router.get("/stories", getAllStories);
router.get("/stories/:id", getStoryDetail);
router.put("/stories/:id", updateStory);
router.delete("/stories/:id", deleteStory);
router.patch("/stories/:id/hide", toggleHideStory);
router.patch("/stories/:id/feature", toggleFeatureStory);

// CHAPTER MANAGEMENT ROUTES
router.get("/chapters", getAllChapters);
router.delete("/chapters/:id", deleteChapter);

// REVIEW MANAGEMENT ROUTES
router.get("/reviews", getAllReviews);
router.delete("/reviews/:id", deleteReview);

// REPORT MANAGEMENT ROUTES
router.get("/reports", getAllReports);
router.patch("/reports/:id/status", updateReportStatus);

// CATEGORY MANAGEMENT ROUTES
router.get("/categories/debug/published-stories", checkPublishedStories);
router.get("/categories/stories-from-db", getCategoriesWithStoriesFromDB);
router.get("/categories/:categoryName/stories-from-db", getCategoryStoriesFromDB);
router.get("/categories", getAllCategories);
router.post("/categories/populate", populateCategoriesFromStories);
router.post("/categories/sync", syncStoriesWithCategories);
router.post("/categories/story/:storyId", updateStoryCategoryEntry);
router.delete("/categories/story/:storyId", removeStoryFromCategory);
router.get("/categories/story/:storyId/status", getStoryCategoryStatus);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// NOTIFICATION MANAGEMENT ROUTES
router.get("/notifications", getAllNotifications);
router.post("/notifications/send", sendNotification);
router.put("/notifications/:id", updateNotification);
router.delete("/notifications/:id", deleteNotification);
router.patch("/notifications/:id/read", markNotificationRead);
router.patch("/notifications/read-all", markAllNotificationsRead);

// AUDIT LOGS ROUTES
router.get("/audit-logs", getAuditLogs);

// ANALYTICS ROUTES
router.get("/analytics", getAnalytics);
router.get("/analytics/summary", getAnalyticsSummary);
router.get("/analytics/user-growth", getUserGrowthData);
router.get("/analytics/story-growth", getStoryGrowthData);
router.get("/analytics/language-distribution", getLanguageDistribution);
router.get("/analytics/category-performance", getCategoryPerformanceData);
router.get("/analytics/reading-activity", getReadingActivityData);
router.get("/analytics/top-authors", getTopAuthorsData);
router.get("/analytics/age-distribution", getAgeGroupDistributionData);
router.get("/analytics/platform-health", getPlatformHealthData);
router.get("/analytics/daily-activity", getDailyActivityData);
router.get("/analytics/top-stories", getTopStoriesData);
router.get("/analytics/ratings-distribution", getRatingsDistributionData);

// AGE CATEGORY MANAGEMENT ROUTES
router.get("/age-categories", getAllAgeCategories);
router.post("/age-categories", createAgeCategory);
router.put("/age-categories/:id", updateAgeCategory);
router.delete("/age-categories/:id", deleteAgeCategory);
router.post("/age-categories/reorder", reorderAgeCategories);

// SETTINGS MANAGEMENT ROUTES
router.get("/settings", getSettings);
router.put("/settings", updateSettings);

export default router;
