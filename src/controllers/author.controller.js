import User from "../models/User.js";
import { getIO } from "../../socket.js";


/* =========================
   FOLLOW AUTHOR
========================= */
export const followAuthor = async (req, res) => {
  const authorId = req.params.id;
  const userId = req.user._id.toString();

  if (authorId === userId) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  const author = await User.findById(authorId);
  const user = await User.findById(userId);

  if (!author || !user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!author.followers.includes(userId)) {
    author.followers.push(userId);
    user.following.push(authorId);

    await author.save();
    await user.save();
  }

  const io = getIO();

// 🔔 REAL-TIME UPDATE TO AUTHOR
io.to(authorId).emit("follow-updated", {
  authorId,
  followersCount: author.followers.length,
  isFollowing: true,
});

// 🔔 OPTIONAL: update follower UI also
io.to(userId).emit("follow-updated", {
  authorId,
  followersCount: author.followers.length,
  isFollowing: true,
});

res.json({
  followers: author.followers,
  following: true,
  followersCount: author.followers.length,
});


};

/* =========================
   UNFOLLOW AUTHOR
========================= */
export const unfollowAuthor = async (req, res) => {
  const authorId = req.params.id;
  const userId = req.user._id.toString();

  const author = await User.findById(authorId);
  const user = await User.findById(userId);

  if (!author || !user) {
    return res.status(404).json({ message: "User not found" });
  }

  author.followers = author.followers.filter(
    (id) => id.toString() !== userId
  );

  user.following = user.following.filter(
    (id) => id.toString() !== authorId
  );

  await author.save();
  await user.save();

  const io = getIO();

  // 🔔 REAL-TIME UPDATE
  io.to(authorId).emit("follow-updated", {
    authorId,
    followersCount: author.followers.length,
    isFollowing: false,
  });

  io.to(userId).emit("follow-updated", {
    authorId,
    followersCount: author.followers.length,
    isFollowing: false,
  });

  res.json({
    followers: author.followers,
    following: false,
    followersCount: author.followers.length,
  });
};

export const accountAction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({ message: "Action type required" });
    }

    if (type === "deactivate") {
      await User.findByIdAndUpdate(userId, {
        isActive: false,
      });

      return res.json({ message: "Account deactivated" });
    }

    if (type === "delete") {
      await User.findByIdAndDelete(userId);

      return res.json({ message: "Account deleted" });
    }

    return res.status(400).json({ message: "Invalid action type" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   GET LOGGED-IN AUTHOR (ME)
========================= */
export const getMeAuthor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("followers", "_id")
      .populate("following", "_id");

    res.json({ author: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch author profile" });
  }
};
