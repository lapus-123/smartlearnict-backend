const express = require("express");
const router = express.Router();
const {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");
const { protect, requireRole } = require("../middleware/auth");

router.get("/", getSubjects); // public
router.post("/", protect, requireRole("admin"), createSubject);
router.put("/:id", protect, requireRole("admin"), updateSubject);
router.delete("/:id", protect, requireRole("admin"), deleteSubject);

module.exports = router;
