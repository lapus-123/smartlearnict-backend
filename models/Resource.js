const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ["material", "video", "module"],
      required: true,
    },
    url: { type: String, trim: true },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College" },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    schoolYear: { type: String, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Resource", resourceSchema);
