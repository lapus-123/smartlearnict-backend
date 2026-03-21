const Section = require('../models/Section');

// GET /api/sections?collegeId= — filtered by college (for dependent dropdown)
exports.getSections = async (req, res) => {
  try {
    const { collegeId } = req.query;
    const query = collegeId ? { collegeId } : {};
    const sections = await Section.find(query).populate('collegeId', 'name').sort({ name: 1 });
    return res.json({ sections });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/sections — admin only
exports.createSection = async (req, res) => {
  try {
    const { name, collegeId } = req.body;
    if (!name || !collegeId) {
      return res.status(400).json({ message: 'Section name and collegeId are required.' });
    }

    const existing = await Section.findOne({ name: name.trim(), collegeId });
    if (existing) {
      return res.status(409).json({ message: 'Section already exists under this college.' });
    }

    const section = await Section.create({ name: name.trim(), collegeId });
    return res.status(201).json({ message: 'Section created.', section });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/sections/:id — admin only
exports.deleteSection = async (req, res) => {
  try {
    await Section.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Section deleted.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
};
