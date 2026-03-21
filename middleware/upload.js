const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const ALLOWED_FORMATS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "jpg",
  "jpeg",
  "png",
  "mp4",
  "mov",
  "webm",
];
const MAX_SIZE_MB = 100;

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith("video/");
    const isImage = file.mimetype.startsWith("image/");
    // Store everything as 'raw' except real images and videos
    // 'raw' = direct file URL, no Cloudinary processing delay
    const resource_type = isVideo ? "video" : isImage ? "image" : "raw";
    return {
      folder: "smartlearn/materials",
      resource_type,
      use_filename: true,
      unique_filename: true,
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.split(".").pop().toLowerCase();
    if (!ALLOWED_FORMATS.includes(ext))
      return cb(new Error(`File type .${ext} is not allowed.`));
    cb(null, true);
  },
});

module.exports = upload;
