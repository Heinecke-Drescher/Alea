import {
  AppShell,
  Burger,
  Button,
  Center,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure, useHotkeys, useLocalStorage } from "@mantine/hooks";
import { useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Link, useParams } from "react-router";
import { isValidRoomId } from "../../../shared/roomId";
import { BackgroundPanel } from "../background/BackgroundPanel";
import { Board } from "../board/Board";
import { MapError } from "../board/MapError";
import { DicePanel } from "../dice/DicePanel";
import { MusicMenu } from "../music/MusicMenu";
import { RoomContext } from "../room/RoomContext";
import { defaultPlayerColor, isPlayerColor } from "../room/playerColors";
import { localPlayerId } from "../room/playerId";
import { useRoomConnection } from "../room/useRoomConnection";
import { TokenPanel } from "../tokens/TokenPanel";
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
  const { room, awareness, isSynced } = useRoomConnection(roomId);
  const [asideOpened, { toggle: toggleAside }] = useDisclosure();
  const [isEditingName, { open: editName, close: stopEditingName }] =
    useDisclosure();
  const [playerName, setPlayerName] = useLocalStorage({
    key: "alea-player-name",
    defaultValue: "",
    getInitialValueInEffect: false,
  });
  const [storedColor, setStoredColor] = useLocalStorage({
    key: "alea-player-color",
    defaultValue: "",
    getInitialValueInEffect: false,
  });
  const pickedColor = isPlayerColor(storedColor) ? storedColor : null;
  const playerColor = pickedColor ?? defaultPlayerColor(playerName);
  const needsName = playerName === "";
  const [playerId] = useState(localPlayerId);

  useHotkeys([
    ["mod+Z", () => room.undoManager.undo()],
    ["mod+Y", () => room.undoManager.redo()],
    ["mod+shift+Z", () => room.undoManager.redo()],
  ]);

  return (
    <RoomContext value={room}>
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
            <Title order={3}>Alea</Title>
            <Group gap="xs">
              {isSynced && !needsName && (
                <DmControl
                  awareness={awareness}
                  playerId={playerId}
                  playerName={playerName}
                />
              )}
              <MusicMenu />
              <ColorSchemeToggle />
              <Button variant="subtle" color={playerColor} onClick={editName}>
                {playerName}
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
              awareness={awareness}
              playerId={playerId}
              playerName={playerName}
              playerColor={playerColor}
              isSynced={isSynced}
            />
          </ErrorBoundary>
        </AppShell.Main>
        <AppShell.Aside p="md">
          <Stack>
            <BackgroundPanel />
            <TokenPanel />
            <DicePanel
              playerId={playerId}
              playerName={playerName}
              playerColor={playerColor}
            />
          </Stack>
        </AppShell.Aside>
      </AppShell>
      <PlayerNameModal
        opened={needsName || isEditingName}
        currentName={playerName}
        currentColor={pickedColor}
        onSave={(name, color) => {
          setPlayerName(name);
          setStoredColor(color);
          stopEditingName();
        }}
        onCancel={needsName ? null : stopEditingName}
      />
    </RoomContext>
  );
}
