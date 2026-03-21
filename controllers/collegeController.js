const College = require("../models/College");

// GET /api/colleges
exports.getColleges = async (req, res) => {
  try {
    const colleges = await College.find().sort({ name: 1 });
    return res.json({ colleges });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// POST /api/colleges — admin only
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
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// PUT /api/colleges/:id — admin only
exports.updateCollege = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "College name is required." });
    const existing = await College.findOne({
      name: name.trim(),
      _id: { $ne: req.params.id },
    });
    if (existing)
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
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};
