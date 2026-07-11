import { describe, it, expect } from "vitest";
import { getDistance, parsePoint } from "../../conflict/geometry/coordinate.util";

describe("coordinate.util unit tests", () => {
  describe("getDistance", () => {
    it("should calculate distance between two points", () => {
      expect(getDistance([0, 0], [3, 4])).toBe(5);
    });
  });

  describe("parsePoint", () => {
    it("should parse an array", () => {
      expect(parsePoint([1.5, 2.5])).toEqual([1.5, 2.5]);
    });

    it("should parse an object", () => {
      expect(parsePoint({ x: 10, y: 20 })).toEqual([10, 20]);
      expect(parsePoint({ left: 5, top: 15 })).toEqual([5, 15]);
    });

    it("should parse a string", () => {
      expect(parsePoint("10, 20")).toEqual([10, 20]);
    });

    it("should return null for invalid points", () => {
      expect(parsePoint(null)).toBeNull();
      expect(parsePoint("invalid")).toBeNull();
    });
  });
});
