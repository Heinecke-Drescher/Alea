import { useMantineTheme } from "@mantine/core";
import { Animation } from "konva/lib/Animation";
import type { Group as GroupNode } from "konva/lib/Group";
import type { Text as TextNode } from "konva/lib/shapes/Text";
import type { Vector2d } from "konva/lib/types";
import { Tween } from "konva/lib/Tween";
import { useEffect, useRef, useState } from "react";
import { Group, Line, Text } from "react-konva";
import { dieColors } from "../../dice/dieColors";
import { dieShape } from "../../dice/dieShapes";
import {
  pathLength,
  pointAlong,
  ROLL_SECONDS,
  throwInDirection,
} from "./throwPath";
import { tokenHits } from "./tokenHits";
import { rollDie } from "../../room/dice";
import { CELL_SIZE, type MapBounds } from "../../room/grid";
import { rollColor, rollPath } from "../../room/rolls";
import { useRoom } from "../../room/RoomContext";
import type { Roll } from "../../room/roomStore";
import { knockToken } from "./knockToken";

const DIE_RADIUS = 42;
const FADE_SECONDS = 0.5;
const VISIBLE_MS = 3000;
const FLICKER_MS = 70;
const CLICK_THROW_MIN_CELLS = 2;
const CLICK_THROW_MAX_CELLS = 5;

function randomThrow(start: Vector2d, bounds: MapBounds) {
  const angle = Math.random() * 2 * Math.PI;
  const cells =
    CLICK_THROW_MIN_CELLS +
    Math.random() * (CLICK_THROW_MAX_CELLS - CLICK_THROW_MIN_CELLS);
  return throwInDirection(start, angle, cells * CELL_SIZE, bounds);
}

function atPathStart(path: number[]) {
  return {
    ...pointAlong(path, 0),
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
  };
}

function easeOut(progress: number) {
  return 1 - (1 - progress) ** 3;
}

function rollAlong(
  group: GroupNode,
  path: number[],
  onTravelled: (distance: number) => void,
  onLanded: () => void,
) {
  const layer = group.getLayer();
  if (!layer) throw new Error("Thrown die is not on a layer");
  const length = pathLength(path);
  // Rolling turns a die by its distance over its radius; rounding to whole turns
  // makes it stop upright, so the number is easy to read.
  const turns =
    length === 0
      ? 0
      : Math.max(1, Math.round(length / DIE_RADIUS / (2 * Math.PI)));
  const animation = new Animation((frame) => {
    const progress = Math.min(frame.time / (ROLL_SECONDS * 1000), 1);
    const travelled = easeOut(progress) * length;
    group.position(pointAlong(path, travelled));
    group.rotation(easeOut(progress) * turns * 360);
    onTravelled(travelled);
    if (progress === 1) {
      animation.stop();
      onLanded();
    }
  }, layer);
  animation.start();
  return () => animation.stop();
}

interface ThrownDieProps {
  roll: Roll;
  viewCenter: () => Vector2d;
  landings: Map<string, Vector2d>;
  onDone: (id: string) => void;
}

export function ThrownDie({
  roll,
  viewCenter,
  landings,
  onDone,
}: ThrownDieProps) {
  const { id, sides, value } = roll;
  const room = useRoom();
  const theme = useMantineTheme();
  const colors = dieColors(theme, rollColor(roll));
  // Clicked dice have no path; each viewer throws them from their own view in a random direction.
  // Fixed when the die appears, so later renders cannot restart the roll.
  const [rollingPath] = useState(
    () =>
      rollPath(roll) ??
      randomThrow(roll.position ?? viewCenter(), room.mapBounds()),
  );
  const [hits] = useState(() =>
    tokenHits(rollingPath, Array.from(room.tokensMap.values()), DIE_RADIUS),
  );
  const groupRef = useRef<GroupNode>(null);
  const textRef = useRef<TextNode>(null);

  // Known as soon as the path is, so a natural 20 can burst from there.
  useEffect(() => {
    landings.set(id, pointAlong(rollingPath, pathLength(rollingPath)));
    return () => {
      landings.delete(id);
    };
  }, [landings, id, rollingPath]);

  useEffect(() => {
    const group = groupRef.current;
    const text = textRef.current;
    if (!group || !text) throw new Error("Thrown die is not mounted");
    const flicker = setInterval(
      () => text.text(String(rollDie(sides))),
      FLICKER_MS,
    );
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    let fade: Tween | undefined;
    // Created only after landing: a tween records its start values when created,
    // and the roll would otherwise take over the opacity.
    const fadeOut = () => {
      fade = new Tween({
        node: group,
        duration: FADE_SECONDS,
        opacity: 0,
        onFinish: () => onDone(id),
      });
      fade.play();
    };
    const land = () => {
      clearInterval(flicker);
      text.text(String(value));
      fadeTimer = setTimeout(fadeOut, VISIBLE_MS);
    };
    const stage = group.getStage();
    if (!stage) throw new Error("Thrown die is not on a stage");
    const waitingHits = [...hits];
    const stopKnocks: (() => void)[] = [];
    const knockReached = (travelled: number) => {
      for (const hit of waitingHits.filter((h) => h.distance <= travelled)) {
        waitingHits.splice(waitingHits.indexOf(hit), 1);
        stopKnocks.push(knockToken(stage, hit));
      }
    };
    const stopRolling = rollAlong(group, rollingPath, knockReached, land);
    return () => {
      clearInterval(flicker);
      clearTimeout(fadeTimer);
      stopRolling();
      fade?.destroy();
      for (const stopKnock of stopKnocks) stopKnock();
    };
  }, [id, sides, value, rollingPath, hits, onDone]);

  return (
    <Group ref={groupRef} {...atPathStart(rollingPath)}>
      <Line
        points={dieShape(sides, DIE_RADIUS)}
        closed
        fill={colors.fill}
        stroke="white"
        strokeWidth={2}
        lineJoin="round"
      />
      <Text
        ref={textRef}
        x={-DIE_RADIUS}
        y={-DIE_RADIUS}
        width={DIE_RADIUS * 2}
        height={DIE_RADIUS * 2}
        align="center"
        verticalAlign="middle"
        fontSize={DIE_RADIUS * (sides === 100 ? 0.55 : 0.7)}
        fontStyle="bold"
        fill={colors.text}
      />
    </Group>
  );
}
