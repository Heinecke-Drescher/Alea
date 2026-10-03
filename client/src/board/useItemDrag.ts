import type { KonvaEventObject, Node } from "konva/lib/Node";
import type { IRect, Vector2d } from "konva/lib/types";
import { useRef } from "react";
import { existing, type Items } from "../room/areaActions";
import type { Room } from "../room/createRoom";
import { CELL_SIZE } from "../room/grid";
import { cellOffset, NO_ITEMS, squaresBounds } from "./selection";

interface Drag {
  items: Items;
  start: Vector2d;
  // Tokens snap to whole cells, so then the drag keeps their bounds on the map.
  gridBounds: IRect | null;
  others: { node: Node; start: Vector2d }[];
}

export function useItemDrag(room: Room, selected: Items) {
  const drag = useRef<Drag | null>(null);

  function onlyItem(id: string): Items {
    if (room.strokesMap.has(id)) return { ...NO_ITEMS, strokes: [id] };
    if (room.tokensMap.has(id)) return { ...NO_ITEMS, tokens: [id] };
    throw new Error(`Dragged unknown item ${id}`);
  }

  function start(event: KonvaEventObject<DragEvent>) {
    const node = event.target;
    const stage = node.getStage();
    if (!stage) throw new Error("Dragged item is not on a stage");
    const id = node.id();
    const isSelection = Object.values(selected).some((ids) => ids.includes(id));
    const items = isSelection ? selected : onlyItem(id);
    // The same tokens that moveItems will move, also those whose image is missing.
    const tokens = existing(room.tokensMap, items.tokens);
    const ids = new Set(Object.values(items).flat());
    // Highlights carry the id of their item as name.
    const others = stage.find(
      (other: Node) =>
        other !== node && (ids.has(other.id()) || ids.has(other.name())),
    );
    drag.current = {
      items,
      start: node.position(),
      gridBounds: tokens.length > 0 ? squaresBounds(tokens) : null,
      others: others.map((other) => ({ node: other, start: other.position() })),
    };
  }

  function current() {
    if (!drag.current) throw new Error("No item drag in progress");
    return drag.current;
  }

  function offset(event: KonvaEventObject<DragEvent>) {
    const { start, gridBounds } = current();
    const node = event.target;
    const dx = node.x() - start.x;
    const dy = node.y() - start.y;
    if (!gridBounds) return { dx, dy };
    const cells = cellOffset(
      gridBounds,
      { x: gridBounds.x + dx, y: gridBounds.y + dy },
      room.mapBounds(),
    );
    return { dx: cells.dx * CELL_SIZE, dy: cells.dy * CELL_SIZE };
  }

  function placeAll(
    event: KonvaEventObject<DragEvent>,
    dx: number,
    dy: number,
  ) {
    const { start, others } = current();
    event.target.position({ x: start.x + dx, y: start.y + dy });
    for (const other of others) {
      other.node.position({ x: other.start.x + dx, y: other.start.y + dy });
    }
  }

  function move(event: KonvaEventObject<DragEvent>) {
    const { dx, dy } = offset(event);
    placeAll(event, dx, dy);
  }

  function end(event: KonvaEventObject<DragEvent>) {
    const { items } = current();
    const { dx, dy } = offset(event);
    // React draws the moved items from the room data, so the nodes go back first.
    placeAll(event, 0, 0);
    drag.current = null;
    room.moveItems(items, dx, dy);
  }

  return { start, move, end };
}
