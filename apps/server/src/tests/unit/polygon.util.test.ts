import { describe, it, expect } from "vitest";
import { pointInPolygon, polygonIntersection } from "../../conflict/geometry/polygon.util";

describe("polygon.util unit tests", () => {
  const square: [number, number][] = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ];

  describe("pointInPolygon", () => {
    it("should detect point inside polygon", () => {
      expect(pointInPolygon([5, 5], square)).toBe(true);
    });

    it("should detect point outside polygon", () => {
      expect(pointInPolygon([15, 15], square)).toBe(false);
    });
  });

  describe("polygonIntersection", () => {
    it("should detect overlapping polygons", () => {
      const overlappingSquare: [number, number][] = [
        [5, 5],
        [15, 5],
        [15, 15],
        [5, 15],
      ];
      expect(polygonIntersection(square, overlappingSquare)).toBe(true);
    });

    it("should detect non-overlapping polygons", () => {
      const separatedSquare: [number, number][] = [
        [20, 20],
        [30, 20],
        [30, 30],
        [20, 30],
      ];
      expect(polygonIntersection(square, separatedSquare)).toBe(false);
    });
  });
});
