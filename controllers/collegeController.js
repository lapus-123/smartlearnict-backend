const College = require("../models/College");
const Section = require("../models/Section");
const User = require("../models/User");

exports.getColleges = async (req, res) => {
  try {
    const colleges = await College.find().sort({ name: 1 });
    return res.json({ colleges });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
};

exports.createCollege = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "College name is required." });
    const existing = await College.findOne({ name: name.trim() });
    if (existing)
      return res.status(409).json({ message: "College already exists." });
    const college = await College.create({ name: name.trim() });
    return res.status(201).json({ message: "College created.", college });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
};

exports.updateCollege = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "College name is required." });
    const dupe = await College.findOne({
      name: name.trim(),
      _id: { $ne: req.params.id },
    });
    if (dupe)
      return res
        .status(409)
        .json({ message: "Another college with that name already exists." });
    const college = await College.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { returnDocument: "after" },
    );
    if (!college)
      return res.status(404).json({ message: "College not found." });
    return res.json({ message: "College updated.", college });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
};

exports.deleteCollege = async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college)
      return res.status(404).json({ message: "College not found." });
    // Remove all courses under this college
    await Section.deleteMany({ collegeId: req.params.id });
    // Nullify college reference on users
    await User.updateMany(
      { collegeId: req.params.id },
      { $unset: { collegeId: 1 } },
    );
    await College.findByIdAndDelete(req.params.id);
    return res.json({
      message: `"${college.name}" and its courses have been deleted.`,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
};
