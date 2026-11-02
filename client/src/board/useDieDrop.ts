import type { Stage as StageNode } from "konva/lib/Stage";
import type { RefObject } from "react";
import type { ScreenSample } from "../dice/throwDie";
import { dragVelocity, throwPath, type DragSample } from "./dice/throwPath";
import { usePlayer } from "../player/PlayerContext";
import { rollDie, type DieSides } from "../room/dice";
import { cellAt, containsCell } from "../room/grid";
import { useRoom } from "../room/RoomContext";
import { screenPointOnMap } from "./dropPoint";

interface DieDropOptions {
  stageRef: RefObject<StageNode | null>;
}

export function useDieDrop({ stageRef }: DieDropOptions) {
  const room = useRoom();
  const player = usePlayer();

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

  // A die is dragged from outside the map, so its path comes in screen pixels.
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

  return { rollFromScreen };
}
