import Notification from "../models/Notification.js";

export const createPublishNotification = async (story) => {
  await Notification.create({
    user: story.author,
    type: "PUBLISHED",
    story: story._id,
    message: `Your story "${story.title}" has been published 🎉`,
  });
};
