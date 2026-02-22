import multer from 'multer'
import { ApiError } from "../../utils/ApiError";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
  fileFilter(req, file, cb) {
    const allowed = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",

      "video/mp4",
      "video/webm",
      "video/quicktime",

      "audio/mpeg",
      "audio/mp3",
      "audio/webm",
      "audio/wav",
      "audio/ogg",

      "application/pdf",
      "application/zip",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(new ApiError(400, "Unsupported file type") as any, false);
    }

    cb(null, true);
  },
});