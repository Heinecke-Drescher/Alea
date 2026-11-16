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
import { notifyError } from "../notifyError";
import {
  IconChevronDown,
  IconCrown,
  IconEye,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useContextMenu } from "mantine-contextmenu";
import { useEffect, useRef, useState } from "react";
import { usePlayer } from "../player/PlayerContext";
import { useCanChangeMap } from "../player/useCanChangeMap";
import { useDm } from "../room/useDm";
import { useSharedRoom } from "../room/RoomContext";
import { useY } from "../room/useY";
import {
  ACTIVE_SCENE_KEY,
  ONLY_SCENE,
  sceneTab,
  visibleSceneTabs,
  type SceneTab,
} from "../room/scenes";
import { MapMenuItems } from "./MapMenuItems";
import { sceneName } from "./sceneName";
import { PRIVATE_OUTLINE } from "../theme";
import { useMapActions } from "./useMapActions";

function attempt(title: string, action: () => void) {
  try {
    action();
  } catch (error) {
    notifyError(title, error);
  }
}

// The name is written once at the end, so renaming is one undo step and Escape keeps the old name.
function SceneNameInput({
  name,
  onDone,
}: {
  name: string;
  onDone: (name: string | null) => void;
}) {
  const [draft, setDraft] = useState(name);
  const isCancelled = useRef(false);

  return (
    <TextInput
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => onDone(isCancelled.current ? null : draft)}
      onKeyDown={(event) => {
        if (event.key === "Escape") isCancelled.current = true;
        if (event.key === "Enter" || event.key === "Escape") {
          event.currentTarget.blur();
        }
      }}
      aria-label="Scene name"
      size="xs"
      w={140}
      autoFocus
    />
  );
}

interface SceneTabsProps {
  preparedId: string | null;
  onPrepare: (id: string) => void;
  onLeavePreparation: () => void;
  onShowToPlayers: () => void;
  onMapImageSet: () => void;
}

// Clicking another scene prepares it where only this player sees it; it reaches the players
// only through "Show to players".
export function SceneTabs({
  preparedId,
  onPrepare,
  onLeavePreparation,
  onShowToPlayers,
  onMapImageSet,
}: SceneTabsProps) {
  const room = useSharedRoom();
  const canChangeMap = useCanChangeMap();
  const dm = useDm();
  const player = usePlayer();
  const { showContextMenu } = useContextMenu();
  const scenes = useY(room.scenesMap);
  const activeId = useY(room.activeSceneMap)[ACTIVE_SCENE_KEY];
  const [editingId, setEditingId] = useState<string | null>(null);
  const tabs = visibleSceneTabs(scenes);
  const isOnlyScene = tabs[0] === ONLY_SCENE;
  const activeTabId = isOnlyScene ? ONLY_SCENE.id : (activeId ?? null);
  const shownTabId = preparedId ?? activeTabId;
  const strip = useRef<HTMLDivElement>(null);
  // Per tab, so a scene switch by someone else closes the menu instead of moving it.
  const [menuTabId, setMenuTabId] = useState<string | null>(null);
  const mapActions = useMapActions(onMapImageSet);

  // A new or switched-to scene may sit beyond the visible part of the strip.
  useEffect(() => {
    strip.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [shownTabId]);

  // Players would see what the DM has prepared, so only the DM sees the scenes.
  if (!canChangeMap) {
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
          {/* Without it, a group without a DM would not find the scenes. */}
          {dm === null && player.name !== "" && (
            <>
              <Menu.Item
                leftSection={<IconCrown size={16} />}
                onClick={() =>
                  room.becomeDm({ playerId: player.id, name: player.name })
                }
              >
                Become DM to change scenes
              </Menu.Item>
              <Menu.Divider />
            </>
          )}
          <MapMenuItems actions={mapActions} />
        </Menu.Dropdown>
      </Menu>
    );
  }

  function prepare(tab: SceneTab) {
    attempt(`Could not open ${sceneName(tab)}`, () => onPrepare(tab.id));
  }

  function showToPlayers() {
    setMenuTabId(null);
    onShowToPlayers();
  }

  function addScene() {
    const id = room.addScene();
    const tab = sceneTab(id, room.scenesMap.get(id));
    if (!tab) throw new Error(`Added scene ${id} is missing`);
    prepare(tab);
  }

  function startRenaming(tab: SceneTab) {
    setMenuTabId(null);
    setEditingId(tab === ONLY_SCENE ? room.saveOnlyScene() : tab.id);
  }

  function rename(tab: SceneTab, name: string) {
    attempt(`Could not rename ${sceneName(tab)}`, () =>
      room.renameScene(tab.id, name),
    );
  }

  function confirmDelete(tab: SceneTab) {
    modals.openConfirmModal({
      title: "Delete scene",
      children: (
        <Text size="sm">Delete {sceneName(tab)} and everything on it?</Text>
      ),
      labels: { confirm: "Delete scene", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () =>
        attempt(`Could not delete ${sceneName(tab)}`, () =>
          room.deleteScene(tab.id),
        ),
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
          value={shownTabId}
          // Arrow keys only move the focus; switching changes the map for everyone.
          activateTabWithKeyboard={false}
          onChange={(id) => {
            const tab = tabs.find((scene) => scene.id === id);
            if (!tab || isOnlyScene) return;
            if (tab.id === activeTabId) onLeavePreparation();
            else prepare(tab);
          }}
        >
          {/* Room for the focus ring, which the scrolling strip would cut off. */}
          <Tabs.List p={4} style={{ flexWrap: "nowrap" }}>
            {tabs.map((tab) =>
              tab.id === editingId ? (
                <SceneNameInput
                  key={tab.id}
                  name={tab.name}
                  onDone={(name) => {
                    setEditingId(null);
                    if (name !== null) rename(tab, name);
                  }}
                />
              ) : (
                <Menu
                  key={tab.id}
                  opened={menuTabId === tab.id}
                  // A click on another tab shows it; only the shown tab opens the menu.
                  onChange={(isOpen) =>
                    setMenuTabId(
                      isOpen && tab.id === shownTabId ? tab.id : null,
                    )
                  }
                  position="bottom-start"
                  shadow="md"
                >
                  <Menu.Target>
                    <Tooltip
                      label={
                        tab.id === shownTabId
                          ? "Click for the scene menu"
                          : "Players see this scene. Click to go back to it."
                      }
                      disabled={
                        (tab.id !== shownTabId && tab.id !== activeTabId) ||
                        menuTabId === tab.id
                      }
                    >
                      <Tabs.Tab
                        value={tab.id}
                        // Mantine gives its press effect to buttons, not tabs.
                        className="mantine-active"
                        c={tab.name === "" ? "dimmed" : undefined}
                        style={
                          tab.id === preparedId
                            ? { outline: PRIVATE_OUTLINE, outlineOffset: 2 }
                            : undefined
                        }
                        leftSection={
                          tab.id === activeTabId && tabs.length > 1 ? (
                            // What the players see, so it stays recognizable while another scene is prepared.
                            <IconEye
                              size={14}
                              aria-label="Players see this scene"
                              color={
                                tab.id === shownTabId
                                  ? undefined
                                  : "var(--mantine-color-dimmed)"
                              }
                            />
                          ) : undefined
                        }
                        rightSection={
                          tab.id === shownTabId ? (
                            <IconChevronDown size={14} />
                          ) : undefined
                        }
                        onDoubleClick={() => startRenaming(tab)}
                        onContextMenu={
                          tab.id === shownTabId
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
                        ...(tab.id === preparedId && {
                          showToPlayers,
                        }),
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
