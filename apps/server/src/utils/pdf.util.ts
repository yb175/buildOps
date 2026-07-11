import { cloudinary } from "../config/cloudinary";
import { env } from "../config/env";

/**
 * Downloads a PDF file from a given URL (e.g. Cloudinary) into a Buffer.
 * If Cloudinary credentials are set, it generates a signed private download URL.
 */
export const downloadPDF = async (url: string): Promise<Buffer> => {
  let downloadUrl = url;

  // Generate signed URL if we have Cloudinary credentials
  if (
    url.includes("res.cloudinary.com/") &&
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET
  ) {
    try {
      const rawUploadIndex = url.indexOf("raw/upload/");
      if (rawUploadIndex !== -1) {
        const afterRawUpload = url.substring(rawUploadIndex + "raw/upload/".length);
        const parts = afterRawUpload.split("/");
        // If it has a version prefix (like v1783749015/), remove it
        if (parts.length > 1 && parts[0].startsWith("v")) {
          parts.shift();
        }
        const publicId = parts.join("/"); // E.g., drawings/1783749011863_dummy.pdf

        console.log(`[pdf.util] Generating signed Cloudinary private download URL for: ${publicId}`);
        downloadUrl = cloudinary.utils.private_download_url(publicId, "pdf", {
          resource_type: "raw",
          type: "upload",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        });
      }
    } catch (err) {
      console.warn("[pdf.util] Failed to generate signed URL, using original:", err);
    }
  }

  if (downloadUrl.includes("res.cloudinary.com/mock/")) {
    console.warn(`[pdf.util] Mock Cloudinary URL detected: ${downloadUrl}. Returning mock PDF buffer.`);
    return Buffer.from("%PDF-1.4 mock content");
  }

  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[pdf.util] PDF download failed with status ${response.status} for URL: ${downloadUrl}. Falling back to mock PDF content.`);
        return Buffer.from("%PDF-1.4 mock content");
      }
      throw new Error(`Failed to download PDF. Status code: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[pdf.util] PDF download error: ${error instanceof Error ? error.message : String(error)}. Falling back to mock PDF content.`);
      return Buffer.from("%PDF-1.4 mock content");
    }
    throw new Error(`Cloudinary download failure: ${error instanceof Error ? error.message : String(error)}`);
  }
};
