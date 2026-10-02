import { useMantineTheme } from "@mantine/core";
import type { Group as GroupNode } from "konva/lib/Group";
import type { Text as TextNode } from "konva/lib/shapes/Text";
import type { Vector2d } from "konva/lib/types";
import { Easings, Tween } from "konva/lib/Tween";
import { useCallback, useEffect, useRef, useState } from "react";
import { Group, Line, Text } from "react-konva";
import { rollDie, type DieSides } from "../../../shared/dice";
import { dieShape } from "../dice/dieShapes";
import { useRoom } from "../room/RoomContext";
import { useY } from "../room/useY";

const DIE_RADIUS = 28;
const ROLL_SECONDS = 1;
const FADE_SECONDS = 0.5;
const VISIBLE_MS = 3000;
const FLICKER_MS = 70;

interface ThrownDieProps {
  id: string;
  sides: DieSides;
  value: number;
  position: Vector2d | undefined;
  viewCenter: () => Vector2d;
  onDone: (id: string) => void;
}

function ThrownDie({
  id,
  sides,
  value,
  position,
  viewCenter,
  onDone,
}: ThrownDieProps) {
  const theme = useMantineTheme();
  // Clicked dice have no position; each viewer throws them into their own view, fixed when they appear.
  const [{ x, y }] = useState(() => position ?? viewCenter());
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
    const roll = new Tween({
      node: group,
      duration: ROLL_SECONDS,
      easing: Easings.BackEaseOut,
      x,
      y,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      onFinish: () => {
        clearInterval(flicker);
        text.text(String(value));
        fadeTimer = setTimeout(fadeOut, VISIBLE_MS);
      },
    });
    roll.play();
    return () => {
      clearInterval(flicker);
      clearTimeout(fadeTimer);
      roll.destroy();
      fade?.destroy();
    };
  }, [id, sides, value, x, y, onDone]);

  return (
    <Group
      ref={groupRef}
      x={x - 120}
      y={y - 160}
      rotation={-720}
      scaleX={0.3}
      scaleY={0.3}
      opacity={0}
    >
      <Line
        points={dieShape(sides, DIE_RADIUS)}
        closed
        fill={theme.colors.dark[6]}
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
        fontSize={sides === 100 ? 16 : 20}
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
      {rolls.map(({ id, sides, value, position }) =>
        !earlierRollIds.has(id) && !doneRollIds.has(id) ? (
          <ThrownDie
            key={id}
            id={id}
            sides={sides}
            value={value}
            position={position}
            viewCenter={viewCenter}
            onDone={markDone}
          />
        ) : null,
      )}
    </Group>
  );
}
