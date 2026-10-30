import { useHotkeys } from "@mantine/hooks";
import { Animation } from "konva/lib/Animation";
import type { Context } from "konva/lib/Context";
import type { Group as GroupNode } from "konva/lib/Group";
import type { IRect, Vector2d } from "konva/lib/types";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Group, Rect, Shape } from "react-konva";
import type { Critical } from "../../dice/criticalRoll";
import { ROLL_SECONDS } from "../../dice/throwPath";
import { mapRect } from "../../room/grid";
import { useRoom } from "../../room/RoomContext";
import { LEFT_MOUSE_BUTTON } from "../mouse";

const FADE_SECONDS = 0.5;
const DARKENING = 0.4;
// Far beyond any view, so a click anywhere ends the scene instead of using the active tool.
const CLICK_CATCHER_SIZE = 1e6;

export interface CriticalAnimation {
  // Seconds since the scene started, and since the last frame.
  update: (seconds: number, stepSeconds: number) => void;
  draw: (canvas: CanvasRenderingContext2D) => void;
}

export interface CriticalSceneProps {
  critical: Critical;
  landings: ReadonlyMap<string, Vector2d>;
  onDone: (id: string) => void;
}

interface Props extends CriticalSceneProps {
  // Seconds after the start at which the scene fades out.
  fadeStart: number;
  // Called once the map is darkened; the area is the whole map at that moment.
  start: (area: IRect, landed: Vector2d) => CriticalAnimation;
}

export function CriticalScene({
  critical,
  landings,
  onDone,
  fadeStart,
  start,
}: Props) {
  const room = useRoom();
  const groupRef = useRef<GroupNode>(null);
  const animation = useRef<CriticalAnimation | null>(null);
  const [area, setArea] = useState<IRect | null>(null);
  const { id, thrown } = critical;
  const startScene = useEffectEvent(start);

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
    if (!group || !layer) throw new Error("Critical scene is not mounted");
    const center = { x: area.x + area.width / 2, y: area.y + area.height / 2 };
    // Secret rolls are not on the map, and a thrown die can be gone, e.g. after the map
    // was reset or the roll was pushed out of the history; those start in the middle.
    const landed = (thrown && landings.get(id)) || center;
    const scene = startScene(area, landed);
    animation.current = scene;

    const frames = new Animation((frame) => {
      const seconds = frame.time / 1000;
      const opacity = Math.max(1 - (seconds - fadeStart) / FADE_SECONDS, 0);
      if (opacity === 0) {
        frames.stop();
        onDone(id);
        return;
      }
      scene.update(seconds, frame.timeDiff / 1000);
      group.opacity(opacity);
    }, layer);
    frames.start();
    return () => {
      frames.stop();
    };
  }, [area, id, thrown, landings, onDone, fadeStart]);

  function drawScene(context: Context) {
    animation.current?.draw(context._context);
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
