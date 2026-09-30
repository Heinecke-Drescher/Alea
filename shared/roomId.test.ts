import { describe, expect, it } from "vitest";
import { createRoomId, isValidRoomId } from "./roomId";

describe("room ids", () => {
  it("creates valid ids", () => {
    for (let i = 0; i < 100; i++) {
      expect(isValidRoomId(createRoomId())).toBe(true);
    }
  });

  it.each([
    "ABCDEFGHIJKL",
    "abc",
    "abcdefghijklm",
    "../escapeabc",
    "abc def ghij",
    "",
  ])("rejects %j", (roomId) => {
    expect(isValidRoomId(roomId)).toBe(false);
  });
});
