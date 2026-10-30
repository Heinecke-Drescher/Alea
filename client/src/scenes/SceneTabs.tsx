import {
  ActionIcon,
  Group,
  Tabs,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useContextMenu } from "mantine-contextmenu";
import { useState } from "react";
import { usePlayer } from "../player/PlayerContext";
import { useRoom } from "../room/RoomContext";
import { useDm } from "../room/useDm";
import { useY } from "../room/useY";
import {
  ACTIVE_SCENE_KEY,
  ONLY_SCENE,
  sceneTab,
  visibleSceneTabs,
  type SceneTab,
} from "../room/scenes";

function sceneName(tab: SceneTab) {
  return tab.name === "" ? "Unnamed" : tab.name;
}

function showSceneError(title: string, error: unknown) {
  notifications.show({
    color: "red",
    title,
    message: error instanceof Error ? error.message : String(error),
  });
}

export function SceneTabs() {
  const room = useRoom();
  const dm = useDm();
  const { isDm } = usePlayer();
  const { showContextMenu } = useContextMenu();
  const scenes = useY(room.scenesMap);
  const activeId = useY(room.activeSceneMap)[ACTIVE_SCENE_KEY];
  const [editingId, setEditingId] = useState<string | null>(null);
  const tabs = visibleSceneTabs(scenes);
  const isOnlyScene = tabs[0] === ONLY_SCENE;

  // Players would see what the DM has prepared, so only the DM sees the scenes.
  if (dm !== null && !isDm) return null;

  function switchTo(tab: SceneTab) {
    try {
      room.switchScene(tab.id);
    } catch (error) {
      showSceneError(`Could not switch to ${sceneName(tab)}`, error);
    }
  }

  function addScene() {
    const id = room.addScene();
    const tab = sceneTab(id, room.scenesMap.get(id));
    if (!tab) throw new Error(`Added scene ${id} is missing`);
    switchTo(tab);
  }

  function startRenaming(tab: SceneTab) {
    setEditingId(tab === ONLY_SCENE ? room.saveOnlyScene() : tab.id);
  }

  function confirmDelete(tab: SceneTab) {
    modals.openConfirmModal({
      title: "Delete scene",
      centered: true,
      children: (
        <Text size="sm">Delete {sceneName(tab)} and everything on it?</Text>
      ),
      labels: { confirm: "Delete scene", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        try {
          room.deleteScene(tab.id);
        } catch (error) {
          showSceneError(`Could not delete ${sceneName(tab)}`, error);
        }
      },
    });
  }

  return (
    <Group gap={4} wrap="nowrap">
      <Tabs
        variant="pills"
        value={isOnlyScene ? ONLY_SCENE.id : (activeId ?? null)}
        // Arrow keys only move the focus; switching changes the map for everyone.
        activateTabWithKeyboard={false}
        onChange={(id) => {
          const tab = tabs.find((scene) => scene.id === id);
          if (tab && !isOnlyScene) switchTo(tab);
        }}
      >
        <Tabs.List>
          {tabs.map((tab) =>
            tab.id === editingId ? (
              <TextInput
                key={tab.id}
                value={tab.name}
                onChange={(event) =>
                  room.renameScene(tab.id, event.target.value)
                }
                onBlur={() => setEditingId(null)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === "Escape") {
                    setEditingId(null);
                  }
                }}
                aria-label="Scene name"
                size="xs"
                w={140}
                autoFocus
              />
            ) : (
              <Tooltip
                key={tab.id}
                label="Double-click to rename, right-click to delete"
                openDelay={500}
              >
                <Tabs.Tab
                  value={tab.id}
                  c={tab.name === "" ? "dimmed" : undefined}
                  onDoubleClick={() => startRenaming(tab)}
                  onContextMenu={showContextMenu([
                    {
                      key: "delete",
                      title: "Delete scene…",
                      icon: <IconTrash size={16} />,
                      color: "red",
                      disabled: tabs.length === 1,
                      onClick: () => confirmDelete(tab),
                    },
                  ])}
                >
                  {sceneName(tab)}
                </Tabs.Tab>
              </Tooltip>
            ),
          )}
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
