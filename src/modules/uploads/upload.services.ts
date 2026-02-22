import { cloudinary } from "../../config/cloudinary";
import streamifier from "streamifier";

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
        }
      );

      streamifier.createReadStream(file.buffer).pipe(stream);
    });
  },
};