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

interface Run {
  isInside: boolean;
  points: number[];
}

export function splitStroke(points: number[], area: Area) {
  const runs: Run[] = [];
  const vertices = toVertices(points);
  for (let i = 1; i < vertices.length; i++) {
    const start = at(vertices, i - 1);
    const end = at(vertices, i);
    for (const [from, to] of pieces(start, end, area)) {
      const isInside = contains(area, lerp(start, end, (from + to) / 2));
      const last = runs.at(-1);
      const toPoint = lerp(start, end, to);
      if (last?.isInside === isInside) {
        last.points.push(toPoint.x, toPoint.y);
      } else {
        const fromPoint = lerp(start, end, from);
        runs.push({
          isInside,
          points: [fromPoint.x, fromPoint.y, toPoint.x, toPoint.y],
        });
      }
    }
  }
  return {
    inside: runs.filter((run) => run.isInside).map((run) => run.points),
    outside: runs.filter((run) => !run.isInside).map((run) => run.points),
  };
}

function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) throw new Error(`No item at index ${index}`);
  return item;
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

// Splits a segment where it enters and leaves the area (Liang–Barsky).
function pieces(start: Point, end: Point, area: Area) {
  const clip = clipInterval(start, end, area);
  const cuts = [0, ...(clip ?? []), 1].filter((t, i, all) => t !== all[i - 1]);
  const result: [number, number][] = [];
  for (let i = 1; i < cuts.length; i++) {
    result.push([at(cuts, i - 1), at(cuts, i)]);
  }
  return result;
}

function clipInterval(start: Point, end: Point, area: Area) {
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
      if (distance < 0) return null;
      continue;
    }
    const t = distance / direction;
    if (direction < 0) enter = Math.max(enter, t);
    else leave = Math.min(leave, t);
    if (enter > leave) return null;
  }
  return [enter, leave];
}

function lerp(start: Point, end: Point, t: number): Point {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  };
}

function contains(area: Area, point: Point) {
  return (
    point.x >= area.x &&
    point.x <= area.x + area.width &&
    point.y >= area.y &&
    point.y <= area.y + area.height
  );
}
