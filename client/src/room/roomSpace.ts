import * as Y from "yjs";
import { MAX_ROOM_BYTES } from "../../../shared/roomLimits";
import type { RoomStore } from "./roomStore";

export function megabytes(bytes: number) {
  return (bytes / 1024 ** 2).toFixed(1);
}

export function createRoomSpace({ doc, imagesMap }: RoomStore) {
  // Measured on a copy: undo keeps deleted images in this document, but the server drops them.
  function usedBytes() {
    const copy = new Y.Doc();
    Y.applyUpdate(copy, Y.encodeStateAsUpdate(doc));
    return Y.encodeStateAsUpdate(copy).byteLength;
  }

  // Throws a message for the player, so a full room shows up before the server refuses to save it.
  function assertSpaceForImage(image: string, replacedImageId?: string) {
    const used = usedBytes();
    const replaced =
      replacedImageId === undefined
        ? 0
        : (imagesMap.get(replacedImageId)?.length ?? 0);
    if (used - replaced + image.length <= MAX_ROOM_BYTES) return;
    throw new Error(
      `Not enough space in this room for this image (${megabytes(used)} of ${megabytes(MAX_ROOM_BYTES)} MB used). Remove other images first.`,
    );
  }

  return { assertSpaceForImage };
}
