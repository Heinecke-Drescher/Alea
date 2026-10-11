import {
  access,
  mkdir,
  readdir,
  readFile,
  rename,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { isValidRoomId } from "../shared/roomId.ts";

interface RoomLimits {
  maxBytes: number;
  maxRooms: number;
}

export function createRoomStorage(
  directory: string,
  { maxBytes, maxRooms }: RoomLimits,
) {
  const pendingByRoom = new Map<string, Promise<unknown>>();

  function fileFor(roomId: string) {
    // Room ids come from the URL, so they must never be able to escape the directory.
    if (!isValidRoomId(roomId)) throw new Error(`Invalid room id: ${roomId}`);
    return path.join(directory, `${roomId}.ydoc`);
  }

  function oneAtATime<T>(roomId: string, task: () => Promise<T>): Promise<T> {
    const previous = pendingByRoom.get(roomId) ?? Promise.resolve();
    const next = previous.then(task, task);
    pendingByRoom.set(roomId, next);
    const forget = () => {
      if (pendingByRoom.get(roomId) === next) pendingByRoom.delete(roomId);
    };
    void next.then(forget, forget);
    return next;
  }

  async function load(roomId: string): Promise<Uint8Array | null> {
    const file = fileFor(roomId);
    return oneAtATime(roomId, async () => {
      try {
        return await readFile(file);
      } catch (error) {
        if (isMissingFile(error)) return null;
        throw error;
      }
    });
  }

  async function save(roomId: string, state: Uint8Array) {
    const file = fileFor(roomId);
    if (state.byteLength > maxBytes) return false;
    return oneAtATime(roomId, async () => {
      const temporaryFile = `${file}.tmp`;
      await mkdir(directory, { recursive: true });
      if (!(await exists(file)) && (await countRooms()) >= maxRooms) {
        return false;
      }
      await writeFile(temporaryFile, state);
      await rename(temporaryFile, file);
      return true;
    });
  }

  async function countRooms() {
    const files = await readdir(directory);
    return files.filter((name) => name.endsWith(".ydoc")).length;
  }

  return { load, save };
}

async function exists(file: string) {
  try {
    await access(file);
    return true;
  } catch (error) {
    if (isMissingFile(error)) return false;
    throw error;
  }
}

function isMissingFile(error: unknown) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
