const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const admin = require("../config/admin");
const { sendPasswordEmail } = require("../config/mailer");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generateUsername = (birthday) => {
  const parts = String(birthday || "").split("/");
  if (parts.length < 2)
    throw new Error("Invalid birthday format. Use MM/DD/YYYY.");
  const month = String(Number(parts[0])).padStart(2, "0");
  const day = String(Number(parts[1])).padStart(2, "0");
  if (month === "NaN" || day === "NaN")
    throw new Error("Invalid birthday format. Use MM/DD/YYYY.");
  return month + day;
};

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

// ── REGISTER ──────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { role, collegeId } = req.body;
    const fullName = req.body.fullName?.trim();
    const birthday = req.body.birthday?.trim();
    const schoolYear = req.body.schoolYear?.trim();
    const email = req.body.email?.toLowerCase().trim();

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
    const emailExists = await User.findOne({ email });
    if (emailExists)
      return res
        .status(409)
        .json({ message: "This email address is already registered." });

    let idField, idValue;

    if (role === "student") {
      const { courseId } = req.body;
      const studentId = req.body.studentId?.trim();
      if (!studentId || !courseId)
        return res.status(400).json({
          message: "studentId and courseId are required for students.",
        });
      const existing = await User.findOne({ studentId });
      if (existing)
        return res.status(409).json({
          message: `Student ID "${studentId}" is already registered.`,
        });
      idField = "studentId";
      idValue = studentId;
    } else {
      const instructorId = req.body.instructorId?.trim();
      if (!instructorId)
        return res
          .status(400)
          .json({ message: "instructorId is required for instructors." });
      const existing = await User.findOne({ instructorId });
      if (existing)
        return res.status(409).json({
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
      email,
      status: "pending", // both student and instructor require admin approval
      [idField]: idValue,
    };
    if (role === "student") {
      userData.courseId = req.body.courseId;
    }

    await User.create(userData);

    const pendingMsg =
      " Your account is pending Admin approval before you can log in.";
    return res.status(201).json({
      message: "Registration Successful" + pendingMsg,
      username,
      pending: true,
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
    const username = req.body.username?.trim();
    const password = req.body.password?.trim();
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
      return res.status(403).json({
        message:
          "Your account is pending Admin approval. Please wait for your account to be activated.",
      });
    }
    if (matchedUser.status === "inactive") {
      return res.status(403).json({
        message: "Your account is inactive. Please contact the administrator.",
      });
    }
    if (matchedUser.status === "suspended") {
      return res.status(403).json({
        message: "Your account is suspended. Please contact the administrator.",
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
        avatarUrl: matchedUser.avatarUrl || null,
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

    // Respond immediately — don't make user wait for email to send
    if (!user) {
      return res.json({
        message:
          "If that email is registered, your account recovery email will be sent.",
      });
    }

    // Send email in background after response
    const plainPassword = user.studentId || user.instructorId;
    if (!plainPassword) {
      return res.status(400).json({
        message:
          "This account does not have a recovery ID on file. Please contact the administrator.",
      });
    }

    await sendPasswordEmail({
      to: user.email,
      username: user.username,
      password: plainPassword,
    });

    return res.json({
      message: "If that email is registered, your credentials have been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    return res.status(500).json({
      message:
        err.message ||
        "Failed to send the recovery email. Please try again later.",
    });
  }
};
