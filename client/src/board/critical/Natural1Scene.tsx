import { useMantineTheme } from "@mantine/core";
import type { IRect, Vector2d } from "konva/lib/types";
import { dieColors } from "../../dice/dieColors";
import { dieShape } from "../../dice/dieShapes";
import {
  onePath,
  oneSpacing,
  stampedPlaces,
  TUMBLE_SECONDS,
  tumblePose,
  type TumblePose,
} from "../../dice/natural1Tumble";
import { toPoints } from "../../room/points";
import {
  CriticalScene,
  type CriticalAnimation,
  type CriticalSceneProps,
} from "./CriticalScene";
import { drawSlogan } from "./drawSlogan";

const HOLD_SECONDS = 1.5;
const FADE_START = TUMBLE_SECONDS + HOLD_SECONDS;
// Shares of a cell of the "1".
const DIE_SIZE = 0.45;
const STAMP_SIZE = 0.86;
const STAMP_CORNER = 0.15;
const STAMP_OPACITY = 0.6;
const OUTLINE_WIDTH = 0.05;
const SLOGAN = "SKILL ISSUE";
const SLOGAN_SIZE = 0.8;
const SLOGAN_TILT = -8;

export function Natural1Scene(props: CriticalSceneProps) {
  const theme = useMantineTheme();
  const colors = dieColors(theme, props.critical.color);

  function start(area: IRect, landed: Vector2d): CriticalAnimation {
    const spacing = oneSpacing(area);
    const path = onePath(landed, spacing, area);
    const foot = path.at(-1);
    if (!foot) throw new Error("The path of the 1 is empty");
    let pose: TumblePose | null = null;
    let finished = -Infinity;

    return {
      update(seconds) {
        pose = tumblePose(path, seconds);
        finished = seconds - TUMBLE_SECONDS;
      },
      draw(canvas) {
        if (!pose) return;
        drawStamps(canvas, stampedPlaces(path, pose.reached), spacing);
        drawDie(canvas, pose, spacing);
        if (finished < 0) return;
        const size = spacing * SLOGAN_SIZE;
        drawSlogan(
          canvas,
          {
            text: SLOGAN,
            x: foot.x + spacing,
            y: foot.y - size / 2,
            align: 0,
            size,
            tilt: SLOGAN_TILT,
            fontFamily: theme.fontFamily,
            outline: colors.fill,
          },
          finished,
        );
      },
    };
  }

  function drawStamps(
    canvas: CanvasRenderingContext2D,
    places: Vector2d[],
    spacing: number,
  ) {
    const size = spacing * STAMP_SIZE;
    canvas.save();
    canvas.globalAlpha = STAMP_OPACITY;
    canvas.fillStyle = colors.fill;
    for (const { x, y } of places) {
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

  function drawDie(
    canvas: CanvasRenderingContext2D,
    { x, y, scaleX, scaleY }: TumblePose,
    spacing: number,
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
    canvas.fillStyle = colors.fill;
    canvas.fill();
    canvas.lineWidth = radius * OUTLINE_WIDTH;
    canvas.strokeStyle = "white";
    canvas.stroke();
    canvas.font = `bold ${radius * 0.7}px ${theme.fontFamily}`;
    canvas.textAlign = "center";
    canvas.textBaseline = "middle";
    canvas.fillStyle = colors.text;
    canvas.fillText("1", 0, 0);
    canvas.restore();
  }

  return <CriticalScene {...props} fadeStart={FADE_START} start={start} />;
}
