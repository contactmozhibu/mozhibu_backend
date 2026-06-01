import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const createAdmin = async () => {
  await mongoose.connect("YOUR_MONGO_URI");

  const exists = await User.findOne({ role: "admin" });
  if (exists) {
    console.log("Admin already exists");
    process.exit();
  }

  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  await User.create({
    username: "Super Admin",
    email: "admin@mozhibu.com",
    password: hashedPassword,
    role: "admin",
  });

  console.log("Admin created successfully");
  process.exit();
};

createAdmin();
