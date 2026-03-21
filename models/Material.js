const mongoose = require("mongoose");

const fileEntrySchema = new mongoose.Schema(
  {
    fileUrl: { type: String, required: true },
    publicId: { type: String },
    fileType: { type: String, required: true },
    fileName: { type: String },
  },
  { _id: true },
);

const materialSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    schoolYear: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    // Legacy single-file fields (kept for backward compat)
    fileUrl: { type: String, required: true },
    publicId: { type: String },
    fileType: { type: String, required: true },
    // Multi-file support — all files including the first one
    files: { type: [fileEntrySchema], default: [] },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    uploadedByName: { type: String, default: "Admin" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Material", materialSchema);
