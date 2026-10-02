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
import { useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Link, useParams } from "react-router";
import * as Y from "yjs";
import { isValidRoomId } from "../../../shared/roomId";
import { Board } from "../board/Board";
import { MapError } from "../board/MapError";
import { DicePanel } from "../dice/DicePanel";
import { connectRoom, type Awareness } from "../room/connectRoom";
import { createRoom } from "../room/createRoom";
import { RoomContext } from "../room/RoomContext";
import { TokenPanel } from "../tokens/TokenPanel";
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
  const [room] = useState(() => createRoom(new Y.Doc()));
  const [awareness, setAwareness] = useState<Awareness | null>(null);
  const [asideOpened, { toggle: toggleAside }] = useDisclosure();
  const [isEditingName, { open: editName, close: stopEditingName }] =
    useDisclosure();
  const [playerName, setPlayerName] = useLocalStorage({
    key: "alea-player-name",
    defaultValue: "",
    getInitialValueInEffect: false,
  });
  const needsName = playerName === "";

  useEffect(() => {
    const connection = connectRoom(roomId, room.doc);
    // oxlint-disable-next-line react/set-state-in-effect -- the awareness only exists once the provider connects
    setAwareness(connection.awareness);
    return connection.disconnect;
  }, [roomId, room]);
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
              <Button variant="subtle" onClick={editName}>
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
            <Board awareness={awareness} playerName={playerName} />
          </ErrorBoundary>
        </AppShell.Main>
        <AppShell.Aside p="md">
          <Stack>
            <TokenPanel />
            <DicePanel playerName={playerName} />
          </Stack>
        </AppShell.Aside>
      </AppShell>
      <PlayerNameModal
        opened={needsName || isEditingName}
        currentName={playerName}
        onSave={(name) => {
          setPlayerName(name);
          stopEditingName();
        }}
        onCancel={needsName ? null : stopEditingName}
      />
    </RoomContext>
  );
}
