import type { SceneTab } from "../room/scenes";

export function sceneName(tab: SceneTab) {
  return tab.name === "" ? "Unnamed" : tab.name;
}
