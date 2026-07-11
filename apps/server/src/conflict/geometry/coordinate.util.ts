import { Point } from "./polygon.util";

/**
 * Calculates Euclidean distance between two points.
 */
export function getDistance(p1: Point, p2: Point): number {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Parses coordinates into a standard Point [x, y] tuple.
 */
export function parsePoint(val: any): Point | null {
  if (!val) return null;

  if (Array.isArray(val) && val.length >= 2) {
    const x = Number(val[0]);
    const y = Number(val[1]);
    if (!isNaN(x) && !isNaN(y)) {
      return [x, y];
    }
  }

  if (typeof val === "object") {
    const x = val.x !== undefined ? Number(val.x) : val.left;
    const y = val.y !== undefined ? Number(val.y) : val.top;
    if (x !== undefined && !isNaN(Number(x)) && y !== undefined && !isNaN(Number(y))) {
      return [Number(x), Number(y)];
    }
  }

  if (typeof val === "string") {
    const parts = val.split(",").map((s) => Number(s.trim()));
    if (parts.length >= 2 && !parts.some(isNaN)) {
      return [parts[0], parts[1]] as Point;
    }
  }

  return null;
}
