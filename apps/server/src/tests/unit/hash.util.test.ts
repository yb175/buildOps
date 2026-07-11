import { describe, it, expect } from "vitest";
import { computeSHA256 } from "../../utils/hash.util";
import crypto from "crypto";

describe("hash.util", () => {
  it("should compute correct SHA-256 hash of a buffer combined with discipline", () => {
    const buffer = Buffer.from("BuildOps PDF Content");
    const discipline = "STRUCTURAL";
    const expectedHash = crypto
      .createHash("sha256")
      .update(discipline)
      .update(buffer)
      .digest("hex");
      
    const hash = computeSHA256(buffer, discipline);
    
    expect(hash).toBe(expectedHash);
    expect(hash).toHaveLength(64);
  });

  it("should produce different hashes for different disciplines with the same content", () => {
    const buffer = Buffer.from("PDF Content");
    const hash1 = computeSHA256(buffer, "STRUCTURAL");
    const hash2 = computeSHA256(buffer, "ARCHITECTURAL");
    
    expect(hash1).not.toBe(hash2);
  });

  it("should produce different hashes for different contents with the same discipline", () => {
    const discipline = "STRUCTURAL";
    const hash1 = computeSHA256(Buffer.from("Content A"), discipline);
    const hash2 = computeSHA256(Buffer.from("Content B"), discipline);
    
    expect(hash1).not.toBe(hash2);
  });
});
