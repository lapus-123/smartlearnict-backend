const express = require("express");
const router = express.Router();
const {
  getSections,
  createSection,
  deleteSection,
} = require("../controllers/sectionController");
const { protect, requireRole } = require("../middleware/auth");

router.get("/", getSections); // ✅ public — needed for registration
router.post("/", protect, requireRole("admin"), createSection);
router.delete("/:id", protect, requireRole("admin"), deleteSection);

module.exports = router;
