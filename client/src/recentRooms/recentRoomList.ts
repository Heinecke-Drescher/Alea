import { isValidRoomId } from "../../../shared/roomId";

export interface RecentRoom {
  id: string;
  number: number;
  visitedAt: number;
}

export interface RecentRooms {
  // Removed rooms keep their number, so it is never given out again.
  nextNumber: number;
  rooms: RecentRoom[];
}

export const NO_RECENT_ROOMS: RecentRooms = { nextNumber: 1, rooms: [] };
export const MAX_RECENT_ROOMS = 20;

export function visitRoom(
  { nextNumber, rooms }: RecentRooms,
  id: string,
  now: number,
): RecentRooms {
  const known = rooms.find((room) => room.id === id);
  const number = known ? known.number : nextNumber;
  const others = rooms.filter((room) => room.id !== id);
  return {
    nextNumber: known ? nextNumber : nextNumber + 1,
    rooms: [{ id, number, visitedAt: now }, ...others].slice(
      0,
      MAX_RECENT_ROOMS,
    ),
  };
}

export function removeRoom(recent: RecentRooms, id: string): RecentRooms {
  return {
    ...recent,
    rooms: recent.rooms.filter((room) => room.id !== id),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// The largest time a JavaScript date can hold; later ones cannot be formatted.
const MAX_TIME = 8.64e15;

function isCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 1;
}

function isRecentRoom(value: unknown): value is RecentRoom {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isValidRoomId(value.id) &&
    isCount(value.number) &&
    typeof value.visitedAt === "number" &&
    value.visitedAt >= 0 &&
    value.visitedAt <= MAX_TIME
  );
}

function firstOfEachId(room: RecentRoom, index: number, rooms: RecentRoom[]) {
  return rooms.findIndex((other) => other.id === room.id) === index;
}

export function parseRecentRooms(json: string | undefined): RecentRooms {
  if (json === undefined) return NO_RECENT_ROOMS;
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    // The list lives only in this browser; broken data just starts a new one.
    return NO_RECENT_ROOMS;
  }
  if (!isRecord(value) || !Array.isArray(value.rooms)) return NO_RECENT_ROOMS;
  const rooms = value.rooms
    .filter(isRecentRoom)
    .filter(firstOfEachId)
    .slice(0, MAX_RECENT_ROOMS);
  const stored = isCount(value.nextNumber) ? value.nextNumber : 1;
  const highest = Math.max(0, ...rooms.map((room) => room.number));
  return { nextNumber: Math.max(stored, highest + 1), rooms };
}
