import type { Stage as StageNode } from "konva/lib/Stage";
import { useRef, type DragEvent, type RefObject } from "react";
import { rollDie } from "../../../shared/dice";
import { cellAt, containsCell } from "../room/grid";
import type { PlayerColor } from "../room/playerColors";
import { useRoom } from "../room/RoomContext";
import { droppedDie, isDieDrag } from "./dieDrag";
import {
  dragVelocity,
  SWING_WINDOW_MS,
  throwPath,
  type DragSample,
} from "./throwPath";

interface DieDropOptions {
  stageRef: RefObject<StageNode | null>;
  playerName: string;
  playerColor: PlayerColor;
}

export function useDieDrop({
  stageRef,
  playerName,
  playerColor,
}: DieDropOptions) {
  const room = useRoom();
  const dragSamples = useRef<DragSample[]>([]);

  function dragPointOnMap(event: DragEvent<HTMLElement>) {
    const stage = stageRef.current;
    if (!stage) throw new Error("Stage is not mounted");
    stage.setPointersPositions(event.nativeEvent);
    const point = stage.getRelativePointerPosition();
    if (!point) throw new Error("Drag without stage pointer");
    return point;
  }

  function trackDieDrag(event: DragEvent<HTMLElement>) {
    if (!isDieDrag(event.dataTransfer)) return;
    event.preventDefault();
    const time = event.timeStamp;
    dragSamples.current = [
      ...dragSamples.current.filter(
        (sample) => time - sample.time <= SWING_WINDOW_MS,
      ),
      { ...dragPointOnMap(event), time },
    ];
  }

  function rollDroppedDie(event: DragEvent<HTMLElement>) {
    const sides = droppedDie(event.dataTransfer);
    if (!sides) return;
    event.preventDefault();
    const point = dragPointOnMap(event);
    const velocity = dragVelocity([
      ...dragSamples.current,
      { ...point, time: event.timeStamp },
    ]);
    dragSamples.current = [];
    const bounds = room.mapBounds();
    const cell = cellAt(point);
    if (!containsCell(bounds, cell.x, cell.y)) return;
    const path = throwPath(point, velocity, bounds);
    const [x, y] = path.slice(-2);
    if (x === undefined || y === undefined) throw new Error("Empty throw path");
    room.addRoll(
      playerName,
      playerColor,
      sides,
      rollDie(sides),
      { x, y },
      path,
    );
  }

  return { onDragOver: trackDieDrag, onDrop: rollDroppedDie };
}
