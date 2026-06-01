
import Review from "../models/Review.js";
import Story from "../models/Story.js";
import Notification from "../models/Notification.js";

export const createReview = async (req, res) => {
  try {
    const { storyId, rating, comment } = req.body;

    if (!storyId || !rating) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 1️⃣ Create review
    const review = await Review.create({
      story: storyId,
      user: req.user._id,
      rating,
      comment,
    });

    // 2️⃣ Find story + author
    const story = await Story.findById(storyId).populate("author");

    // 3️⃣ Create notification for author
    if (
      story &&
      story.author &&
      story.author._id.toString() !== req.user._id.toString()
    ) {
      await Notification.create({
        user: story.author._id,     // receiver (author)
        fromUser: req.user._id,      // reviewer
        type: "REVIEW",
        story: story._id,
        review: review._id,          // ✅ Add review reference
        message: `${req.user.username} reviewed your story "${story.title}"`,
      });
    }

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit review" });
  }
};


export const getReviewsByStory = async (req, res) => {
  try {
    const reviews = await Review.find({ story: req.params.storyId })
      .populate("user", "username") // ✅ fetch username
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Failed to load reviews" });
  }
};
