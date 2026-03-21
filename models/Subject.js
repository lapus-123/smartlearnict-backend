const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    type: { type: String, enum: ["core", "specialization"], default: "core" }, // NEW
    createdBy: { type: String, default: "Admin" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Subject", subjectSchema);
