/**
 * TAMIL TEXT DATABASE SERVICE
 * 
 * Handles saving, retrieving, and managing Tamil Unicode text in MongoDB
 * Integrates with the Story model for persistence
 */

const Story = require('../models/Story');
const { prepareTamilForStorage } = require('../utils/tamilValidator');

/**
 * Save Tamil text to database
 * Creates new story or updates existing chapter with Tamil content
 */
const saveTamilContent = async (storyId, chapterId, tamilText, metadata = {}) => {
  try {
    // Validate Tamil text
    if (!tamilText || typeof tamilText !== 'string') {
      throw new Error('Invalid Tamil text provided');
    }

    // Clean and validate
    const cleanedTamil = prepareTamilForStorage(tamilText);

    // Check if updating existing chapter
    if (chapterId) {
      const chapter = await Story.findById(storyId)
        .select(`chapters.${chapterId}`);

      if (!chapter) {
        throw new Error('Story or chapter not found');
      }

      // Update chapter with Tamil content
      const updateResult = await Story.findByIdAndUpdate(
        storyId,
        {
          $set: {
            [`chapters.${chapterId}.tamilContent`]: cleanedTamil,
            [`chapters.${chapterId}.metadata.transliteratedAt`]: new Date(),
            [`chapters.${chapterId}.metadata.transliterationStats`]: metadata,
          },
        },
        { new: true, runValidators: true }
      );

      return {
        success: true,
        message: 'Chapter Tamil content saved successfully',
        data: updateResult,
      };
    } else {
      // Create new chapter with Tamil content
      const updateResult = await Story.findByIdAndUpdate(
        storyId,
        {
          $push: {
            chapters: {
              tamilContent: cleanedTamil,
              status: 'draft',
              metadata: {
                transliteratedAt: new Date(),
                transliterationStats: metadata,
              },
            },
          },
        },
        { new: true, runValidators: true }
      );

      return {
        success: true,
        message: 'New chapter with Tamil content created successfully',
        data: updateResult,
      };
    }
  } catch (error) {
    console.error('Error saving Tamil content:', error);
    throw error;
  }
};

/**
 * Retrieve Tamil content from database
 */
const getTamilContent = async (storyId, chapterId = null) => {
  try {
    const story = await Story.findById(storyId);

    if (!story) {
      throw new Error('Story not found');
    }

    if (chapterId) {
      const chapter = story.chapters.id(chapterId);
      if (!chapter) {
        throw new Error('Chapter not found');
      }

      return {
        success: true,
        data: {
          tamilContent: chapter.tamilContent,
          metadata: chapter.metadata,
        },
      };
    }

    return {
      success: true,
      data: story.chapters.map((ch) => ({
        id: ch._id,
        tamilContent: ch.tamilContent,
        metadata: ch.metadata,
      })),
    };
  } catch (error) {
    console.error('Error retrieving Tamil content:', error);
    throw error;
  }
};

/**
 * Publish Tamil content (save as final version)
 */
const publishTamilContent = async (storyId, chapterId) => {
  try {
    const updateResult = await Story.findByIdAndUpdate(
      storyId,
      {
        $set: {
          [`chapters.${chapterId}.status`]: 'published',
          [`chapters.${chapterId}.publishedAt`]: new Date(),
        },
      },
      { new: true }
    );

    return {
      success: true,
      message: 'Tamil content published successfully',
      data: updateResult,
    };
  } catch (error) {
    console.error('Error publishing Tamil content:', error);
    throw error;
  }
};

/**
 * Export Tamil content as file
 */
const exportTamilAsFile = async (storyId, chapterId = null, format = 'txt') => {
  try {
    const story = await Story.findById(storyId);

    if (!story) {
      throw new Error('Story not found');
    }

    let content = '';

    if (chapterId) {
      const chapter = story.chapters.id(chapterId);
      if (!chapter) {
        throw new Error('Chapter not found');
      }
      content = chapter.tamilContent;
    } else {
      // Combine all chapters
      content = story.chapters
        .map((ch, idx) => `=== Chapter ${idx + 1} ===\n${ch.tamilContent}`)
        .join('\n\n');
    }

    return {
      success: true,
      filename: `${story.title}_tamil.${format}`,
      content,
      format,
    };
  } catch (error) {
    console.error('Error exporting Tamil content:', error);
    throw error;
  }
};

/**
 * Batch save multiple Tamil chapters
 */
const batchSaveTamilContent = async (storyId, chapters) => {
  try {
    const operations = chapters.map((ch) => ({
      updateOne: {
        filter: { _id: storyId, 'chapters._id': ch.id },
        update: {
          $set: {
            'chapters.$.tamilContent': ch.tamilContent,
            'chapters.$.metadata.transliteratedAt': new Date(),
          },
        },
      },
    }));

    const result = await Story.bulkWrite(operations);

    return {
      success: true,
      message: `${result.modifiedCount} chapters saved successfully`,
      data: result,
    };
  } catch (error) {
    console.error('Error in batch save:', error);
    throw error;
  }
};

/**
 * Search Tamil content
 */
const searchTamilContent = async (storyId, searchTerm) => {
  try {
    const story = await Story.findById(storyId);

    if (!story) {
      throw new Error('Story not found');
    }

    const results = story.chapters
      .map((ch, idx) => ({
        chapterId: ch._id,
        chapterIndex: idx,
        matches: ch.tamilContent.includes(searchTerm) ? 1 : 0,
      }))
      .filter((ch) => ch.matches > 0);

    return {
      success: true,
      searchTerm,
      resultsCount: results.length,
      data: results,
    };
  } catch (error) {
    console.error('Error searching Tamil content:', error);
    throw error;
  }
};

/**
 * Get Tamil content statistics
 */
const getTamilStats = async (storyId, chapterId = null) => {
  try {
    const story = await Story.findById(storyId);

    if (!story) {
      throw new Error('Story not found');
    }

    const calculateStats = (text) => ({
      totalCharacters: text.length,
      totalWords: text.trim().split(/\s+/).filter((w) => w.length > 0).length,
      totalLines: text.split('\n').length,
      tamilCharacters: (text.match(/[\u0B80-\u0BFF]/g) || []).length,
    });

    if (chapterId) {
      const chapter = story.chapters.id(chapterId);
      if (!chapter) {
        throw new Error('Chapter not found');
      }

      return {
        success: true,
        data: calculateStats(chapter.tamilContent),
      };
    }

    const allStats = story.chapters.map((ch) => ({
      chapterId: ch._id,
      ...calculateStats(ch.tamilContent),
    }));

    return {
      success: true,
      data: allStats,
    };
  } catch (error) {
    console.error('Error getting Tamil stats:', error);
    throw error;
  }
};

module.exports = {
  saveTamilContent,
  getTamilContent,
  publishTamilContent,
  exportTamilAsFile,
  batchSaveTamilContent,
  searchTamilContent,
  getTamilStats,
};
