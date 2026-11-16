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

// How much the room on the server holds. A room measures its own document; a scene being
// prepared measures the shared room it is saved into.
export interface SpaceMeter {
  bytes(): number;
  // Tried on a copy first, so a change that would overfill the room never reaches the server,
  // which would disconnect everyone.
  bytesAfter(change: (copy: RoomStore) => void): number;
}

function copyOf(doc: Y.Doc) {
  const copy = new Y.Doc();
  Y.applyUpdate(copy, Y.encodeStateAsUpdate(doc));
  return copy;
}

// Measured on a copy: undo keeps deleted content in a document, but the server drops it.
function storedBytes(doc: Y.Doc) {
  return Y.encodeStateAsUpdate(copyOf(doc)).byteLength;
}

export function changedCopy(doc: Y.Doc, change: (copy: RoomStore) => void) {
  const copy = copyOf(doc);
  const store = createRoomStore(copy, docMeter(copy));
  change(store);
  return store;
}

export function docMeter(doc: Y.Doc): SpaceMeter {
  return {
    bytes: () => storedBytes(doc),
    bytesAfter: (change) => storedBytes(changedCopy(doc, change).doc),
  };
}

// Throws a message for the player, so a full room shows up before the server refuses to save it.
export function assertSpace(
  meter: SpaceMeter,
  addedBytes: number,
  what: string,
) {
  const used = meter.bytes();
  if (used + addedBytes <= ROOM_SPACE_BYTES) return;
  throw new RoomSpaceError(
    `Not enough space in this room for ${what} (${megabytes(used)} of ${megabytes(ROOM_SPACE_BYTES)} MB used). Remove other images first.`,
  );
}

export function assertRoomFits(bytes: number, what: string) {
  if (bytes <= ROOM_SPACE_BYTES) return;
  throw new RoomSpaceError(
    `With ${what} the room would need ${megabytes(bytes)} MB, but it can hold at most ${megabytes(ROOM_SPACE_BYTES)} MB. Use smaller or fewer images.`,
  );
}

export function createRoomSpace({ meter, imagesMap, undoManager }: RoomStore) {
  function assertSpaceForImage(image: string, replacedImageId?: string) {
    const replaced =
      replacedImageId === undefined
        ? 0
        : (imagesMap.get(replacedImageId)?.length ?? 0);
    assertSpace(meter, image.length - replaced, "this image");
  }

  function assertSpaceForImages(images: string[]) {
    const added = images.reduce((sum, image) => sum + image.length, 0);
    assertSpace(meter, added, "these images");
  }

  // Y.UndoManager has no dry run, so a step that would overfill the room is taken back at
  // once, before the server saves. Steps that shrink the room always go through.
  function stepWithin(step: () => unknown, reverse: () => unknown) {
    const before = meter.bytes();
    if (!step()) return;
    const after = meter.bytes();
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

  // Starts a new step, so what follows can be taken back on its own.
  function undoDepth() {
    undoManager.stopCapturing();
    return undoManager.undoStack.length;
  }

  // Redo is cleared even when the room is too full to take back everything, as it would
  // otherwise bring back what was only started.
  function undoBackTo(depth: number) {
    const steps = undoManager.undoStack.length - depth;
    if (steps <= 0) return;
    try {
      for (let step = 0; step < steps; step++) undo();
    } finally {
      undoManager.clear(false, true);
    }
  }

  return {
    assertSpaceForImage,
    assertSpaceForImages,
    undo,
    redo,
    undoDepth,
    undoBackTo,
  };
}
