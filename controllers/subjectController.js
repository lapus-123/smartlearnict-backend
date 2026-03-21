const Subject = require("../models/Subject");

exports.getSubjects = async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};
    const subjects = await Subject.find(query).sort({ name: 1 });
    return res.json({ subjects });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name)
      return res.status(400).json({ message: "Subject name is required." });
    const existing = await Subject.findOne({ name: name.trim() });
    if (existing)
      return res.status(409).json({ message: "Subject already exists." });
    const subject = await Subject.create({
      name: name.trim(),
      type: type || "core",
      createdBy: "Admin",
    });
    return res.status(201).json({ message: "Subject created.", subject });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name)
      return res.status(400).json({ message: "Subject name is required." });
    const existing = await Subject.findOne({
      name: name.trim(),
      _id: { $ne: req.params.id },
    });
    if (existing)
      return res
        .status(409)
        .json({ message: "Another subject with that name already exists." });
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { name: name.trim(), ...(type && { type }) },
      { returnDocument: "after" },
    );
    if (!subject)
      return res.status(404).json({ message: "Subject not found." });
    return res.json({ message: "Subject updated.", subject });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};
