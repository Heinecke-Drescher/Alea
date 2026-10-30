import { ActionIcon, Group, Tabs, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlus } from "@tabler/icons-react";
import { usePlayer } from "../player/PlayerContext";
import { useRoom } from "../room/RoomContext";
import { useDm } from "../room/useDm";
import { useY } from "../room/useY";
import {
  ACTIVE_SCENE_KEY,
  FIRST_SCENE_NAME,
  sceneTabs,
  type SceneTab,
} from "../room/scenes";

// A room without scene entries still has its map as its first scene.
const ONLY_SCENE: SceneTab = { id: "only", name: FIRST_SCENE_NAME, order: 0 };

export function SceneTabs() {
  const room = useRoom();
  const dm = useDm();
  const { isDm } = usePlayer();
  const scenes = useY(room.scenesMap);
  const activeId = useY(room.activeSceneMap)[ACTIVE_SCENE_KEY];
  const listed = sceneTabs(scenes);
  const tabs = listed.length > 0 ? listed : [ONLY_SCENE];

  // Players would see what the DM has prepared, so only the DM sees the scenes.
  if (dm !== null && !isDm) return null;

  function switchTo(tab: SceneTab) {
    try {
      room.switchScene(tab.id);
    } catch (error) {
      notifications.show({
        color: "red",
        title: `Could not switch to ${tab.name}`,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  function addScene() {
    const id = room.addScene();
    const tab = sceneTabs(room.scenesMap.toJSON()).find(
      (scene) => scene.id === id,
    );
    if (!tab) throw new Error(`Added scene ${id} is missing`);
    switchTo(tab);
  }

  return (
    <Group gap={4} wrap="nowrap">
      <Tabs
        variant="pills"
        value={listed.length > 0 ? (activeId ?? null) : ONLY_SCENE.id}
        // Arrow keys only move the focus; switching changes the map for everyone.
        activateTabWithKeyboard={false}
        onChange={(id) => {
          const tab = listed.find((scene) => scene.id === id);
          if (tab) switchTo(tab);
        }}
      >
        <Tabs.List>
          {tabs.map((tab) => (
            <Tabs.Tab key={tab.id} value={tab.id}>
              {tab.name}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>
      <Tooltip label="Add scene">
        <ActionIcon variant="subtle" aria-label="Add scene" onClick={addScene}>
          <IconPlus size={18} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
