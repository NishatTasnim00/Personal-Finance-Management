import cloudinary from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// Configure Cloudinary (v2 API)
const cloudinaryV2 = cloudinary.v2;
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage engine for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinaryV2,
  params: {
    folder: "expense-tracker/avatars",
    format: async (req, file) => {
      const ext = file.mimetype?.split("/")[1] || "jpg";
      return ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
    },
    public_id: (req) => `avatar-${req.user?.uid || "guest"}-${Date.now()}`,
  },
});

// Multer middleware used by routes/user.js
export const avatarUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPG, PNG, WebP and GIF are allowed.",
        ),
        false,
      );
    }
  },
});
