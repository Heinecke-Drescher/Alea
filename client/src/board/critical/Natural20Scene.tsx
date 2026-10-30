import { useMantineTheme } from "@mantine/core";
import type { IRect, Vector2d } from "konva/lib/types";
import { dieColors } from "../../dice/dieColors";
import { dieShape } from "../../dice/dieShapes";
import {
  burstDice,
  catchDelays,
  GATHER_SECONDS,
  gatheredDie,
  moveBurstDie,
  twentySpacing,
  twentyTargets,
  type GatheredDie,
} from "./natural20Burst";
import { toPoints } from "../../room/points";
import {
  CriticalScene,
  type CriticalAnimation,
  type CriticalSceneProps,
} from "./CriticalScene";
import { drawSlogan } from "./drawSlogan";

const BURST_SECONDS = 1.2;
const HOLD_SECONDS = 1.5;
const FADE_START = BURST_SECONDS + GATHER_SECONDS + HOLD_SECONDS;
// Share of the spacing a die's radius takes, so neighbours in the number do not overlap.
const DIE_SIZE = 0.45;
const OUTLINE_WIDTH = 0.05;
const SLOGAN = "LET'S GO";
const SLOGAN_TILT = -8;

interface Scene {
  center: Vector2d;
  spacing: number;
  dice: GatheredDie[];
  glow: number;
  // Seconds since the number was finished, negative before.
  holding: number;
}

export function Natural20Scene(props: CriticalSceneProps) {
  const theme = useMantineTheme();
  const colors = dieColors(theme, props.critical.color);

  function start(area: IRect, landed: Vector2d): CriticalAnimation {
    const spacing = twentySpacing(area);
    const radius = spacing * DIE_SIZE;
    const center = { x: area.x + area.width / 2, y: area.y + area.height / 2 };
    let dice = burstDice(landed, twentyTargets(center, spacing), area, radius);
    let delays: number[] | null = null;
    let scene: Scene | null = null;

    return {
      update(seconds, stepSeconds) {
        const gathering = seconds - BURST_SECONDS;
        if (gathering >= 0) delays ??= catchDelays(dice);
        // A die flies on until it is caught; then it stays as it was at that moment.
        const caughtAt = (i: number) => delays?.[i] ?? Infinity;
        dice = dice.map((die, i) =>
          gathering < caughtAt(i)
            ? moveBurstDie(die, stepSeconds, area, radius)
            : die,
        );
        const placed = dice.map((die, i) =>
          gathering < caughtAt(i)
            ? { ...die, scale: 1 }
            : gatheredDie(die, gathering - caughtAt(i)),
        );
        const holding = seconds - BURST_SECONDS - GATHER_SECONDS;
        const glow =
          holding > 0 && holding < HOLD_SECONDS
            ? Math.sin((holding / HOLD_SECONDS) * Math.PI)
            : 0;
        scene = { center, spacing, dice: placed, glow, holding };
      },
      draw(canvas) {
        if (!scene) return;
        drawDice(canvas, scene);
        if (scene.holding < 0) return;
        drawSlogan(
          canvas,
          {
            text: SLOGAN,
            x: center.x + 5.5 * spacing,
            y: center.y + 3.6 * spacing,
            align: 1,
            size: spacing * 1.1,
            tilt: SLOGAN_TILT,
            fontFamily: theme.fontFamily,
            fill: "white",
            outline: colors.fill,
          },
          scene.holding,
        );
      },
    };
  }

  function drawDice(
    canvas: CanvasRenderingContext2D,
    { spacing, dice, glow }: Scene,
  ) {
    const radius = spacing * DIE_SIZE;
    const corners = toPoints(dieShape(20, radius));
    canvas.font = `bold ${radius * 0.7}px ${theme.fontFamily}`;
    canvas.textAlign = "center";
    canvas.textBaseline = "middle";
    canvas.lineWidth = radius * OUTLINE_WIDTH;
    // The canvas does not scale shadows with zoom and pixel ratio, so it is done here.
    const { a, b } = canvas.getTransform();
    const pixelsPerUnit = Math.hypot(a, b);
    canvas.strokeStyle = "white";
    canvas.shadowColor = "white";
    for (const { x, y, rotation, scale } of dice) {
      canvas.save();
      canvas.translate(x, y);
      canvas.rotate((rotation * Math.PI) / 180);
      canvas.scale(scale, scale);
      canvas.beginPath();
      for (const corner of corners) canvas.lineTo(corner.x, corner.y);
      canvas.closePath();
      canvas.shadowBlur = glow * radius * pixelsPerUnit;
      canvas.fillStyle = colors.fill;
      canvas.fill();
      canvas.shadowBlur = 0;
      canvas.stroke();
      canvas.fillStyle = colors.text;
      canvas.fillText("20", 0, 0);
      canvas.restore();
    }
  }

  return <CriticalScene {...props} fadeStart={FADE_START} start={start} />;
}
