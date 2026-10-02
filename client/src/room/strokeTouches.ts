export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

export function strokeTouches(points: number[], area: Area) {
  const vertices = toVertices(points);
  return vertices.some((start, i) => {
    const end = vertices[i + 1];
    return end !== undefined && segmentTouches(start, end, area);
  });
}

function toVertices(points: number[]): Point[] {
  if (points.length < 4 || points.length % 2 !== 0) {
    throw new Error("A stroke needs at least two points");
  }
  const vertices: Point[] = [];
  for (let i = 0; i < points.length; i += 2) {
    vertices.push({ x: at(points, i), y: at(points, i + 1) });
  }
  return vertices;
}

function at(points: number[], index: number) {
  const value = points[index];
  if (value === undefined) throw new Error(`No point at index ${index}`);
  return value;
}

// Liang–Barsky: narrows the part of the segment that lies inside each edge.
function segmentTouches(start: Point, end: Point, area: Area) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const edges = [
    [-dx, start.x - area.x],
    [dx, area.x + area.width - start.x],
    [-dy, start.y - area.y],
    [dy, area.y + area.height - start.y],
  ] as const;
  let enter = 0;
  let leave = 1;
  for (const [direction, distance] of edges) {
    if (direction === 0) {
      if (distance < 0) return false;
      continue;
    }
    const t = distance / direction;
    if (direction < 0) enter = Math.max(enter, t);
    else leave = Math.min(leave, t);
    if (enter > leave) return false;
  }
  return true;
}
