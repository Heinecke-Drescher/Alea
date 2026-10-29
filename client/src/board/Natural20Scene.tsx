import { useMantineTheme } from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import { Animation } from "konva/lib/Animation";
import type { Context } from "konva/lib/Context";
import type { Group as GroupNode } from "konva/lib/Group";
import type { IRect, Vector2d } from "konva/lib/types";
import { useEffect, useRef, useState } from "react";
import { Group, Rect, Shape } from "react-konva";
import type { Critical } from "../dice/criticalRoll";
import { dieColors } from "../dice/dieColors";
import { dieShape } from "../dice/dieShapes";
import {
  burstDice,
  catchDelays,
  GATHER_SECONDS,
  gatheredDie,
  moveBurstDie,
  twentySpacing,
  twentyTargets,
  type GatheredDie,
} from "../dice/natural20Burst";
import { mapRect } from "../room/grid";
import { toPoints } from "../room/points";
import { ROLL_SECONDS } from "../dice/throwPath";
import { useRoom } from "../room/RoomContext";
import { LEFT_MOUSE_BUTTON } from "./mouse";

const BURST_SECONDS = 1.2;
const HOLD_SECONDS = 1.5;
const FADE_SECONDS = 0.5;
const FADE_START = BURST_SECONDS + GATHER_SECONDS + HOLD_SECONDS;
const DARKENING = 0.4;
// Share of the spacing a die's radius takes, so neighbours in the number do not overlap.
const DIE_SIZE = 0.45;
const OUTLINE_WIDTH = 0.05;
// Far beyond any view, so a click anywhere ends the scene instead of using the active tool.
const CLICK_CATCHER_SIZE = 1e6;
const SLOGAN = "LET'S GO";
// It lands like a stamp: from large to its size within this time.
const STAMP_SECONDS = 0.2;
const STAMP_START_SCALE = 2.5;
const SLOGAN_TILT = -8;

interface Scene {
  center: Vector2d;
  spacing: number;
  dice: GatheredDie[];
  // 0 to 1; the finished number lights up once.
  glow: number;
  // Seconds since the number was finished, negative before.
  holding: number;
}

interface Natural20SceneProps {
  critical: Critical;
  landings: ReadonlyMap<string, Vector2d>;
  onDone: (id: string) => void;
}

export function Natural20Scene({
  critical,
  landings,
  onDone,
}: Natural20SceneProps) {
  const room = useRoom();
  const theme = useMantineTheme();
  const groupRef = useRef<GroupNode>(null);
  const scene = useRef<Scene | null>(null);
  // The whole map when the scene starts.
  const [area, setArea] = useState<IRect | null>(null);
  const { id, color, thrown } = critical;
  const colors = dieColors(theme, color);

  useHotkeys([["Escape", () => area && onDone(id)]]);

  useEffect(() => {
    const timer = setTimeout(
      () => setArea(mapRect(room.mapBounds())),
      // A thrown die lands first.
      thrown ? ROLL_SECONDS * 1000 : 0,
    );
    return () => clearTimeout(timer);
  }, [thrown, room]);

  useEffect(() => {
    if (!area) return;
    const group = groupRef.current;
    const layer = group?.getLayer();
    if (!group || !layer) throw new Error("Natural 20 scene is not mounted");
    const spacing = twentySpacing(area);
    const radius = spacing * DIE_SIZE;
    const center = { x: area.x + area.width / 2, y: area.y + area.height / 2 };
    // Secret rolls are not on the map, and a thrown die can be gone, e.g. after the map
    // was reset or the roll was pushed out of the history; those burst from the middle.
    const landed = (thrown && landings.get(id)) || center;
    let dice = burstDice(landed, twentyTargets(center, spacing), area, radius);
    let delays: number[] | null = null;

    const animation = new Animation((frame) => {
      const seconds = frame.time / 1000;
      const opacity = Math.max(1 - (seconds - FADE_START) / FADE_SECONDS, 0);
      if (opacity === 0) {
        animation.stop();
        onDone(id);
        return;
      }
      const gathering = seconds - BURST_SECONDS;
      if (gathering >= 0) delays ??= catchDelays(dice);
      // A die flies on until it is caught; then it stays as it was at that moment.
      const caughtAt = (i: number) => delays?.[i] ?? Infinity;
      dice = dice.map((die, i) =>
        gathering < caughtAt(i)
          ? moveBurstDie(die, frame.timeDiff / 1000, area, radius)
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
      scene.current = { center, spacing, dice: placed, glow, holding };
      group.opacity(opacity);
    }, layer);
    animation.start();
    return () => {
      animation.stop();
    };
  }, [area, id, thrown, landings, onDone]);

  function drawScene(context: Context) {
    if (!scene.current) return;
    const canvas = context._context;
    drawDice(canvas, scene.current);
    if (scene.current.holding >= 0) drawSlogan(canvas, scene.current);
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

  // Below the number, ending a little right of it.
  function drawSlogan(
    canvas: CanvasRenderingContext2D,
    { center, spacing, holding }: Scene,
  ) {
    const stamped = Math.min(holding / STAMP_SECONDS, 1);
    const scale = 1 + (STAMP_START_SCALE - 1) * (1 - stamped) ** 3;
    canvas.save();
    canvas.globalAlpha *= stamped;
    canvas.translate(center.x + 5.5 * spacing, center.y + 3.6 * spacing);
    canvas.rotate((SLOGAN_TILT * Math.PI) / 180);
    canvas.scale(scale, scale);
    canvas.font = `italic 900 ${spacing * 1.1}px ${theme.fontFamily}`;
    canvas.textAlign = "right";
    canvas.textBaseline = "top";
    canvas.lineJoin = "round";
    canvas.lineWidth = spacing * 0.15;
    canvas.strokeStyle = colors.fill;
    canvas.strokeText(SLOGAN, 0, 0);
    canvas.fillStyle = "white";
    canvas.fillText(SLOGAN, 0, 0);
    canvas.restore();
  }

  if (!area) return null;

  return (
    <Group ref={groupRef}>
      <Rect
        x={-CLICK_CATCHER_SIZE / 2}
        y={-CLICK_CATCHER_SIZE / 2}
        width={CLICK_CATCHER_SIZE}
        height={CLICK_CATCHER_SIZE}
        fill="transparent"
        onMouseDown={(event) => {
          // Other buttons pass through, so the view can still be panned.
          if (event.evt.button !== LEFT_MOUSE_BUTTON) return;
          event.cancelBubble = true;
          onDone(id);
        }}
      />
      <Rect {...area} fill="black" opacity={DARKENING} listening={false} />
      <Shape sceneFunc={drawScene} listening={false} />
    </Group>
  );
}
