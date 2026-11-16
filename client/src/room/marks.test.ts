import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { CELL_SIZE } from "./grid";
import { createRoom, type Room } from "./createRoom";
import { MAX_MARK_LENGTH, MAX_MARKS, NEW_MARK, tokenMarks } from "./marks";
import type { Token } from "./roomStore";

const IMAGE = "data:image/webp;base64,AAAA";

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

function tokenOf(id: string | undefined) {
  const token = id && room.tokensMap.get(id);
  if (!token) throw new Error(`Expected token ${id}`);
  return token;
}

function onlyToken() {
  const [token] = room.tokensMap.values();
  if (!token) throw new Error("Expected a token");
  return token;
}

describe("marks", () => {
  const texts = () => tokenMarks(onlyToken()).map((mark) => mark.text);

  it("adds, changes and removes several marks", () => {
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    const { id } = onlyToken();
    expect(tokenMarks(onlyToken())).toEqual([]);
    room.addMark(id, { ...NEW_MARK, text: "Bloodied" });
    room.addMark(id, { ...NEW_MARK, text: "" });
    room.addMark(id, { ...NEW_MARK, text: "Target" });
    expect(texts()).toEqual(["Bloodied", "", "Target"]);
    room.changeMark(id, 1, { ...NEW_MARK, text: "Blessed" });
    expect(texts()).toEqual(["Bloodied", "Blessed", "Target"]);
    room.removeMark(id, 0);
    expect(texts()).toEqual(["Blessed", "Target"]);
    room.removeMark(id, 1);
    room.removeMark(id, 0);
    expect(onlyToken()).not.toHaveProperty("marks");
  });

  it("undoes each change in its own step", () => {
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    const { id } = onlyToken();
    room.addMark(id, { ...NEW_MARK, text: "Target" });
    room.changeMark(id, 0, { ...NEW_MARK, text: "Bloodied" });
    room.removeMark(id, 0);
    room.undoManager.undo();
    expect(texts()).toEqual(["Bloodied"]);
    room.undoManager.undo();
    expect(texts()).toEqual(["Target"]);
  });

  it("refuses a mark that is too long and more marks than allowed", () => {
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    const { id } = onlyToken();
    room.addMark(id, { ...NEW_MARK, text: "x".repeat(MAX_MARK_LENGTH) });
    expect(() =>
      room.addMark(id, { ...NEW_MARK, text: "x".repeat(MAX_MARK_LENGTH + 1) }),
    ).toThrow();
    expect(() =>
      room.changeMark(id, 0, {
        ...NEW_MARK,
        text: "x".repeat(MAX_MARK_LENGTH + 1),
      }),
    ).toThrow();
    for (let i = 1; i < MAX_MARKS; i++)
      room.addMark(id, { ...NEW_MARK, text: "" });
    expect(() => room.addMark(id, { ...NEW_MARK, text: "" })).toThrow();
    expect(texts()[0]).toBe("x".repeat(MAX_MARK_LENGTH));
    expect(texts()).toHaveLength(MAX_MARKS);
  });

  it("changes nothing when the mark was removed meanwhile", () => {
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    const { id } = onlyToken();
    room.addMark(id, { ...NEW_MARK, text: "Target" });
    room.changeMark(id, 1, { ...NEW_MARK, text: "Bloodied" });
    room.removeMark(id, 1);
    expect(texts()).toEqual(["Target"]);
  });

  it("reads only valid marks and their known fields from other players' data", () => {
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    const token = onlyToken();
    room.tokensMap.set(token.id, { ...token, marks: 3 } as unknown as Token);
    expect(tokenMarks(onlyToken())).toEqual([]);
    room.tokensMap.set(token.id, {
      ...token,
      marks: [
        { ...NEW_MARK, text: "x".repeat(MAX_MARK_LENGTH + 1) },
        { ...NEW_MARK, icon: "dragon" },
        { ...NEW_MARK, color: "red" },
        3,
        { ...NEW_MARK, text: "Target", extra: true },
      ],
    } as unknown as Token);
    expect(tokenMarks(onlyToken())).toEqual([{ ...NEW_MARK, text: "Target" }]);
  });

  it("keeps the marks of a duplicate and a pasted copy", () => {
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    const { id } = onlyToken();
    room.addMark(id, { ...NEW_MARK, text: "Target" });
    room.addMark(id, { ...NEW_MARK, text: "Blessed" });
    const marks = [
      { ...NEW_MARK, text: "Target" },
      { ...NEW_MARK, text: "Blessed" },
    ];
    expect(tokenMarks(tokenOf(room.duplicateToken(id)))).toEqual(marks);
    const clip = room.copyItems({ strokes: [], tokens: [id], texts: [] });
    const [pastedId] = room.paste(clip, 0, 5 * CELL_SIZE).tokens;
    expect(tokenMarks(tokenOf(pastedId))).toEqual(marks);
  });

  it("copies no marks onto an unmarked token", () => {
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    const copy = tokenOf(room.duplicateToken(onlyToken().id));
    expect(copy).not.toHaveProperty("marks");
  });

  it("ignores marks on tokens that no longer exist", () => {
    room.addMark("gone", { ...NEW_MARK, text: "Target" });
    room.changeMark("gone", 0, { ...NEW_MARK, text: "Target" });
    room.removeMark("gone", 0);
    expect(room.tokensMap.size).toBe(0);
  });
});
