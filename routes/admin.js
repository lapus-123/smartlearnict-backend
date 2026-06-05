const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/auth");
const User = require("../models/User");
const { deleteUser, editUser, getUsers } = require("../controllers/adminController");

// GET /api/admin/instructor-requests — pending instructors
router.get(
  "/instructor-requests",
  protect,
  requireRole("admin"),
  async (req, res) => {
    try {
      const instructors = await User.find({
        role: "instructor",
        status: "pending",
      })
        .populate("collegeId", "name")
        .sort({ createdAt: -1 });
      return res.json({ instructors });
    } catch (err) {
      return res.status(500).json({ message: "Server error." });
    }
  },
);

// PUT /api/admin/instructor-requests/:id/approve
router.put(
  "/instructor-requests/:id/approve",
  protect,
  requireRole("admin"),
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { status: "active" },
        { new: true, runValidators: true },
      ).populate("collegeId", "name");
      if (!user) return res.status(404).json({ message: "User not found." });
      return res.json({ message: "Instructor approved.", user });
    } catch (err) {
      return res.status(500).json({ message: "Server error." });
    }
  },
);

// DELETE /api/admin/instructor-requests/:id/reject
router.delete(
  "/instructor-requests/:id/reject",
  protect,
  requireRole("admin"),
  async (req, res) => {
    try {
      await User.findByIdAndDelete(req.params.id);
      return res.json({
        message: "Instructor registration rejected and removed.",
      });
    } catch (err) {
      return res.status(500).json({ message: "Server error." });
    }
  },
);

// ── STUDENT APPROVAL ROUTES ───────────────────────────────────────────────────
// GET /api/admin/student-requests
router.get(
  "/student-requests",
  protect,
  requireRole("admin"),
  async (req, res) => {
    try {
      const students = await User.find({ role: "student", status: "pending" })
        .populate("collegeId", "name")
        .populate("courseId", "name")
        .sort({ createdAt: -1 });
      return res.json({ students });
    } catch (err) {
      return res.status(500).json({ message: "Server error." });
    }
  },
);

// PUT /api/admin/student-requests/:id/approve
router.put(
  "/student-requests/:id/approve",
  protect,
  requireRole("admin"),
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { status: "active" },
        { new: true, runValidators: true },
      )
        .populate("collegeId", "name")
        .populate("courseId", "name");
      if (!user) return res.status(404).json({ message: "User not found." });
      return res.json({ message: "Student approved.", user });
    } catch (err) {
      return res.status(500).json({ message: "Server error." });
    }
  },
);

// DELETE /api/admin/student-requests/:id/reject
router.delete(
  "/student-requests/:id/reject",
  protect,
  requireRole("admin"),
  async (req, res) => {
    try {
      await User.findByIdAndDelete(req.params.id);
      return res.json({ message: "Student registration rejected." });
    } catch (err) {
      return res.status(500).json({ message: "Server error." });
    }
  },
);

// GET /api/admin/instructors?collegeId=
router.get("/instructors", protect, requireRole("admin"), async (req, res) => {
  try {
    const { collegeId } = req.query;
    const query = { role: "instructor" };
    if (collegeId) query.collegeId = collegeId;
    const instructors = await User.find(query)
      .select("-passwordHash")
      .populate("collegeId", "name")
      .sort({ fullName: 1 });
    return res.json({ instructors });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
});

// GET /api/admin/students?collegeId=&courseId=&schoolYear=
router.get("/students", protect, requireRole("admin"), async (req, res) => {
  try {
    const { collegeId, courseId, schoolYear } = req.query;
    const query = { role: "student" };
    if (collegeId) query.collegeId = collegeId;
    if (courseId) query.courseId = courseId;
    if (schoolYear) query.schoolYear = schoolYear;
    const students = await User.find(query)
      .select("-passwordHash")
      .populate("collegeId", "name")
      .populate("courseId", "name")
      .sort({ fullName: 1 });
    return res.json({ students });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
});

// GET /api/admin/users
router.get("/users", protect, requireRole("admin"), getUsers);

// PUT /api/admin/users/:id
router.put("/users/:id", protect, requireRole("admin"), editUser);

// DELETE /api/admin/users/:id
router.delete("/users/:id", protect, requireRole("admin"), deleteUser);

module.exports = router;
