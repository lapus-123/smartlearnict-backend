const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text:       { type: String, required: true, trim: true, maxlength: 1000 },
    // Denormalized for display speed — no extra populate needed
    userFullName: { type: String },
    userCourse:   { type: String },   // courseId.name
    userSection:  { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
