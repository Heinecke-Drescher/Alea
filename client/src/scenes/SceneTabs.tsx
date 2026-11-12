import {
  ActionIcon,
  Button,
  Group,
  Menu,
  ScrollArea,
  Tabs,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconChevronDown,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useContextMenu } from "mantine-contextmenu";
import { useEffect, useRef, useState } from "react";
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
import { MapMenuItems } from "./MapMenuItems";
import { useMapActions } from "./useMapActions";

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

export function SceneTabs({ onMapImageSet }: { onMapImageSet: () => void }) {
  const room = useRoom();
  const dm = useDm();
  const { isDm } = usePlayer();
  const { showContextMenu } = useContextMenu();
  const scenes = useY(room.scenesMap);
  const activeId = useY(room.activeSceneMap)[ACTIVE_SCENE_KEY];
  const [editingId, setEditingId] = useState<string | null>(null);
  const tabs = visibleSceneTabs(scenes);
  const isOnlyScene = tabs[0] === ONLY_SCENE;
  const activeTabId = isOnlyScene ? ONLY_SCENE.id : (activeId ?? null);
  const strip = useRef<HTMLDivElement>(null);
  // Per tab, so a scene switch by someone else closes the menu instead of moving it.
  const [menuTabId, setMenuTabId] = useState<string | null>(null);
  const mapActions = useMapActions(onMapImageSet);

  // A new or switched-to scene may sit beyond the visible part of the strip.
  useEffect(() => {
    strip.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  // Players would see what the DM has prepared, so only the DM sees the scenes.
  if (dm !== null && !isDm) {
    return (
      <Menu position="bottom-start" shadow="md">
        <Menu.Target>
          <Button
            variant="subtle"
            color="gray"
            px="xs"
            rightSection={<IconChevronDown size={16} />}
          >
            Map
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <MapMenuItems actions={mapActions} />
        </Menu.Dropdown>
      </Menu>
    );
  }

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
    setMenuTabId(null);
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
    <Group gap={4} wrap="nowrap" miw={0}>
      {/* Many scenes scroll sideways instead of pushing the header into a second line. */}
      <ScrollArea
        scrollbars="x"
        scrollbarSize={4}
        miw={0}
        viewportRef={strip}
        viewportProps={{
          // A mouse wheel only scrolls up and down, which the strip turns sideways.
          onWheel: (event) => {
            if (event.deltaX === 0)
              event.currentTarget.scrollLeft += event.deltaY;
          },
        }}
      >
        <Tabs
          variant="pills"
          value={activeTabId}
          // Arrow keys only move the focus; switching changes the map for everyone.
          activateTabWithKeyboard={false}
          onChange={(id) => {
            const tab = tabs.find((scene) => scene.id === id);
            if (tab && !isOnlyScene) switchTo(tab);
          }}
        >
          {/* Room for the focus ring, which the scrolling strip would cut off. */}
          <Tabs.List p={4} style={{ flexWrap: "nowrap" }}>
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
                <Menu
                  key={tab.id}
                  opened={menuTabId === tab.id}
                  // A click on another tab switches to it; only the active tab opens the menu.
                  onChange={(isOpen) =>
                    setMenuTabId(
                      isOpen && tab.id === activeTabId ? tab.id : null,
                    )
                  }
                  position="bottom-start"
                  shadow="md"
                >
                  <Menu.Target>
                    <Tooltip
                      label="Click for the scene menu"
                      disabled={tab.id !== activeTabId || menuTabId === tab.id}
                    >
                      <Tabs.Tab
                        value={tab.id}
                        // Mantine gives its press effect to buttons, not tabs.
                        className="mantine-active"
                        c={tab.name === "" ? "dimmed" : undefined}
                        rightSection={
                          tab.id === activeTabId ? (
                            <IconChevronDown size={14} />
                          ) : undefined
                        }
                        onDoubleClick={() => startRenaming(tab)}
                        onContextMenu={
                          tab.id === activeTabId
                            ? (event) => {
                                event.preventDefault();
                                setMenuTabId(tab.id);
                              }
                            : showContextMenu([
                                {
                                  key: "rename",
                                  title: "Rename",
                                  icon: <IconPencil size={16} />,
                                  onClick: () => startRenaming(tab),
                                },
                                {
                                  key: "delete",
                                  title: "Delete scene",
                                  icon: <IconTrash size={16} />,
                                  color: "red",
                                  onClick: () => confirmDelete(tab),
                                },
                              ])
                        }
                      >
                        {sceneName(tab)}
                      </Tabs.Tab>
                    </Tooltip>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <MapMenuItems
                      actions={mapActions}
                      scene={{
                        rename: () => startRenaming(tab),
                        deleteScene: () => confirmDelete(tab),
                        canDelete: tabs.length > 1,
                      }}
                    />
                  </Menu.Dropdown>
                </Menu>
              ),
            )}
          </Tabs.List>
        </Tabs>
      </ScrollArea>
      <Tooltip label="Add scene">
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Add scene"
          onClick={addScene}
        >
          <IconPlus size={18} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
