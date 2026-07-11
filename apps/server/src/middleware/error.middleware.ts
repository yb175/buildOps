import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ErrorHandler] Unhandled error during ${req.method} ${req.path}:`, err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({ error: "Unexpected server error." });
};
