import { cloudinary } from "../config/cloudinary";
import { env } from "../config/env";

export interface UploadResult {
  secure_url: string;
  public_id: string;
}

export const uploadToCloudinary = (fileBuffer: Buffer, fileName: string): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    // If Cloudinary configuration is missing, fail fast in production, otherwise fall back to mock data
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      if (process.env.NODE_ENV === "production") {
        return reject(new Error("Cloudinary configuration credentials are missing in production environment."));
      }
      console.warn("⚠️ Cloudinary credentials missing. Returning local mock upload.");
      return resolve({
        secure_url: `https://res.cloudinary.com/mock/image/upload/v12345/${fileName}`,
        public_id: `mock_${Date.now()}_${fileName.replace(/\.[^/.]+$/, "")}.pdf`,
      });
    }

    const cleanBaseName = fileName.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_");
    const publicId = `drawings/${Date.now()}_${cleanBaseName}.pdf`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw", // PDFs are uploaded as raw files
        public_id: publicId,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed"));
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
};
