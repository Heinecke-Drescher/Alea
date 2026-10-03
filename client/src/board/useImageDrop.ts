import { notifications } from "@mantine/notifications";
import type { Stage as StageNode } from "konva/lib/Stage";
import type { Vector2d } from "konva/lib/types";
import type { DragEvent, RefObject } from "react";
import {
  BACKGROUND_FILE_MEGABYTES,
  setBackgroundFromFile,
} from "../background/setBackgroundFromFile";
import { handleImageFile, validImages } from "../images/imageFiles";
import { cellAt, containsCell, dropCells } from "../room/grid";
import { useRoom } from "../room/RoomContext";
import {
  addTokenFromFile,
  TOKEN_FILE_MEGABYTES,
} from "../tokens/addTokenFromFile";
import { dropPointOnMap } from "./dropPoint";

function isFileDrag(dataTransfer: DataTransfer) {
  return dataTransfer.types.includes("Files");
}

// Images dropped on the map become tokens, images dropped beside it the background.
export function useImageDrop(stageRef: RefObject<StageNode | null>) {
  const room = useRoom();

  // Also stops the browser from opening an image dropped on the board.
  function allowFileDrop(event: DragEvent<HTMLElement>) {
    if (isFileDrag(event.dataTransfer)) event.preventDefault();
  }

  function addTokens(files: File[], start: Vector2d) {
    const images = validImages(files, TOKEN_FILE_MEGABYTES);
    const cells = dropCells(start, images.length, room.mapBounds());
    images.forEach((file, i) => {
      const cell = cells[i];
      if (!cell) throw new Error(`No cell for dropped image ${i}`);
      void handleImageFile(file, () => addTokenFromFile(room, file, cell));
    });
  }

  function setBackground(files: File[]) {
    const [image, ...ignored] = validImages(files, BACKGROUND_FILE_MEGABYTES);
    if (!image) return;
    void handleImageFile(image, async () => {
      await setBackgroundFromFile(room, image);
      if (ignored.length > 0) {
        notifications.show({
          message: "Only the first image became the background.",
        });
      }
    });
  }

  function addDroppedImages(event: DragEvent<HTMLElement>) {
    if (!isFileDrag(event.dataTransfer)) return;
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const cell = cellAt(dropPointOnMap(stageRef.current, event));
    if (containsCell(room.mapBounds(), cell.x, cell.y)) {
      addTokens(files, cell);
    } else {
      setBackground(files);
    }
  }

  return { onDragOver: allowFileDrop, onDrop: addDroppedImages };
}
