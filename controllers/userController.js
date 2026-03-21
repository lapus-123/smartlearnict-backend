const User = require("../models/User");

exports.getMe = async (req, res) => {
  try {
    if (req.user.id === "admin") {
      return res.json({
        user: {
          id: "admin",
          fullName: req.user.fullName,
          username: req.user.username,
          role: "admin",
        },
      });
    }
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};
