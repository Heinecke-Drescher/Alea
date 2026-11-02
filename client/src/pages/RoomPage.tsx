import {
  AppShell,
  Badge,
  Box,
  Burger,
  Button,
  Center,
  Group,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure, useHotkeys } from "@mantine/hooks";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Link, useParams } from "react-router";
import { isValidRoomId } from "../../../shared/roomId";
import { Board, type BoardHandle } from "../board/Board";
import { MapError } from "../board/MapError";
import { DiceBar } from "../dice/DiceBar";
import { DicePanel } from "../dice/DicePanel";
import { DiceProvider } from "../dice/DiceProvider";
import {
  ShowCriticalContext,
  useCriticalRolls,
} from "../dice/useCriticalRolls";
import { MusicMenu } from "../music/MusicMenu";
import { MusicPanel } from "../music/MusicPanel";
import { RoomContext } from "../room/RoomContext";
import { PlayerContext } from "../player/PlayerContext";
import { recordVisit } from "../recentRooms/useRecentRooms";
import { useLocalPlayer } from "../player/useLocalPlayer";
import { useRoomConnection } from "../room/connection/useRoomConnection";
import { SceneTabs } from "../scenes/SceneTabs";
import { FocusTokenContext } from "../tokens/focusToken";
import { SelectedTokensContext } from "../tokens/selectedTokens";
import { TokenPanel } from "../tokens/TokenPanel";
import { undoStep } from "../undo/useUndo";
import { AleaMenu } from "./AleaMenu";
import { ColorSchemeToggle } from "./ColorSchemeToggle";
import { DmControl } from "./DmControl";
import { useNarrowPortrait, useWideLayout } from "../theme";
import { PlayerNameModal } from "./PlayerNameModal";

export function RoomPage() {
  const { roomId } = useParams();
  if (!roomId) throw new Error("Room page without room id");
  if (!isValidRoomId(roomId)) return <RoomNotFound />;
  return <RoomView key={roomId} roomId={roomId} />;
}

function RoomNotFound() {
  return (
    <Center h="100dvh">
      <Stack align="center">
        <Title order={2}>Room not found</Title>
        <Text c="dimmed">Check the link you were given.</Text>
        <Button component={Link} to="/">
          Go to start page
        </Button>
      </Stack>
    </Center>
  );
}

function RoomView({ roomId }: { roomId: string }) {
  const { room, awareness, isSynced, connection, isFull } =
    useRoomConnection(roomId);
  const [asideOpened, { toggle: toggleAside }] = useDisclosure();
  const [isEditingName, { open: editName, close: stopEditingName }] =
    useDisclosure();
  const localPlayer = useLocalPlayer();
  const { id, name, color } = localPlayer;
  const player = useMemo(() => ({ id, name, color }), [id, name, color]);
  const needsName = name === "";
  const criticals = useCriticalRolls(room, isSynced);
  const board = useRef<BoardHandle>(null);
  const [selectedTokens, setSelectedTokens] = useState<readonly string[]>([]);
  // Without a board, e.g. while the map shows an error, there is nothing to find.
  const focusToken = useCallback(
    (tokenId: string) => board.current?.focusToken(tokenId),
    [],
  );
  const alignMapImage = () => board.current?.alignMapImage();
  const isWide = useWideLayout();
  const hasDiceBar = useNarrowPortrait();
  // On a narrow screen they and the music move from the header into the side panel, which has
  // the room. Crossing the breakpoint loads the music player anew in its other place.
  const playerControls = (
    <>
      {isSynced && !needsName && <DmControl awareness={awareness} />}
      <ColorSchemeToggle />
      <Button variant="subtle" color={color} onClick={editName}>
        {name}
      </Button>
    </>
  );

  // Only rooms that really loaded are worth finding again.
  useEffect(() => {
    if (isSynced) recordVisit(roomId);
  }, [isSynced, roomId]);

  useHotkeys([
    ["mod+Z", () => undoStep(room.undo)],
    ["mod+Y", () => undoStep(room.redo)],
    ["mod+shift+Z", () => undoStep(room.redo)],
  ]);

  if (isFull) return <RoomFull />;

  return (
    <RoomContext value={room}>
      <PlayerContext value={player}>
        <ShowCriticalContext value={criticals.show}>
          <DiceProvider>
            <AppShell
              header={{ height: 60 }}
              aside={{
                width: 320,
                breakpoint: "sm",
                collapsed: { mobile: !asideOpened },
              }}
            >
              <AppShell.Header>
                <Group h="100%" px="md" justify="space-between" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap" flex={1} miw={0}>
                    <AleaMenu
                      isSynced={isSynced}
                      connection={connection}
                      onMapImageSet={alignMapImage}
                    />
                    {isSynced && <SceneTabs />}
                    {connection === "disconnected" && (
                      // Keeps its width, so the scene tabs give way and the warning stays readable.
                      <Badge
                        color="red"
                        variant="light"
                        style={{ flexShrink: 0 }}
                      >
                        {isWide
                          ? "Not connected. Changes are not saved yet."
                          : "Not connected"}
                      </Badge>
                    )}
                  </Group>
                  <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                    {isWide && (
                      <>
                        {playerControls}
                        <MusicMenu />
                      </>
                    )}
                    <Burger
                      opened={asideOpened}
                      onClick={toggleAside}
                      hiddenFrom="sm"
                      size="sm"
                    />
                  </Group>
                </Group>
              </AppShell.Header>
              <AppShell.Main>
                <Stack
                  gap={0}
                  h="calc(100dvh - var(--app-shell-header-height))"
                >
                  <Box flex={1} mih={0}>
                    <ErrorBoundary FallbackComponent={MapError}>
                      <Board
                        ref={board}
                        onSelectedTokensChange={setSelectedTokens}
                        awareness={awareness}
                        isSynced={isSynced}
                        critical={criticals.critical}
                        onCriticalDone={criticals.clear}
                      />
                    </ErrorBoundary>
                  </Box>
                  {hasDiceBar && <DiceBar />}
                </Stack>
              </AppShell.Main>
              <AppShell.Aside>
                <AppShell.Section grow component={ScrollArea} p="md">
                  <Stack>
                    {!isWide && <Group gap="xs">{playerControls}</Group>}
                    <FocusTokenContext value={focusToken}>
                      <SelectedTokensContext value={selectedTokens}>
                        <TokenPanel />
                      </SelectedTokensContext>
                    </FocusTokenContext>
                    {!hasDiceBar && <DicePanel />}
                    {!isWide && (
                      <Stack gap="xs">
                        <Title order={4}>Music</Title>
                        <MusicPanel />
                      </Stack>
                    )}
                  </Stack>
                </AppShell.Section>
              </AppShell.Aside>
            </AppShell>
          </DiceProvider>
          <PlayerNameModal
            opened={needsName || isEditingName}
            currentName={name}
            currentColor={localPlayer.pickedColor}
            onSave={(newName, newColor) => {
              localPlayer.setName(newName);
              localPlayer.setColor(newColor);
              stopEditingName();
            }}
            onCancel={needsName ? null : stopEditingName}
          />
        </ShowCriticalContext>
      </PlayerContext>
    </RoomContext>
  );
}

function RoomFull() {
  return (
    <Center h="100dvh">
      <Stack align="center">
        <Title order={2}>This room cannot be saved</Title>
        <Text c="dimmed" ta="center">
          The room or the server storage is full. Changes since the last save
          are lost.
        </Text>
        <Button onClick={() => location.reload()}>
          Reload the last saved state
        </Button>
      </Stack>
    </Center>
  );
}
