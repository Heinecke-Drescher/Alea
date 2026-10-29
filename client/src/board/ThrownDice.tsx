import { useMantineTheme } from "@mantine/core";
import type { Group as GroupNode } from "konva/lib/Group";
import type { Node } from "konva/lib/Node";
import type { Stage } from "konva/lib/Stage";
import type { Text as TextNode } from "konva/lib/shapes/Text";
import type { Vector2d } from "konva/lib/types";
import { Animation } from "konva/lib/Animation";
import { Easings, Tween } from "konva/lib/Tween";
import { useCallback, useEffect, useRef, useState } from "react";
import { Group, Line, Text } from "react-konva";
import { rollDie, type DieSides } from "../room/dice";
import { dieShape } from "../dice/dieShapes";
import {
  pathLength,
  pointAlong,
  ROLL_SECONDS,
  throwInDirection,
} from "../dice/throwPath";
import { tokenHits, type TokenHit } from "../dice/tokenHits";
import { CELL_SIZE, type MapBounds } from "../room/grid";
import { dieColors } from "../dice/dieColors";
import { rollColor, rollPath } from "../room/rolls";
import { useRoom } from "../room/RoomContext";
import { useY } from "../room/useY";
import { TOKEN_BODY_NAME } from "./tokens/tokenNodes";

const DIE_RADIUS = 42;
const FADE_SECONDS = 0.5;
const VISIBLE_MS = 3000;
const FLICKER_MS = 70;
const KNOCK_DISTANCE = CELL_SIZE;
const KNOCK_TURN = 35;
const KNOCK_SECONDS = 0.25;
const SETTLE_SECONDS = 0.8;
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

function pushAndReturn(
  node: Node,
  away: Record<string, number>,
  home: Record<string, number>,
) {
  let isBack = false;
  let back: Tween | undefined;
  const push = new Tween({
    node,
    duration: KNOCK_SECONDS,
    easing: Easings.EaseOut,
    ...away,
    onFinish: () => {
      back = new Tween({
        node,
        duration: SETTLE_SECONDS,
        easing: Easings.ElasticEaseOut,
        ...home,
        onFinish: () => {
          isBack = true;
        },
      });
      back.play();
    },
  });
  push.play();
  return () => {
    push.destroy();
    back?.destroy();
    if (!isBack) node.setAttrs(home);
  };
}

function knockToken(stage: Stage, { tokenId, direction }: TokenHit) {
  const token = stage.findOne<GroupNode>(`#${tokenId}`);
  // The token may have been removed since the throw.
  if (!token) return () => {};
  const body = token.findOne(`.${TOKEN_BODY_NAME}`);
  if (!body) throw new Error(`Token ${tokenId} has no body`);
  // Only the body moves, around its fixed place in the middle of the token,
  // so the token's own position stays with React and dragging.
  const middle = body.offsetX();
  return pushAndReturn(
    body,
    {
      x: middle + direction.x * KNOCK_DISTANCE,
      y: middle + direction.y * KNOCK_DISTANCE,
      rotation: direction.x < 0 ? -KNOCK_TURN : KNOCK_TURN,
    },
    { x: middle, y: middle, rotation: 0 },
  );
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
  const room = useRoom();
  const theme = useMantineTheme();
  const colors = dieColors(theme, color);
  // Clicked dice have no path; each viewer throws them from their own view in a random direction.
  // Fixed when the die appears, so later renders cannot restart the roll.
  const [rollingPath] = useState(
    () => path ?? randomThrow(position ?? viewCenter(), room.mapBounds()),
  );
  const [hits] = useState(() =>
    tokenHits(rollingPath, Array.from(room.tokensMap.values()), DIE_RADIUS),
  );
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
