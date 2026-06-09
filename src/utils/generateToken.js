import jwt from "jsonwebtoken";

const generateToken = (user) => {
  // Accept either user object or just userId for backward compatibility
  const userId = typeof user === "string" ? user : user._id;
  const role = typeof user === "object" ? user.role || "user" : "user";

  return jwt.sign(
    {
      id: userId,
      role: role,
      email: typeof user === "object" ? user.email : undefined,
      name: typeof user === "object" ? user.username || user.name : undefined
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export default generateToken;
