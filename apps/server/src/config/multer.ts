import multer from "multer";

export const multerConfig = {
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
  fileFilter: (_req: any, file: any, callback: any) => {
    if (file.mimetype !== "application/pdf") {
      return callback(new Error("Unsupported Media Type. Only PDF is allowed."), false);
    }
    callback(null, true);
  },
};
