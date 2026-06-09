/*import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";


import draftRoutes from "./src/routes/draft.routes.js";
import storyRoutes from "./src/routes/story.routes.js";
import authorRoutes from "./src/routes/author.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import reviewRoutes from "./src/routes/review.routes.js"
import notificationRoutes from "./src/routes/notification.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";



dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
 

app.use("/api/auth", authRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/drafts", draftRoutes)
app.use("/api/authors", authorRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(5000, () =>
      console.log("Server running on http://localhost:5000")
    );
  })
  .catch((err) => console.error(err));
*/


import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import { initSocket } from "./socket.js";


import draftRoutes from "./src/routes/draft.routes.js";
import storyRoutes from "./src/routes/story.routes.js";
import authorRoutes from "./src/routes/author.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import reviewRoutes from "./src/routes/review.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import translateRoutes from "./src/routes/translate.routes.js";
import seriesRoutes from "./src/routes/series.routes.js";
import chapterRoutes from "./src/routes/chapter.routes.js";
import categoryRoutes from "./src/routes/category.routes.js";
import uploadRoutes from "./src/routes/upload.routes.js";
import migrateStoryCategories from "./src/utils/migrateCategories.js";


dotenv.config();

const app = express();
const server = http.createServer(app);
initSocket(server);

// CORS configuration
app.use(cors({
  origin: [
    "https://mozhibu.com",
    "https://www.mozhibu.com",
    "https://mozhibu-backend.onrender.com",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/drafts", draftRoutes);
app.use("/api/authors", authorRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/translate", translateRoutes);
app.use("/api/series", seriesRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/upload", uploadRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    
    // Run migration to add category/topic to existing stories
    await migrateStoryCategories();
    
    // Inside .then() after server.listen() — add keep-alive ping
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Prevent Render free tier from sleeping (pings every 14 min)
  if (process.env.NODE_ENV === "production") {
    setInterval(async () => {
      try {
        await fetch("https://mozhibu-backend.onrender.com/api/health");
        console.log("Keep-alive ping sent");
      } catch (e) {
        console.log("Keep-alive ping failed:", e.message);
      }
    }, 14 * 60 * 1000);
  }
});
  })
  .catch(console.error);
