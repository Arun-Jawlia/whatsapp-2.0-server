import { cloudinary } from "../../config/cloudinary";
import streamifier from "streamifier";

type CloudinaryType = "image" | "video" | "raw";

const getResourceType = (mimeType?: string): CloudinaryType => {
  if (!mimeType) return "raw";

  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "video"; // 🔥 IMPORTANT
  return "raw";
};

export const uploadService = {
  uploadToCloudinary: async (file: Express.Multer.File) => {
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");
    const isAudio = file.mimetype.startsWith("audio/");

    let resourceType: "image" | "video" | "raw" = "raw";
    if (isImage) resourceType = "image";
    else if (isVideo || isAudio) resourceType = "video"; // Cloudinary treats audio as video

    return new Promise<{
      url: string;
      publicId: string;
      resourceType: string;
      bytes: number;
      format?: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "ultimate-chat-app",
          resource_type: resourceType,
        },
        (error, result) => {
          if (error || !result) return reject(error);

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
            bytes: result.bytes,
            format: result.format,
          });
        },
      );

      streamifier.createReadStream(file.buffer).pipe(stream);
    });
  },
};

export const deleteFromCloudinary = async (publicId?: string, mimeType?: string) => {
  if (!publicId) return;

  try {
    const resourceType = getResourceType(mimeType);
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log("image deleted", publicId);
  } catch (err) {
    console.error("Cloudinary delete failed:", err);
  }
};
