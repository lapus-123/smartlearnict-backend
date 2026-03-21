const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate section names under the same college
sectionSchema.index({ name: 1, collegeId: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);
