import { describe, expect, it } from "vitest";
import {
  burstDice,
  catchDelays,
  gatheredDie,
  moveBurstDie,
  twentySpacing,
  twentyTargets,
  type BurstDie,
} from "./natural20Burst";

const area = { x: 0, y: 0, width: 800, height: 600 };
const radius = 10;

function die(changes: Partial<BurstDie>): BurstDie {
  return {
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    rotation: 0,
    spin: 0,
    target: { x: 0, y: 0 },
    ...changes,
  };
}

describe("twentyTargets", () => {
  const targets = twentyTargets({ x: 400, y: 300 }, 20);

  it("spells 20 with one die per pixel", () => {
    expect(targets).toHaveLength(30);
  });

  it("centers the number in a grid of the spacing", () => {
    const xs = targets.map((t) => t.x);
    const ys = targets.map((t) => t.y);
    expect(Math.min(...xs) + Math.max(...xs)).toBe(800);
    expect(Math.min(...ys) + Math.max(...ys)).toBe(600);
    expect(Math.max(...xs) - Math.min(...xs)).toBe(200);
    expect(Math.max(...ys) - Math.min(...ys)).toBe(120);
  });

  it("never puts two dice on the same place", () => {
    const places = new Set(targets.map((t) => `${t.x},${t.y}`));
    expect(places.size).toBe(targets.length);
  });
});

describe("twentySpacing", () => {
  it("fits the number on a narrow phone screen", () => {
    const phone = { x: 0, y: 0, width: 360, height: 700 };
    const spacing = twentySpacing(phone);
    const xs = twentyTargets({ x: 180, y: 350 }, spacing).map((t) => t.x);
    expect(Math.max(...xs) - Math.min(...xs) + spacing).toBeLessThan(
      phone.width,
    );
  });

  it("is limited by the height on a wide screen", () => {
    expect(twentySpacing({ x: 0, y: 0, width: 3000, height: 700 })).toBeCloseTo(
      60,
    );
  });
});

describe("burstDice", () => {
  const targets = twentyTargets({ x: 400, y: 300 }, 20);

  it("starts every die at the rolled die and sends them all ways", () => {
    const dice = burstDice({ x: 100, y: 50 }, targets, area, radius);
    expect(dice.map((d) => d.target)).toEqual(targets);
    expect(dice.every((d) => d.x === 100 && d.y === 50)).toBe(true);
    expect(dice.some((d) => d.vx > 0 && d.vy > 0)).toBe(true);
    expect(dice.some((d) => d.vx < 0 && d.vy > 0)).toBe(true);
    expect(dice.some((d) => d.vx > 0 && d.vy < 0)).toBe(true);
    expect(dice.some((d) => d.vx < 0 && d.vy < 0)).toBe(true);
  });

  it("throws faster in a larger area", () => {
    const speeds = (dice: BurstDie[]) =>
      dice.map((d) => Math.hypot(d.vx, d.vy));
    const small = speeds(burstDice({ x: 0, y: 0 }, targets, area, radius));
    const large = burstDice(
      { x: 0, y: 0 },
      targets,
      { x: 0, y: 0, width: 8000, height: 6000 },
      radius,
    );
    expect(Math.min(...speeds(large))).toBeGreaterThan(Math.max(...small));
  });

  it("starts inside the area when the rolled die is outside it", () => {
    const [first] = burstDice({ x: -200, y: 900 }, targets, area, radius);
    expect(first).toMatchObject({ x: radius, y: area.height - radius });
  });
});

describe("moveBurstDie", () => {
  it("moves and slows down", () => {
    const moved = moveBurstDie(die({ vx: 100, spin: 90 }), 0.02, area, radius);
    expect(moved.x).toBeCloseTo(402);
    expect(moved.vx).toBeLessThan(100);
    expect(moved.vx).toBeGreaterThan(0);
    expect(moved.rotation).toBeCloseTo(1.8);
  });

  it("keeps a die inside after a long frame", () => {
    const moved = moveBurstDie(die({ x: 780, vx: 1600 }), 1, area, radius);
    expect(moved.x).toBeGreaterThanOrEqual(radius);
    expect(moved.x).toBeLessThanOrEqual(area.width - radius);
  });

  it("bounces off the edges of an area away from the origin", () => {
    const shifted = { x: -500, y: 200, width: 300, height: 300 };
    const left = moveBurstDie(
      die({ x: -480, y: 300, vx: -1000 }),
      0.03,
      shifted,
      radius,
    );
    expect(left.x).toBeCloseTo(-470);
    expect(left.vx).toBeGreaterThan(0);
  });

  it("sends a die that is still outside back inside", () => {
    const outside = die({ x: -50, vx: -100 });
    expect(moveBurstDie(outside, 0.02, area, radius).vx).toBeGreaterThan(0);
    const wrongWay = die({ x: 850, vx: 100 });
    expect(moveBurstDie(wrongWay, 0.02, area, radius).vx).toBeLessThan(0);
  });

  it("bounces off the edges and stays inside", () => {
    const right = moveBurstDie(die({ x: 780, vx: 1000 }), 0.03, area, radius);
    expect(right.x).toBeCloseTo(770);
    expect(right.vx).toBeLessThan(0);
    const top = moveBurstDie(die({ y: 20, vy: -1000 }), 0.03, area, radius);
    expect(top.y).toBeCloseTo(30);
    expect(top.vy).toBeGreaterThan(0);
  });
});

describe("gatheredDie", () => {
  const caught = die({
    x: 0,
    y: 0,
    vx: 0,
    vy: -1000,
    rotation: 400,
    target: { x: 100, y: 50 },
  });

  it("starts where the die was and ends on its place, upright", () => {
    expect(gatheredDie(caught, 0)).toMatchObject({ x: 0, y: 0, rotation: 400 });
    const end = gatheredDie(caught, 5);
    expect(end.x).toBeCloseTo(100);
    expect(end.y).toBeCloseTo(50);
    expect(end.rotation).toBeCloseTo(360);
    expect(end.scale).toBe(1);
  });

  it("keeps flying the way it went before curving in", () => {
    expect(gatheredDie(caught, 0.05).y).toBeLessThan(0);
  });

  it("comes to rest instead of overshooting", () => {
    const xs = [0.2, 0.4, 0.6, 0.8].map((s) => gatheredDie(caught, s).x);
    expect(xs.every((x) => x <= 100)).toBe(true);
  });

  it("pops once after arriving", () => {
    expect(gatheredDie(caught, 0.9).scale).toBe(1);
    expect(gatheredDie(caught, 1.02).scale).toBeGreaterThan(1);
    expect(gatheredDie(caught, 1.2).scale).toBe(1);
  });

  it("turns upright in the way it was spinning", () => {
    const spinning = die({ rotation: 170, spin: 720 });
    expect(gatheredDie(spinning, 5).rotation).toBe(360);
  });
});

describe("catchDelays", () => {
  it("catches the die nearest to its place first and spreads the rest", () => {
    const near = die({ x: 0, y: 0, target: { x: 10, y: 0 } });
    const middle = die({ x: 0, y: 0, target: { x: 100, y: 0 } });
    const far = die({ x: 0, y: 0, target: { x: 500, y: 0 } });
    const delays = catchDelays([far, near, middle]);
    expect(delays[1]).toBe(0);
    expect(delays[2]).toBeGreaterThan(0);
    expect(delays[0]).toBeGreaterThan(delays[2] ?? Infinity);
  });
});
