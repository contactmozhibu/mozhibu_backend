
import Review from "../models/Review.js";
import Story from "../models/Story.js";
import Notification from "../models/Notification.js";

export const createReview = async (req, res) => {
  try {
    console.log("BODY:", req.body);
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

    // 2️⃣ Populate user data in the review
    await review.populate("user", "username");

    // 3️⃣ Find story + author
    const story = await Story.findById(storyId).populate("author");

    // 4️⃣ Create notification for author
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
      //.populate("user", "username") // ✅ fetch username
      .populate("user", "username avatar")
.populate("replies.user", "username avatar")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Failed to load reviews" });
  }
};


export const addReply = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { comment } = req.body;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.replies.push({
      user: req.user._id,
      comment,
    });

    await review.save();

    const updated = await Review.findById(reviewId)
      .populate("user", "username avatar")
      .populate("replies.user", "username avatar");

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Reply failed" });
  }
};

export const likeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);

    const alreadyLiked =
      review.likes.includes(req.user._id);

    if (alreadyLiked) {
      review.likes.pull(req.user._id);
    } else {
      review.likes.push(req.user._id);
    }

    await review.save();

    res.json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Like failed",
    });
  }
};
export const replyReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { text, parentReplyId } = req.body;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const newReply = {
      _id: new mongoose.Types.ObjectId(),
      user: req.user._id,
      comment: text,
      parentReplyId: parentReplyId || null,
      likes: [],
      createdAt: new Date(),
    };

    review.replies.push(newReply);

    await review.save();

    res.status(200).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Reply failed" });
  }
};