import { cloudinary } from "../config/cloudinary";

export interface UploadResult {
  secure_url: string;
  public_id: string;
}

export const uploadToCloudinary = (fileBuffer: Buffer, fileName: string): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    // If Cloudinary configuration is missing, fall back to mock data
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn("⚠️ Cloudinary credentials missing. Returning local mock upload.");
      return resolve({
        secure_url: `https://res.cloudinary.com/mock/image/upload/v12345/${fileName}`,
        public_id: `mock_${Date.now()}_${fileName.replace(/\.[^/.]+$/, "")}`,
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw", // PDFs are uploaded as raw files
        public_id: `drawings/${Date.now()}_${fileName.replace(/\.[^/.]+$/, "")}`,
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
