import multer from "multer";
import { multerConfig } from "../config/multer";
import { Request, Response, NextFunction } from "express";

const upload = multer(multerConfig).single("file");

export const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload(req, res, (err) => {
    if (err) {
      if (err.message && err.message.includes("Unsupported Media Type")) {
        return res.status(415).json({ error: err.message });
      }
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `File upload error: ${err.message}` });
      }
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: "Missing file" });
    }

    // Validate MIME Type (only accept PDF)
    if (req.file.mimetype !== "application/pdf") {
      return res.status(415).json({ error: "Unsupported Media Type. Only PDF is allowed." });
    }

    // Validate PDF file signature (%PDF) from the first 4 bytes of file buffer
    const isPDFSignature = req.file.buffer.length >= 4 && req.file.buffer.toString("ascii", 0, 4) === "%PDF";
    if (!isPDFSignature) {
      return res.status(415).json({ error: "Unsupported Media Type. Invalid PDF file signature." });
    }

    next();
  });
};
