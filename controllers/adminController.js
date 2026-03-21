const bcrypt = require("bcrypt");
const User = require("../models/User");

const generateUsername = (birthday) => {
  const parts = birthday.split("/");
  if (parts.length < 2)
    throw new Error("Invalid birthday format. Use MM/DD/YYYY.");
  return parts[0] + parts[1];
};

// GET /api/admin/instructors?collegeId=
exports.getInstructors = async (req, res) => {
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
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// GET /api/admin/students?collegeId=&courseId=&schoolYear=
exports.getStudents = async (req, res) => {
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
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// PUT /api/admin/users/:id
exports.editUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const {
      fullName,
      birthday,
      schoolYear,
      studentId,
      instructorId,
      collegeId,
      courseId,
      section,
    } = req.body;

    // Update basic fields
    if (fullName) user.fullName = fullName.trim();
    if (schoolYear) user.schoolYear = schoolYear.trim();
    if (collegeId) user.collegeId = collegeId;

    // Birthday change → regenerate username
    if (birthday && birthday !== user.birthday) {
      user.birthday = birthday;
      user.username = generateUsername(birthday);
    }

    if (user.role === "student") {
      if (courseId) user.courseId = courseId;
      if (section) user.section = section.trim();

      // Student ID change → re-hash password
      if (studentId && studentId.trim() !== user.studentId) {
        const existing = await User.findOne({
          studentId: studentId.trim(),
          _id: { $ne: user._id },
        });
        if (existing)
          return res
            .status(409)
            .json({ message: `Student ID "${studentId}" is already taken.` });
        user.studentId = studentId.trim();
        user.passwordHash = await bcrypt.hash(studentId.trim(), 10);
      }
    }

    if (user.role === "instructor") {
      // Instructor ID change → re-hash password
      if (instructorId && instructorId.trim() !== user.instructorId) {
        const existing = await User.findOne({
          instructorId: instructorId.trim(),
          _id: { $ne: user._id },
        });
        if (existing)
          return res
            .status(409)
            .json({
              message: `Instructor ID "${instructorId}" is already taken.`,
            });
        user.instructorId = instructorId.trim();
        user.passwordHash = await bcrypt.hash(instructorId.trim(), 10);
      }
    }

    await user.save();
    await user.populate("collegeId", "name");
    if (user.role === "student") await user.populate("courseId", "name");

    return res.json({
      message: "User updated successfully.",
      user: { ...user.toObject(), passwordHash: undefined },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    await User.findByIdAndDelete(req.params.id);
    return res.json({ message: `${user.fullName} has been deleted.` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};
