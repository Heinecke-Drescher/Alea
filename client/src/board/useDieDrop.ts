import type { Stage as StageNode } from "konva/lib/Stage";
import { useRef, type DragEvent, type RefObject } from "react";
import { droppedDie, isDieDrag } from "../dice/dieDrag";
import type { ScreenSample } from "../dice/throwDie";
import {
  dragVelocity,
  SWING_WINDOW_MS,
  throwPath,
  type DragSample,
} from "./dice/throwPath";
import { usePlayer } from "../player/PlayerContext";
import { rollDie, type DieSides } from "../room/dice";
import { cellAt, containsCell } from "../room/grid";
import { useRoom } from "../room/RoomContext";
import { dropPointOnMap, screenPointOnMap } from "./dropPoint";

interface DieDropOptions {
  stageRef: RefObject<StageNode | null>;
}

export function useDieDrop({ stageRef }: DieDropOptions) {
  const room = useRoom();
  const player = usePlayer();
  const dragSamples = useRef<DragSample[]>([]);

  function trackDieDrag(event: DragEvent<HTMLElement>) {
    if (!isDieDrag(event.dataTransfer)) return;
    event.preventDefault();
    const time = event.timeStamp;
    dragSamples.current = [
      ...dragSamples.current.filter(
        (sample) => time - sample.time <= SWING_WINDOW_MS,
      ),
      { ...dropPointOnMap(stageRef.current, event), time },
    ];
  }

  // The last sample is where the die was let go; the ones before give the swing.
  function rollAlong(sides: DieSides, samples: DragSample[]) {
    const point = samples.at(-1);
    if (!point) throw new Error("Thrown die without a point");
    const bounds = room.mapBounds();
    const cell = cellAt(point);
    if (!containsCell(bounds, cell.x, cell.y)) return;
    const path = throwPath(point, dragVelocity(samples), bounds);
    const [x, y] = path.slice(-2);
    if (x === undefined || y === undefined) throw new Error("Empty throw path");
    room.addRoll(
      player.name,
      player.color,
      sides,
      rollDie(sides),
      { x, y },
      path,
    );
  }

  function rollDroppedDie(event: DragEvent<HTMLElement>) {
    const sides = droppedDie(event.dataTransfer);
    if (!sides) return;
    event.preventDefault();
    const point = dropPointOnMap(stageRef.current, event);
    const samples = [
      ...dragSamples.current,
      { ...point, time: event.timeStamp },
    ];
    dragSamples.current = [];
    rollAlong(sides, samples);
  }

  // A finger drags a die from the dice bar below the map, so its path comes in screen pixels.
  function rollFromScreen(sides: DieSides, samples: ScreenSample[]) {
    const stage = stageRef.current;
    if (!stage) throw new Error("Stage is not mounted");
    const release = samples.at(-1);
    if (!release) throw new Error("Thrown die without a point");
    // Letting go over the toolbar or a button above the map throws nothing.
    const target = document.elementFromPoint(release.x, release.y);
    if (!target || !stage.container().contains(target)) return;
    rollAlong(
      sides,
      samples.map(({ x, y, time }) => ({
        ...screenPointOnMap(stage, { x, y }),
        time,
      })),
    );
  }

  return { onDragOver: trackDieDrag, onDrop: rollDroppedDie, rollFromScreen };
}
