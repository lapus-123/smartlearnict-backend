const Comment = require("../models/Comment");
const User = require("../models/User");

// GET /api/comments?materialId=
exports.getComments = async (req, res) => {
  try {
    const { materialId } = req.query;
    if (!materialId)
      return res.status(400).json({ message: "materialId required." });
    const comments = await Comment.find({ materialId }).sort({ createdAt: -1 });
    return res.json({ comments });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
};

// POST /api/comments
exports.createComment = async (req, res) => {
  try {
    const { materialId, text } = req.body;
    if (!materialId || !text?.trim())
      return res.status(400).json({ message: "materialId and text required." });

    // Fetch user with course (Section) and college populated
    const user = await User.findById(req.user.id)
      .populate("courseId", "name")
      .populate("collegeId", "name");

    const userFullName = user?.fullName || req.user.fullName || "Unknown";
    const courseName = user?.courseId?.name || "";
    const collegeName = user?.collegeId?.name || "";
    const userCourse =
      [collegeName, courseName].filter(Boolean).join(" – ") || "N/A";
    const userSection = user?.section || "";

    const comment = await Comment.create({
      materialId,
      userId: req.user.id,
      text: text.trim(),
      userFullName,
      userCourse,
      userSection,
    });
    return res.status(201).json({ comment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// PUT /api/comments/:id
exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment)
      return res.status(404).json({ message: "Comment not found." });
    if (comment.userId.toString() !== req.user.id.toString())
      return res.status(403).json({ message: "Not your comment." });

    comment.text = req.body.text?.trim() || comment.text;
    await comment.save();
    return res.json({ comment });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
};

// DELETE /api/comments/:id
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment)
      return res.status(404).json({ message: "Comment not found." });
    if (comment.userId.toString() !== req.user.id.toString())
      return res.status(403).json({ message: "Not your comment." });

    await comment.deleteOne();
    return res.json({ message: "Deleted." });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
};
