import type { RoomStore } from "./roomStore";

// Kept with the token images so that undo covers it; token image ids never take this name.
export const BACKGROUND_IMAGE_ID = "background";

export function createBackground({ imagesMap, undoManager }: RoomStore) {
  function setBackground(imageDataUrl: string) {
    undoManager.stopCapturing();
    imagesMap.set(BACKGROUND_IMAGE_ID, imageDataUrl);
  }

  function removeBackground() {
    undoManager.stopCapturing();
    imagesMap.delete(BACKGROUND_IMAGE_ID);
  }

  return { setBackground, removeBackground };
}
