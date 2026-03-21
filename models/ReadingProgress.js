const mongoose = require("mongoose");

const readingProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    isVideo: { type: Boolean, default: false },
    watched: { type: Boolean, default: false }, // video-specific: fully watched
    lastOpenedAt: { type: Date, default: Date.now },
    materialTitle: { type: String },
    subjectName: { type: String },
  },
  { timestamps: true },
);

// One record per user+material pair
readingProgressSchema.index({ userId: 1, materialId: 1 }, { unique: true });

module.exports = mongoose.model("ReadingProgress", readingProgressSchema);
