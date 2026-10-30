import { useMantineTheme } from "@mantine/core";
import { clamp } from "@mantine/hooks";
import type { IRect, Vector2d } from "konva/lib/types";
import { dieColors } from "../../dice/dieColors";
import { dieShape } from "../../dice/dieShapes";
import {
  CRACK_SECONDS,
  crackPoints,
  grownCrack,
  onePath,
  oneSpacing,
  stampedPlaces,
  STUMBLE_SECONDS,
  stumblePose,
  TOPPLE_SECONDS,
  toppleAngle,
  TOPPLED_SECONDS,
  topplePivot,
  TUMBLE_SECONDS,
  tumblePose,
  type DiePose,
} from "../../dice/natural1Tumble";
import { toPoints } from "../../room/points";
import {
  CriticalScene,
  type CriticalAnimation,
  type CriticalSceneProps,
} from "./CriticalScene";
import { drawSlogan } from "./drawSlogan";

const FAILED_AT = TUMBLE_SECONDS + STUMBLE_SECONDS;
const HOLD_SECONDS = 1;
const FADE_START = FAILED_AT + CRACK_SECONDS + TOPPLED_SECONDS + HOLD_SECONDS;
const SQUASH = 0.9;
const SQUASH_SECONDS = 0.1;
// Shares of a cell of the "1".
const DIE_SIZE = 0.45;
const STAMP_SIZE = 0.86;
const STAMP_CORNER = 0.15;
const STAMP_OPACITY = 0.6;
const OUTLINE_WIDTH = 0.05;
const CRACK_EDGE_WIDTH = 0.12;
const CRACK_WIDTH = 0.05;
const SLOGAN = "SKILL ISSUE";
const SLOGAN_SIZE = 0.8;
const SLOGAN_TILT = -8;
// The fallen "1" lies along the slogan, which rises by its tilt.
const LANDED_ANGLE = 90 + SLOGAN_TILT;

type DieColors = ReturnType<typeof dieColors>;

export function Natural1Scene(props: CriticalSceneProps) {
  const theme = useMantineTheme();
  const colors = dieColors(theme, props.critical.color);
  const gray = dieColors(theme, "gray");

  function start(area: IRect, landed: Vector2d): CriticalAnimation {
    const spacing = oneSpacing(area);
    const { trail, missed } = onePath(landed, spacing, area);
    const last = trail.at(-1);
    if (!last) throw new Error("The trail of the 1 is empty");
    const crack = crackPoints(trail, spacing);
    const pivot = topplePivot(trail, spacing);
    let seconds = 0;

    return {
      update(time) {
        seconds = time;
      },
      draw(canvas) {
        const stumbling = seconds - TUMBLE_SECONDS;
        const tumble = tumblePose(trail, seconds);
        const pose =
          stumbling < 0 ? tumble : stumblePose(last, missed, stumbling);
        const failed = seconds - FAILED_AT;
        const grown = failed < 0 ? [] : grownCrack(crack, failed);
        // Nothing is cracked before the crack begins.
        const front = grown.at(-1)?.y ?? Infinity;
        const toppling = failed - CRACK_SECONDS;
        const hit = toppling - TOPPLE_SECONDS;
        // Drawn first, so the fallen "1" lies on it.
        if (failed >= 0) {
          const size = spacing * SLOGAN_SIZE;
          drawSlogan(
            canvas,
            {
              text: SLOGAN,
              x: missed.x + spacing,
              y: missed.y - size / 2,
              align: 0,
              size,
              tilt: SLOGAN_TILT,
              fontFamily: theme.fontFamily,
              fill: hit < 0 ? "white" : theme.colors.gray[4],
              outline: hit < 0 ? colors.fill : gray.fill,
              squash: 1 - SQUASH * clamp(hit / SQUASH_SECONDS, 0, 1),
            },
            // Crushed letters stop swaying where they are.
            hit < 0 ? failed : failed - hit,
          );
        }
        canvas.save();
        canvas.translate(pivot.x, pivot.y);
        canvas.rotate((toppleAngle(toppling, LANDED_ANGLE) * Math.PI) / 180);
        canvas.translate(-pivot.x, -pivot.y);
        drawStamps(
          canvas,
          stampedPlaces(trail, tumble.reached),
          spacing,
          front,
        );
        drawCrack(canvas, grown, spacing);
        canvas.restore();
        drawDie(canvas, pose, spacing, failed >= 0 ? gray : colors);
      },
    };
  }

  // A stamp turns gray once the crack, growing upwards, has reached its bottom.
  function drawStamps(
    canvas: CanvasRenderingContext2D,
    places: Vector2d[],
    spacing: number,
    crackFront: number,
  ) {
    const size = spacing * STAMP_SIZE;
    canvas.save();
    canvas.globalAlpha = STAMP_OPACITY;
    for (const { x, y } of places) {
      canvas.fillStyle =
        y + spacing / 2 >= crackFront ? gray.fill : colors.fill;
      canvas.beginPath();
      canvas.roundRect(
        x - size / 2,
        y - size / 2,
        size,
        size,
        size * STAMP_CORNER,
      );
      canvas.fill();
    }
    canvas.restore();
  }

  function drawCrack(
    canvas: CanvasRenderingContext2D,
    points: Vector2d[],
    spacing: number,
  ) {
    if (points.length < 2) return;
    canvas.save();
    canvas.lineJoin = "round";
    canvas.lineCap = "round";
    canvas.beginPath();
    for (const { x, y } of points) canvas.lineTo(x, y);
    // A light edge first, so the dark crack shows on dark stamps too.
    canvas.lineWidth = spacing * CRACK_EDGE_WIDTH;
    canvas.strokeStyle = "rgba(255, 255, 255, 0.7)";
    canvas.stroke();
    canvas.lineWidth = spacing * CRACK_WIDTH;
    canvas.strokeStyle = "black";
    canvas.stroke();
    canvas.restore();
  }

  function drawDie(
    canvas: CanvasRenderingContext2D,
    { x, y, scaleX, scaleY }: DiePose,
    spacing: number,
    { fill, text }: DieColors,
  ) {
    const radius = spacing * DIE_SIZE;
    canvas.save();
    canvas.translate(x, y);
    canvas.scale(scaleX, scaleY);
    canvas.beginPath();
    for (const corner of toPoints(dieShape(20, radius))) {
      canvas.lineTo(corner.x, corner.y);
    }
    canvas.closePath();
    canvas.fillStyle = fill;
    canvas.fill();
    canvas.lineWidth = radius * OUTLINE_WIDTH;
    canvas.strokeStyle = "white";
    canvas.stroke();
    canvas.font = `bold ${radius * 0.7}px ${theme.fontFamily}`;
    canvas.textAlign = "center";
    canvas.textBaseline = "middle";
    canvas.fillStyle = text;
    canvas.fillText("1", 0, 0);
    canvas.restore();
  }

  return <CriticalScene {...props} fadeStart={FADE_START} start={start} />;
}
