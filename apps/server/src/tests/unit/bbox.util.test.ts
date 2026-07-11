import { describe, it, expect } from "vitest";
import { parseBBox, intersects, contains } from "../../conflict/geometry/bbox.util";

describe("bbox.util unit tests", () => {
  describe("parseBBox", () => {
    it("should parse an array [xMin, yMin, xMax, yMax]", () => {
      expect(parseBBox([10, 20, 30, 40])).toEqual([10, 20, 30, 40]);
    });

    it("should parse an object with xMin, yMin, xMax, yMax", () => {
      expect(parseBBox({ xMin: 5, yMin: 15, xMax: 25, yMax: 35 })).toEqual([5, 15, 25, 35]);
    });

    it("should parse an object with x, y, width, height", () => {
      expect(parseBBox({ x: 10, y: 20, width: 5, height: 10 })).toEqual([10, 20, 15, 30]);
    });

    it("should return null for invalid bounding boxes", () => {
      expect(parseBBox(null)).toBeNull();
      expect(parseBBox([1, 2])).toBeNull();
      expect(parseBBox({ xMin: 5 })).toBeNull();
    });
  });

  describe("intersects", () => {
    it("should detect overlapping bboxes", () => {
      expect(intersects([0, 0, 10, 10], [5, 5, 15, 15])).toBe(true);
    });

    it("should detect non-overlapping bboxes", () => {
      expect(intersects([0, 0, 10, 10], [11, 11, 20, 20])).toBe(false);
    });
  });

  describe("contains", () => {
    it("should detect containment", () => {
      expect(contains([0, 0, 20, 20], [5, 5, 15, 15])).toBe(true);
    });

    it("should reject partial containment", () => {
      expect(contains([0, 0, 10, 10], [5, 5, 15, 15])).toBe(false);
    });
  });
});
