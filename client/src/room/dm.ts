import type { DungeonMaster, RoomStore } from "./roomStore";

export const DM_KEY = "dm";

// The DM entry comes from other players, so its shape is checked first.
export function validDm(value: unknown): DungeonMaster | null {
  if (typeof value !== "object" || value === null) return null;
  const { playerId, name } = value as Partial<DungeonMaster>;
  if (typeof playerId !== "string" || playerId === "") return null;
  if (typeof name !== "string") return null;
  return { playerId, name };
}

export function createDm({ rolesMap }: RoomStore) {
  function becomeDm(player: DungeonMaster) {
    rolesMap.set(DM_KEY, player);
  }

  function releaseDm(playerId: string) {
    if (validDm(rolesMap.get(DM_KEY))?.playerId !== playerId) {
      throw new Error("Only the DM can release the role");
    }
    rolesMap.delete(DM_KEY);
  }

  return { becomeDm, releaseDm };
}
