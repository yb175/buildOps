/**
 * Type representing a 2D coordinate point [x, y]
 */
export type Point = [number, number];

/**
 * Checks if a point is inside a polygon using the Ray Casting algorithm.
 */
export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;

  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Checks if two line segments intersect.
 * Segment A: p1 to p2. Segment B: p3 to p4.
 */
export function segmentsIntersect(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): boolean {
  const ccw = (a: Point, b: Point, c: Point) => {
    return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);
  };

  return (
    ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)
  );
}

/**
 * Checks if two polygons intersect or overlap (including one containing the other).
 */
export function polygonIntersection(polyA: Point[], polyB: Point[]): boolean {
  if (polyA.length < 3 || polyB.length < 3) return false;

  // 1. Check if any vertex of polyA is inside polyB
  for (const pt of polyA) {
    if (pointInPolygon(pt, polyB)) return true;
  }

  // 2. Check if any vertex of polyB is inside polyA
  for (const pt of polyB) {
    if (pointInPolygon(pt, polyA)) return true;
  }

  // 3. Check if any edge of polyA intersects any edge of polyB
  for (let i = 0; i < polyA.length; i++) {
    const nextA = polyA[(i + 1) % polyA.length];
    for (let j = 0; j < polyB.length; j++) {
      const nextB = polyB[(j + 1) % polyB.length];
      if (segmentsIntersect(polyA[i], nextA, polyB[j], nextB)) {
        return true;
      }
    }
  }

  return false;
}
