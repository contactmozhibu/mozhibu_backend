import mongoose from "mongoose";
import Story from "../models/Story.js";

// Category-Topic mappings (must match frontend)
const CATEGORY_TOPICS = {
  "Fiction": ["Romance", "Mystery & Crime", "Thriller", "Fantasy", "Science Fiction", "Horror", "Adventure", "Historical Fiction", "Short Stories", "Novels", "Novellas", "Flash Fiction", "Episodic / Series", "Mythology", "Folk Tales", "Magical Realism", "Retellings", "Graphic Novels / Comics", "Feel-Good", "Dark", "Inspirational", "Emotional", "Humorous"],
  "Non-Fiction": ["Biography", "Autobiography", "Memoir", "Self-Help", "Personal Growth", "Productivity", "Mindfulness", "Mental Health", "History", "Politics", "Economics", "Culture", "Philosophy", "Religion", "Spiritual Practices", "Devotional", "Ethics", "Health & Fitness", "Food & Cooking", "Parenting", "Travel", "Money & Finance", "Hobbies & DIY"],
  "Academic": ["Mathematics", "Science", "Social Studies", "Languages", "Environmental Studies", "Coding & Programming", "AI & Technology", "Communication Skills", "Writing & Creativity", "Design", "Business & Management", "Engineering", "Medical", "Law", "Teaching", "Government Exams", "Dictionaries", "Encyclopedias", "Guides", "Manuals", "Question Banks"],
  "Poetry": ["Love & Relationships", "Nature & Environment", "Identity & Society", "Philosophy & Reflection", "Artistic & Abstract", "Festival & Occasion", "Children's poetry", "General"],
  "Cookbooks": ["Baking", "Desserts & Sweets", "Snacks & Starters", "Briyani, Pulao, Rice dishes", "Curries & Gravies", "Breads & Rotis", "Soups & Salads", "Street Food", "Pickles & Preserves", "Beverages & Juices", "Tiffin / Meal prep", "One-pot recipes", "Low calorie recipes", "Weightloss recipes", "Keto", "Paleo", "High-protein", "Kid's recipes", "Beginner cooks", "Lunch box recipes"],
  "Children Books": ["Early Childhood (0-3 years)", "Preschool (3-5 years)", "Early Readers (5-7 years)", "Middle Grade (7-10 years)", "Pre-Teens (10-13 years)", "Board books", "Rhyme books", "Sensory books", "Concept books", "Simple stories", "Folktales", "Adventure", "School stories", "Humour books", "Fantasy", "Mystery", "Science fiction", "Fairy tales", "Animal stories", "Moral stories", "General knowledge", "Grammar"],
  "Others": ["Comics", "Drama", "Screenplay", "Essays", "Anthologies", "Journals", "Diaries", "Confessions", "Religious", "Spiritual", "Travelogues", "Experimental"]
};

const migrateStoryCategories = async () => {
  try {
    console.log("🔄 Starting smart category migration...");

    // Get all stories - we'll redistribute all of them across topics
    const stories = await Story.find({});

    console.log(`📊 Found ${stories.length} stories to redistribute`);

    let updated = 0;
    let topicIndex = {}; // Track which topic index we're at for each category

    // Initialize topic indices
    Object.keys(CATEGORY_TOPICS).forEach(cat => {
      topicIndex[cat] = 0;
    });

    for (const story of stories) {
      let category = story.category || "Fiction";

      // If category is not in our list, default to Fiction
      if (!CATEGORY_TOPICS[category]) {
        category = "Fiction";
      }

      // Distribute topics evenly by cycling through them
      const categoryTopics = CATEGORY_TOPICS[category];
      const topic = categoryTopics[topicIndex[category] % categoryTopics.length];
      topicIndex[category]++;

      await Story.findByIdAndUpdate(story._id, {
        category,
        topic
      });

      updated++;
    }

    console.log(`✅ Redistributed ${updated} stories with varied topics`);

    // Show distribution
    const distribution = await Story.aggregate([
      { $match: { status: "PUBLISHED" } },
      { $group: { 
        _id: { category: "$category", topic: "$topic" }, 
        count: { $sum: 1 } 
      }},
      { $sort: { "_id.category": 1, "_id.topic": 1 } }
    ]);

    console.log("\n📊 Stories distribution:");
    distribution.forEach((item) => {
      console.log(`  ${item._id.category} → ${item._id.topic}: ${item.count} stories`);
    });

  } catch (err) {
    console.error("❌ Migration error:", err);
  }
};

export default migrateStoryCategories;
