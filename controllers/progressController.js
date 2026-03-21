const ReadingProgress = require("../models/ReadingProgress");

// POST /api/progress
exports.saveProgress = async (req, res) => {
  try {
    const {
      materialId,
      progress,
      materialTitle,
      subjectName,
      isVideo,
      watched,
    } = req.body;
    if (!materialId)
      return res.status(400).json({ message: "materialId required." });

    const update = {
      lastOpenedAt: new Date(),
      materialTitle,
      subjectName,
      isVideo: !!isVideo,
    };

    if (isVideo) {
      update.progress = watched ? 100 : 0;
    } else {
      update.progress = Math.round(Math.min(100, Math.max(0, progress || 0)));
    }

    // For videos, never flip watched from true → false
    // Use findOneAndUpdate with conditional: only set watched if upgrading to true
    const existing = await ReadingProgress.findOne({
      userId: req.user.id,
      materialId,
    });
    if (isVideo && existing?.watched && !watched) {
      // Already watched — don't overwrite with false
      update.watched = true;
      update.progress = 100;
    } else if (isVideo) {
      update.watched = !!watched;
    }

    const record = await ReadingProgress.findOneAndUpdate(
      { userId: req.user.id, materialId },
      { $set: update },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
    );
    return res.json({ record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// GET /api/progress?materialId=
exports.getProgress = async (req, res) => {
  try {
    const { materialId } = req.query;
    const record = await ReadingProgress.findOne({
      userId: req.user.id,
      materialId,
    });
    return res.json({
      progress: record?.progress || 0,
      watched: record?.watched || false,
      isVideo: record?.isVideo || false,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
};

// GET /api/progress/history
exports.getHistory = async (req, res) => {
  try {
    const records = await ReadingProgress.find({ userId: req.user.id })
      .populate({
        path: "materialId",
        select: "title fileType fileUrl schoolYear description subjectId",
        populate: { path: "subjectId", select: "name" }, // nested populate for subject name
      })
      .sort({ lastOpenedAt: -1 })
      .limit(50);
    return res.json({ records });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
};
