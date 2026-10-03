import { useMantineTheme } from "@mantine/core";
import type { Group as GroupNode } from "konva/lib/Group";
import type { Text as TextNode } from "konva/lib/shapes/Text";
import type { Vector2d } from "konva/lib/types";
import { Animation } from "konva/lib/Animation";
import { Easings, Tween } from "konva/lib/Tween";
import { useCallback, useEffect, useRef, useState } from "react";
import { Group, Line, Text } from "react-konva";
import { rollDie, type DieSides } from "../../../shared/dice";
import { dieShape } from "../dice/dieShapes";
import { pathLength, pointAlong } from "../dice/throwPath";
import { rollColor, rollPath } from "../room/rolls";
import { useRoom } from "../room/RoomContext";
import { useY } from "../room/useY";

const DIE_RADIUS = 42;
const ROLL_SECONDS = 1;
const FADE_SECONDS = 0.5;
const VISIBLE_MS = 3000;
const FLICKER_MS = 70;

function beforeFlyIn(x: number, y: number) {
  return {
    x: x - 120,
    y: y - 160,
    rotation: -720,
    scaleX: 0.3,
    scaleY: 0.3,
    opacity: 0,
  };
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

function flyIn(group: GroupNode, x: number, y: number, onLanded: () => void) {
  const tween = new Tween({
    node: group,
    duration: ROLL_SECONDS,
    easing: Easings.BackEaseOut,
    x,
    y,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    onFinish: onLanded,
  });
  tween.play();
  return () => tween.destroy();
}

function easeOut(progress: number) {
  return 1 - (1 - progress) ** 3;
}

function rollAlong(group: GroupNode, path: number[], onLanded: () => void) {
  const layer = group.getLayer();
  if (!layer) throw new Error("Thrown die is not on a layer");
  const length = pathLength(path);
  const animation = new Animation((frame) => {
    const progress = Math.min(frame.time / (ROLL_SECONDS * 1000), 1);
    const travelled = easeOut(progress) * length;
    group.position(pointAlong(path, travelled));
    // A die rolling without slipping turns by its travelled distance over its radius.
    group.rotation(((travelled / DIE_RADIUS) * 180) / Math.PI);
    if (progress === 1) {
      animation.stop();
      onLanded();
    }
  }, layer);
  animation.start();
  return () => animation.stop();
}

interface ThrownDieProps {
  id: string;
  sides: DieSides;
  value: number;
  color: ReturnType<typeof rollColor>;
  position: Vector2d | undefined;
  path: number[] | null;
  viewCenter: () => Vector2d;
  onDone: (id: string) => void;
}

function ThrownDie({
  id,
  sides,
  value,
  color,
  position,
  path,
  viewCenter,
  onDone,
}: ThrownDieProps) {
  const theme = useMantineTheme();
  // Clicked dice have no position; each viewer throws them into their own view.
  // Both are fixed when the die appears, so later renders cannot restart the roll.
  const [{ x, y }] = useState(() => position ?? viewCenter());
  const [rollingPath] = useState(path);
  const groupRef = useRef<GroupNode>(null);
  const textRef = useRef<TextNode>(null);

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
    const stopRolling = rollingPath
      ? rollAlong(group, rollingPath, land)
      : flyIn(group, x, y, land);
    return () => {
      clearInterval(flicker);
      clearTimeout(fadeTimer);
      stopRolling();
      fade?.destroy();
    };
  }, [id, sides, value, x, y, rollingPath, onDone]);

  return (
    <Group
      ref={groupRef}
      {...(rollingPath ? atPathStart(rollingPath) : beforeFlyIn(x, y))}
    >
      <Line
        points={dieShape(sides, DIE_RADIUS)}
        closed
        fill={theme.colors[color][6]}
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
        fill="white"
      />
    </Group>
  );
}

// Mounted once the room is synced, so rolls loaded from the server are not thrown again.
export function ThrownDice({ viewCenter }: { viewCenter: () => Vector2d }) {
  const room = useRoom();
  const rolls = useY(room.rollsArray);
  const [earlierRollIds] = useState(
    () => new Set(room.rollsArray.toArray().map((roll) => roll.id)),
  );
  const [doneRollIds, setDoneRollIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const markDone = useCallback(
    (id: string) => setDoneRollIds((ids) => new Set(ids).add(id)),
    [],
  );

  return (
    <Group listening={false}>
      {rolls.map((roll) =>
        !earlierRollIds.has(roll.id) && !doneRollIds.has(roll.id) ? (
          <ThrownDie
            key={roll.id}
            id={roll.id}
            sides={roll.sides}
            value={roll.value}
            color={rollColor(roll)}
            position={roll.position}
            path={rollPath(roll)}
            viewCenter={viewCenter}
            onDone={markDone}
          />
        ) : null,
      )}
    </Group>
  );
}
