import {
  AppShell,
  Badge,
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
import { DicePanel } from "../dice/DicePanel";
import {
  ShowCriticalContext,
  useCriticalRolls,
} from "../dice/useCriticalRolls";
import { MusicMenu } from "../music/MusicMenu";
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
          <AppShell
            header={{ height: 60 }}
            aside={{
              width: 320,
              breakpoint: "sm",
              collapsed: { mobile: !asideOpened },
            }}
          >
            <AppShell.Header>
              <Group h="100%" px="md" justify="space-between">
                <Group gap="sm">
                  <AleaMenu isSynced={isSynced} connection={connection} />
                  {isSynced && <SceneTabs />}
                  {connection === "disconnected" && (
                    <Badge color="red" variant="light">
                      Not connected. Changes are not saved yet.
                    </Badge>
                  )}
                </Group>
                <Group gap="xs">
                  {isSynced && !needsName && (
                    <DmControl awareness={awareness} />
                  )}
                  <MusicMenu />
                  <ColorSchemeToggle />
                  <Button variant="subtle" color={color} onClick={editName}>
                    {name}
                  </Button>
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
            </AppShell.Main>
            <AppShell.Aside>
              <AppShell.Section grow component={ScrollArea} p="md">
                <Stack>
                  <FocusTokenContext value={focusToken}>
                    <SelectedTokensContext value={selectedTokens}>
                      <TokenPanel />
                    </SelectedTokensContext>
                  </FocusTokenContext>
                  <DicePanel />
                </Stack>
              </AppShell.Section>
            </AppShell.Aside>
          </AppShell>
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
