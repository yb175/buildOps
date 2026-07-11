export type BBox = [number, number, number, number]; // [xMin, yMin, xMax, yMax]

/**
 * Parses various bounding box representations into a standard standard [xMin, yMin, xMax, yMax] tuple.
 */
export function parseBBox(val: any): BBox | null {
  if (!val) return null;

  if (Array.isArray(val) && val.length === 4) {
    const parsed = Array.from(val, Number);
    if (parsed.every((n) => !isNaN(n))) {
      return parsed as BBox;
    }
  }

  if (typeof val === "object") {
    // Check for xMin, yMin, xMax, yMax
    const xMin = val.xMin !== undefined ? Number(val.xMin) : val.xMin;
    const yMin = val.yMin !== undefined ? Number(val.yMin) : val.yMin;
    const xMax = val.xMax !== undefined ? Number(val.xMax) : val.xMax;
    const yMax = val.yMax !== undefined ? Number(val.yMax) : val.yMax;

    if (
      xMin !== undefined && !isNaN(xMin) &&
      yMin !== undefined && !isNaN(yMin) &&
      xMax !== undefined && !isNaN(xMax) &&
      yMax !== undefined && !isNaN(yMax)
    ) {
      return [Math.min(xMin, xMax), Math.min(yMin, yMax), Math.max(xMin, xMax), Math.max(yMin, yMax)];
    }

    // Check for x, y, width, height
    const x = val.x !== undefined ? Number(val.x) : val.x;
    const y = val.y !== undefined ? Number(val.y) : val.y;
    const w = val.width !== undefined ? Number(val.width) : val.width;
    const h = val.height !== undefined ? Number(val.height) : val.height;

    if (
      x !== undefined && !isNaN(x) &&
      y !== undefined && !isNaN(y) &&
      w !== undefined && !isNaN(w) &&
      h !== undefined && !isNaN(h)
    ) {
      return [Math.min(x, x + w), Math.min(y, y + h), Math.max(x, x + w), Math.max(y, y + h)];
    }
  }

  return null;
}

/**
 * Checks if two bounding boxes intersect.
 */
export function intersects(a: BBox, b: BBox): boolean {
  return !(
    a[2] < b[0] || // a is to the left of b
    a[0] > b[2] || // a is to the right of b
    a[3] < b[1] || // a is below b
    a[1] > b[3]    // a is above b
  );
}

/**
 * Checks if parent bbox completely contains child bbox.
 */
export function contains(parent: BBox, child: BBox): boolean {
  return (
    parent[0] <= child[0] &&
    parent[1] <= child[1] &&
    parent[2] >= child[2] &&
    parent[3] >= child[3]
  );
}
