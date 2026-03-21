const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const admin = require("../config/admin");
const { sendPasswordEmail } = require("../config/mailer");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generateUsername = (birthday) => {
  const parts = birthday.split("/");
  if (parts.length < 2)
    throw new Error("Invalid birthday format. Use MM/DD/YYYY.");
  return parts[0] + parts[1];
};

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

// ── REGISTER ──────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { role, fullName, birthday, collegeId, schoolYear, email } = req.body;

    if (!["student", "instructor"].includes(role))
      return res
        .status(400)
        .json({ message: "Role must be student or instructor." });
    if (!fullName || !birthday || !collegeId || !schoolYear || !email)
      return res
        .status(400)
        .json({ message: "All fields including email are required." });
    if (!EMAIL_REGEX.test(email))
      return res.status(400).json({ message: "Invalid email address format." });

    // Check email uniqueness
    const emailExists = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (emailExists)
      return res
        .status(409)
        .json({ message: "This email address is already registered." });

    let idField, idValue;

    if (role === "student") {
      const { studentId, courseId, section } = req.body;
      if (!studentId || !courseId || !section)
        return res
          .status(400)
          .json({
            message:
              "studentId, courseId, and section are required for students.",
          });
      const existing = await User.findOne({ studentId });
      if (existing)
        return res
          .status(409)
          .json({
            message: `Student ID "${studentId}" is already registered.`,
          });
      idField = "studentId";
      idValue = studentId;
    } else {
      const { instructorId } = req.body;
      if (!instructorId)
        return res
          .status(400)
          .json({ message: "instructorId is required for instructors." });
      const existing = await User.findOne({ instructorId });
      if (existing)
        return res
          .status(409)
          .json({
            message: `Instructor ID "${instructorId}" is already registered.`,
          });
      idField = "instructorId";
      idValue = instructorId;
    }

    let username;
    try {
      username = generateUsername(birthday);
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }

    const passwordHash = await bcrypt.hash(idValue, 10);

    const userData = {
      fullName,
      username,
      passwordHash,
      role,
      birthday,
      collegeId,
      schoolYear,
      email: email.toLowerCase().trim(),
      status: role === "instructor" ? "pending" : "active",
      [idField]: idValue,
    };
    if (role === "student") {
      userData.courseId = req.body.courseId;
      userData.section = req.body.section;
    }

    await User.create(userData);

    const pendingMsg =
      role === "instructor"
        ? " Your account is pending Admin approval before you can log in."
        : "";
    return res.status(201).json({
      message: "Registration Successful" + pendingMsg,
      username,
      pending: role === "instructor",
      hint: `Your username is ${username} and your password is your ${idField}.`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res
        .status(400)
        .json({ message: "Username and password are required." });

    if (username === admin.username && password === admin.password) {
      const token = signToken({
        id: "admin",
        username: admin.username,
        role: "admin",
        fullName: admin.fullName,
      });
      return res.json({
        message: "Login Successful",
        token,
        user: {
          id: "admin",
          username: admin.username,
          fullName: admin.fullName,
          role: "admin",
        },
      });
    }

    const users = await User.find({ username })
      .populate("collegeId", "name")
      .populate("courseId", "name");

    if (!users.length)
      return res.status(401).json({ message: "Invalid username or password." });

    let matchedUser = null;
    for (const u of users) {
      const match = await bcrypt.compare(password, u.passwordHash);
      if (match) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser)
      return res.status(401).json({ message: "Invalid username or password." });

    // Block instructors who haven't been approved yet
    if (matchedUser.status === "pending") {
      return res
        .status(403)
        .json({
          message:
            "Your account is pending Admin approval. Please wait for your account to be activated.",
        });
    }

    const token = signToken({
      id: matchedUser._id,
      username: matchedUser.username,
      role: matchedUser.role,
      fullName: matchedUser.fullName,
    });

    return res.json({
      message: "Login Successful",
      token,
      user: {
        id: matchedUser._id,
        username: matchedUser.username,
        fullName: matchedUser.fullName,
        role: matchedUser.role,
        college: matchedUser.collegeId,
        schoolYear: matchedUser.schoolYear,
        ...(matchedUser.role === "student" && {
          course: matchedUser.courseId,
          section: matchedUser.section,
          studentId: matchedUser.studentId,
        }),
        ...(matchedUser.role === "instructor" && {
          instructorId: matchedUser.instructorId,
        }),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ── FORGOT PASSWORD ───────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });
    if (!EMAIL_REGEX.test(email))
      return res.status(400).json({ message: "Invalid email format." });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        message:
          "If that email is registered, your credentials have been sent.",
      });
    }

    // Retrieve plain password (it's the studentId or instructorId)
    const plainPassword = user.studentId || user.instructorId;

    await sendPasswordEmail({
      to: user.email,
      username: user.username,
      password: plainPassword,
    });

    return res.json({
      message: "If that email is registered, your credentials have been sent.",
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Failed to send email. Please try again later." });
  }
};
