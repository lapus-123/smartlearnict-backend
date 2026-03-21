const express = require("express");
const router = express.Router();
const {
  getColleges,
  createCollege,
  updateCollege,
} = require("../controllers/collegeController");
const { protect, requireRole } = require("../middleware/auth");

router.get("/", getColleges); // public
router.post("/", protect, requireRole("admin"), createCollege);
router.put("/:id", protect, requireRole("admin"), updateCollege); // ✅ NEW — no delete

module.exports = router;
