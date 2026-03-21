const Resource = require('../models/Resource');
const User = require('../models/User');

// GET /api/resources — students only see resources they're invited to
exports.getResources = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const resources = await Resource.find().populate('uploadedBy', 'fullName');
      return res.json({ resources });
    }

    if (req.user.role === 'instructor') {
      const resources = await Resource.find({ uploadedBy: req.user.id }).populate('uploadedBy', 'fullName');
      return res.json({ resources });
    }

    // Student: only invited resources
    const student = await User.findById(req.user.id).populate('invitedResources');
    return res.json({ resources: student.invitedResources });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/resources — instructor or admin only
exports.createResource = async (req, res) => {
  try {
    const { title, description, type, url, section, collegeDepartment, schoolYear } = req.body;
    if (!title || !type) return res.status(400).json({ message: 'Title and type are required.' });

    const resource = await Resource.create({
      title, description, type, url, section, collegeDepartment, schoolYear,
      uploadedBy: req.user.id,
    });
    return res.status(201).json({ message: 'Resource created.', resource });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
