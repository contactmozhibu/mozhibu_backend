/*
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    forgotPasswordOTP: {
  type: String,
},
forgotPasswordOTPExpiry: {
  type: Date,
},

resetPasswordToken: String,
resetPasswordExpire: Date,

otp: String,
otpExpire: Date,
verified: {
  type: Boolean,
  default: false
},
dob: Date,

ageGroup: String,

ageKey: {
  type: String,
  enum: ["kids","teens","adults"],
  required: true,
},

mobile: {
  type: String,
  default: "",
},
bio: {
  type: String,
  default: "",
},

avatar: {
      type: String,
      default: "",
    },

isActive: {
  type: Boolean,
  default: true,
},
isBanned: {
      type: Boolean,
      default: false,
    },

followers: [
    { type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: [], }
  ],
  
  following: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  ]
},

  { timestamps: true }
);

//export default mongoose.model("User_v2", userSchema);
export default mongoose.model(
  "User",          // ✅ MODEL NAME (used everywhere)
  userSchema,
  "user_v2"       // ✅ EXISTING COLLECTION NAME IN DB
);
*/

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      default: "",
      trim: true,
    },

    lastName: {
      type: String,
      default: "",
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    forgotPasswordOTP: String,
    forgotPasswordOTPExpiry: Date,

    resetPasswordToken: String,
    resetPasswordExpire: Date,

    otp: String,
    otpExpire: Date,

    verified: {
      type: Boolean,
      default: false,
    },

    dob: Date,

    ageGroup: String,

ageKey: {
  type: String,
  enum: [
    "kids",
    "teens",
    "adults",
  ],
  required: true,
},

    mobile: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
    },

    avatar: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isBanned: {
      type: Boolean,
      default: false,
    },

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model(
  "User",
  userSchema,
  "user_v2"
);