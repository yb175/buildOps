import crypto from "crypto";

/**
 * Computes a SHA-256 hash combined from the discipline and the file buffer.
 */
export const computeSHA256 = (buffer: Buffer, discipline: string): string => {
  return crypto
    .createHash("sha256")
    .update(discipline)
    .update(buffer)
    .digest("hex");
};
