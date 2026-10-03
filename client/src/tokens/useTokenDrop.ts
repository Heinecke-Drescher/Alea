import type { Stage as StageNode } from "konva/lib/Stage";
import type { DragEvent, RefObject } from "react";
import { dropPointOnMap } from "../board/dropPoint";
import {
  handleImageFile,
  imageFileRule,
  isImageFile,
  notifyFileError,
} from "../images/imageFiles";
import { cellAt, dropCells } from "../room/grid";
import { useRoom } from "../room/RoomContext";
import { addTokenFromFile, TOKEN_FILE_MEGABYTES } from "./addTokenFromFile";

function isFileDrag(dataTransfer: DataTransfer) {
  return dataTransfer.types.includes("Files");
}

export function useTokenDrop(stageRef: RefObject<StageNode | null>) {
  const room = useRoom();

  // Also stops the browser from opening an image dropped on the map.
  function allowFileDrop(event: DragEvent<HTMLElement>) {
    if (isFileDrag(event.dataTransfer)) event.preventDefault();
  }

  function addDroppedTokens(event: DragEvent<HTMLElement>) {
    if (!isFileDrag(event.dataTransfer)) return;
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const images = files.filter((file) =>
      isImageFile(file, TOKEN_FILE_MEGABYTES),
    );
    for (const file of files) {
      if (images.includes(file)) continue;
      notifyFileError(file, new Error(imageFileRule(TOKEN_FILE_MEGABYTES)));
    }
    const start = cellAt(dropPointOnMap(stageRef.current, event));
    const cells = dropCells(start, images.length, room.mapBounds());
    images.forEach((file, i) => {
      const cell = cells[i];
      if (!cell) throw new Error(`No cell for dropped image ${i}`);
      void handleImageFile(file, () => addTokenFromFile(room, file, cell));
    });
  }

  return { onDragOver: allowFileDrop, onDrop: addDroppedTokens };
}
