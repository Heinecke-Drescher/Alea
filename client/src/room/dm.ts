import type { DungeonMaster, RoomStore } from "./roomStore";
import { isRecord } from "./typeGuards";

export const DM_KEY = "dm";

// The DM entry comes from other players, so its shape is checked first.
export function validDm(value: unknown): DungeonMaster | null {
  if (!isRecord(value)) return null;
  const { playerId, name } = value;
  if (typeof playerId !== "string" || playerId === "") return null;
  if (typeof name !== "string") return null;
  return { playerId, name };
}

export function createDm({ rolesMap }: RoomStore) {
  function becomeDm(player: DungeonMaster) {
    rolesMap.set(DM_KEY, player);
  }

  // Another player may have taken the role meanwhile; then it stays theirs.
  function becomeDmIfNone(player: DungeonMaster) {
    if (validDm(rolesMap.get(DM_KEY))) return;
    rolesMap.set(DM_KEY, player);
  }

  function releaseDm(playerId: string) {
    if (validDm(rolesMap.get(DM_KEY))?.playerId !== playerId) {
      throw new Error("Only the DM can release the role");
    }
    rolesMap.delete(DM_KEY);
  }

  return { becomeDm, becomeDmIfNone, releaseDm };
}
