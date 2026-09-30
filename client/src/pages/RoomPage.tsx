import { AppShell, Burger, Button, Group, Stack, Title } from "@mantine/core";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useParams } from "react-router";
import * as Y from "yjs";
import { Board } from "../board/Board";
import { MapError } from "../board/MapError";
import { DicePanel } from "../dice/DicePanel";
import { connectRoom } from "../room/connectRoom";
import { createRoom } from "../room/createRoom";
import { RoomContext } from "../room/RoomContext";
import { TokenPanel } from "../tokens/TokenPanel";
import { PlayerNameModal } from "./PlayerNameModal";

export function RoomPage() {
  const { roomId } = useParams();
  if (!roomId) throw new Error("Room page without room id");
  return <RoomView key={roomId} roomId={roomId} />;
}

function RoomView({ roomId }: { roomId: string }) {
  const [room] = useState(() => createRoom(new Y.Doc()));
  const [asideOpened, { toggle: toggleAside }] = useDisclosure();
  const [isEditingName, { open: editName, close: stopEditingName }] =
    useDisclosure();
  const [playerName, setPlayerName] = useLocalStorage({
    key: "alea-player-name",
    defaultValue: "",
    getInitialValueInEffect: false,
  });
  const needsName = playerName === "";

  useEffect(() => connectRoom(roomId, room.doc), [roomId, room]);

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
            <Board />
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
