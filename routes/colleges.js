const express = require("express");
const router = express.Router();
const {
  getColleges,
  createCollege,
  updateCollege,
  deleteCollege,
} = require("../controllers/collegeController");
const { protect, requireRole } = require("../middleware/auth");

router.get("/", getColleges);
router.post("/", protect, requireRole("admin"), createCollege);
router.put("/:id", protect, requireRole("admin"), updateCollege);
router.delete("/:id", protect, requireRole("admin"), deleteCollege);

module.exports = router;
