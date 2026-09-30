import { customAlphabet } from "nanoid";

// Lowercase only: case-insensitive file systems (Windows, macOS) would
// otherwise store "AbC" and "abc" in the same file.
export const createRoomId = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyz",
  12,
);

export function isValidRoomId(roomId: string) {
  return /^[0-9a-z]{12}$/.test(roomId);
}
