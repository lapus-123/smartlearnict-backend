const express = require("express");
const router = express.Router();
const { getMe } = require("../controllers/userController");
const { protect } = require("../middleware/auth");

router.get("/me", protect, getMe);

module.exports = router;

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const User = require("../models/User");

// Separate upload middleware just for profile pics
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "smartlearn/avatars",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [
      { width: 300, height: 300, crop: "fill", gravity: "face" },
    ],
  },
});
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// PUT /api/users/avatar
router.put(
  "/avatar",
  protect,
  avatarUpload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No image uploaded." });
      const avatarUrl = req.file.path || req.file.secure_url;
      await User.findByIdAndUpdate(req.user.id, { avatarUrl });
      return res.json({ message: "Profile picture updated.", avatarUrl });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error." });
    }
  },
);
