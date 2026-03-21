const Material = require("../models/Material");
const cloudinary = require("../config/cloudinary");

exports.getRecentMaterials = async (req, res) => {
  try {
    const materials = await Material.find()
      .populate("subjectId", "name")
      .populate("uploadedBy", "fullName")
      .sort({ createdAt: -1 })
      .limit(20);
    return res.json({ materials });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
};

exports.getMaterials = async (req, res) => {
  try {
    const { subjectId, schoolYear } = req.query;
    const query = {};
    if (subjectId) query.subjectId = subjectId;
    if (schoolYear) query.schoolYear = schoolYear;
    const materials = await Material.find(query)
      .populate("subjectId", "name")
      .populate("uploadedBy", "fullName")
      .sort({ createdAt: -1 });
    return res.json({ materials });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
};

exports.getMyMaterials = async (req, res) => {
  try {
    const materials = await Material.find({ uploadedBy: req.user.id })
      .populate("subjectId", "name")
      .sort({ createdAt: -1 });
    return res.json({ materials });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
};

// POST /api/materials — groups all uploaded files into ONE material record
exports.uploadMaterial = async (req, res) => {
  try {
    const uploadedFiles = req.files?.length
      ? req.files
      : req.file
        ? [req.file]
        : [];
    if (!uploadedFiles.length)
      return res.status(400).json({ message: "No file uploaded." });

    const { subjectId, schoolYear, title, description } = req.body;
    if (!subjectId || !schoolYear || !title)
      return res
        .status(400)
        .json({ message: "subjectId, schoolYear, and title are required." });

    const isAdmin = req.user.role === "admin";
    const uploadedBy = isAdmin ? null : req.user.id;
    const uploadedByName = isAdmin ? "Admin" : req.user.fullName;

    // Build files array — one entry per uploaded file
    const filesArr = uploadedFiles
      .map((file) => ({
        fileUrl: file.path || file.secure_url,
        publicId: file.public_id || file.filename,
        fileType: file.originalname.split(".").pop().toLowerCase(),
        fileName: file.originalname,
      }))
      .filter((f) => f.fileUrl);

    if (!filesArr.length)
      return res
        .status(500)
        .json({ message: "Cloudinary did not return file URLs." });

    // First file = legacy single-file fields (backward compat)
    const first = filesArr[0];

    const material = await Material.create({
      subjectId,
      schoolYear,
      title: title.trim(),
      description: description?.trim() || "",
      fileUrl: first.fileUrl,
      publicId: first.publicId,
      fileType: first.fileType,
      files: filesArr,
      uploadedBy,
      uploadedByName,
    });

    const populated = await material.populate("subjectId", "name");
    return res
      .status(201)
      .json({ message: "Material uploaded.", material: populated });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ message: err.message || "Server error." });
  }
};

// DELETE — removes all files from Cloudinary
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material)
      return res.status(404).json({ message: "Material not found." });
    if (
      req.user.role === "instructor" &&
      String(material.uploadedBy) !== req.user.id
    )
      return res
        .status(403)
        .json({ message: "You can only delete your own materials." });

    // Delete all files from Cloudinary
    const allFiles = material.files?.length
      ? material.files
      : [{ publicId: material.publicId, fileType: material.fileType }];
    for (const f of allFiles) {
      if (f.publicId) {
        const isVideo = ["mp4", "mov", "webm"].includes(f.fileType);
        await cloudinary.uploader
          .destroy(f.publicId, { resource_type: isVideo ? "video" : "raw" })
          .catch(() => {});
      }
    }

    await Material.findByIdAndDelete(req.params.id);
    return res.json({ message: "Material deleted." });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
};
