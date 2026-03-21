const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["student", "instructor"], required: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    // 'pending' = awaiting admin approval (instructors only), 'active' = can log in
    status: { type: String, enum: ["pending", "active"], default: "active" },

    studentId: { type: String, trim: true, unique: true, sparse: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    section: { type: String, trim: true },
    instructorId: { type: String, trim: true, unique: true, sparse: true },

    birthday: { type: String, required: true },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
    },
    schoolYear: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: null },
    invitedResources: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Resource" },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
