import * as Y from "yjs";
import { MAX_ROOM_BYTES } from "../../../shared/roomLimits";
import { createRoomStore, type RoomStore } from "./roomStore";

// A little below what the server saves, so players adding at the same moment and small
// differences in measuring do not overfill the room.
export const ROOM_SPACE_BYTES = 0.95 * MAX_ROOM_BYTES;

export class RoomSpaceError extends Error {}

export function megabytes(bytes: number) {
  return (bytes / 1024 ** 2).toFixed(1);
}

// Measured on a copy: undo keeps deleted content in a document, but the server drops it.
export function storedBytes(doc: Y.Doc) {
  const copy = new Y.Doc();
  Y.applyUpdate(copy, Y.encodeStateAsUpdate(doc));
  return Y.encodeStateAsUpdate(copy).byteLength;
}

// Tried on a copy first, so a change that would overfill the room never reaches the server,
// which would disconnect everyone.
export function storedBytesAfter(
  doc: Y.Doc,
  change: (copy: RoomStore) => void,
) {
  const copy = new Y.Doc();
  Y.applyUpdate(copy, Y.encodeStateAsUpdate(doc));
  change(createRoomStore(copy));
  return storedBytes(copy);
}

// Throws a message for the player, so a full room shows up before the server refuses to save it.
export function assertSpace(doc: Y.Doc, addedBytes: number, what: string) {
  const used = storedBytes(doc);
  if (used + addedBytes <= ROOM_SPACE_BYTES) return;
  throw new RoomSpaceError(
    `Not enough space in this room for ${what} (${megabytes(used)} of ${megabytes(ROOM_SPACE_BYTES)} MB used). Remove other images first.`,
  );
}

export function createRoomSpace({ doc, imagesMap, undoManager }: RoomStore) {
  function assertSpaceForImage(image: string, replacedImageId?: string) {
    const replaced =
      replacedImageId === undefined
        ? 0
        : (imagesMap.get(replacedImageId)?.length ?? 0);
    assertSpace(doc, image.length - replaced, "this image");
  }

  // Y.UndoManager has no dry run, so a step that would overfill the room is taken back at
  // once, before the server saves. Steps that shrink the room always go through.
  function stepWithin(step: () => unknown, reverse: () => unknown) {
    const before = storedBytes(doc);
    if (!step()) return;
    const after = storedBytes(doc);
    if (after <= ROOM_SPACE_BYTES || after <= before) return;
    reverse();
    throw new RoomSpaceError(
      "Not enough space in this room to bring this back. Remove other images first.",
    );
  }

  function undo() {
    stepWithin(
      () => undoManager.undo(),
      () => undoManager.redo(),
    );
  }

  function redo() {
    stepWithin(
      () => undoManager.redo(),
      () => undoManager.undo(),
    );
  }

  return { assertSpaceForImage, undo, redo };
}
