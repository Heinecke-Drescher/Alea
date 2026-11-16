import { beforeEach, describe, expect, it } from "vitest";
import * as Y from "yjs";
import { createRoom, type Room } from "./createRoom";
import { tokenEffects } from "./effects";
import type { Token } from "./roomStore";
import { IMAGE, only, tokenOf } from "./testRoom";

let room: Room;

beforeEach(() => {
  room = createRoom(new Y.Doc());
});

function onlyToken() {
  return tokenOf(room, only(room.tokensMap.keys()));
}

describe("status effects", () => {
  it("toggles effects on and off", () => {
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    const { id } = onlyToken();
    room.toggleEffect(id, "unconscious");
    room.toggleEffect(id, "dead");
    expect(tokenEffects(onlyToken())).toEqual(["dead", "unconscious"]);
    room.toggleEffect(id, "dead");
    expect(tokenEffects(onlyToken())).toEqual(["unconscious"]);
  });

  it("undoes each toggle in its own step", () => {
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    const { id } = onlyToken();
    room.toggleEffect(id, "unconscious");
    room.toggleEffect(id, "dead");
    room.undoManager.undo();
    expect(tokenEffects(onlyToken())).toEqual(["unconscious"]);
  });

  it("reads only known effects from other players' data", () => {
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    const token = onlyToken();
    const foreign = { ...token, effects: ["dead", "flying", 3, "dead"] };
    room.tokensMap.set(token.id, foreign as unknown as Token);
    expect(tokenEffects(onlyToken())).toEqual(["dead"]);
    room.tokensMap.set(token.id, {
      ...token,
      effects: "dead",
    } as unknown as Token);
    expect(tokenEffects(onlyToken())).toEqual([]);
  });

  it("keeps the effects of a duplicate", () => {
    room.addToken("Goblin", IMAGE, { x: 0, y: 0 });
    const { id } = onlyToken();
    room.toggleEffect(id, "unconscious");
    const copy = tokenOf(room, room.duplicateToken(id));
    expect(tokenEffects(copy)).toEqual(["unconscious"]);
  });

  it("ignores effects on tokens that no longer exist", () => {
    room.toggleEffect("gone", "dead");
    expect(room.tokensMap.size).toBe(0);
  });
});
