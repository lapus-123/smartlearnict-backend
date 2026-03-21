const express = require("express");
const router = express.Router();
const {
  getMaterials,
  getRecentMaterials,
  uploadMaterial,
  deleteMaterial,
  getMyMaterials,
} = require("../controllers/materialController");
const { protect, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.get("/recent", protect, getRecentMaterials);
router.get("/mine", protect, requireRole("instructor"), getMyMaterials);
router.get("/", protect, getMaterials);
router.post(
  "/",
  protect,
  requireRole("admin", "instructor"),
  upload.array("files", 10),
  uploadMaterial,
);
router.delete(
  "/:id",
  protect,
  requireRole("admin", "instructor"),
  deleteMaterial,
);

module.exports = router;
