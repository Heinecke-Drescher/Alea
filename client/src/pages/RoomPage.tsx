import {
  AppShell,
  Badge,
  Box,
  Button,
  Center,
  Group,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure, useElementSize, useHotkeys } from "@mantine/hooks";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Link, useParams } from "react-router";
import { isValidRoomId } from "../../../shared/roomId";
import { Board, type BoardHandle } from "../board/Board";
import { MapError } from "../board/MapError";
import { DiceBar } from "../dice/DiceBar";
import { DicePanel } from "../dice/DicePanel";
import { DiceTray } from "../dice/DiceTray";
import { DiceProvider } from "../dice/DiceProvider";
import { ThrowDieContext } from "../dice/throwDie";
import type { ScreenSample } from "../useScreenDrag";
import type { DieSides } from "../room/dice";
import {
  ShowCriticalContext,
  useCriticalRolls,
} from "../dice/useCriticalRolls";
import { RoomContext } from "../room/RoomContext";
import { PlayerContext } from "../player/PlayerContext";
import { recordVisit } from "../recentRooms/useRecentRooms";
import { useLocalPlayer } from "../player/useLocalPlayer";
import { useRoomConnection } from "../room/connection/useRoomConnection";
import { SceneTabs } from "../scenes/SceneTabs";
import { DropTokenContext } from "../tokens/dropToken";
import { FocusTokenContext } from "../tokens/focusToken";
import { SelectedTokensContext } from "../tokens/selectedTokens";
import { TokenMenuContext } from "../tokens/tokenMenu";
import { TokenPanel } from "../tokens/TokenPanel";
import { undoStep } from "../undo/useUndo";
import { AleaMenu } from "./AleaMenu";
import { TokenDrawer } from "../tokens/TokenDrawer";
import { TokenSheet } from "../tokens/TokenSheet";
import { TOKENS_TOGGLE_SPACE, TokensToggle } from "../tokens/TokensToggle";
import { useNarrowPortrait, useWideLayout } from "../theme";
import { PlayerNameModal } from "./PlayerNameModal";

// The column of panels over the right edge of the map on wide screens.
const PANEL_COLUMN_WIDTH = 240;
const PANEL_COLUMN_RIGHT = 12;
const PANEL_GAP = 12;

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
  const [isTokensOpen, { toggle: toggleTokens }] = useDisclosure();
  const { ref: sheetRef, height: sheetHeight } = useElementSize();
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
  const openTokenMenu = useCallback(
    (tokenId: string, event: MouseEvent) =>
      board.current?.openTokenMenu(tokenId, event),
    [],
  );
  const dropToken = useCallback(
    (tokenId: string, point: { x: number; y: number }) =>
      board.current?.dropToken(tokenId, point),
    [],
  );
  const alignMapImage = () => board.current?.alignMapImage();
  // Without a board, e.g. while the map shows an error, there is no map to throw onto.
  const throwDie = (sides: DieSides, samples: ScreenSample[]) =>
    board.current?.throwDie(sides, samples);
  const isWide = useWideLayout();
  const hasDiceBar = useNarrowPortrait();
  const isSheetOpen = isTokensOpen && hasDiceBar;
  const tokenPanel = (
    <FocusTokenContext value={focusToken}>
      <TokenMenuContext value={openTokenMenu}>
        <SelectedTokensContext value={selectedTokens}>
          <DropTokenContext value={dropToken}>
            <TokenPanel />
          </DropTokenContext>
        </SelectedTokensContext>
      </TokenMenuContext>
    </FocusTokenContext>
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
            <ThrowDieContext value={throwDie}>
              <AppShell
                header={{ height: 60 }}
                aside={{
                  width: 320,
                  breakpoint: "sm",
                  // Wide screens show the tokens in a panel over the map, phones held upright in a sheet.
                  collapsed: {
                    mobile: !isTokensOpen || hasDiceBar,
                    desktop: true,
                  },
                }}
              >
                <AppShell.Header>
                  <Group h="100%" px="md" gap="sm" wrap="nowrap">
                    <AleaMenu
                      connection={connection}
                      awareness={awareness}
                      isSynced={isSynced}
                      onEditName={editName}
                    />
                    {/* Before the sync, an export would hold an empty map and an import would mix with the loaded one. */}
                    {isSynced && <SceneTabs onMapImageSet={alignMapImage} />}
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
                </AppShell.Header>
                <AppShell.Main>
                  <Stack
                    gap={0}
                    h="calc(100dvh - var(--app-shell-header-height))"
                  >
                    <Box flex={1} mih={0} pos="relative">
                      <ErrorBoundary FallbackComponent={MapError}>
                        <Board
                          ref={board}
                          onSelectedTokensChange={setSelectedTokens}
                          covered={{
                            right: isWide
                              ? PANEL_COLUMN_RIGHT +
                                PANEL_COLUMN_WIDTH +
                                PANEL_GAP
                              : 0,
                            bottom: isSheetOpen
                              ? TOKENS_TOGGLE_SPACE + sheetHeight
                              : 0,
                          }}
                          awareness={awareness}
                          isSynced={isSynced}
                          critical={criticals.critical}
                          onCriticalDone={criticals.clear}
                        />
                      </ErrorBoundary>
                      {hasDiceBar && (
                        <TokenSheet isOpen={isSheetOpen} ref={sheetRef}>
                          {tokenPanel}
                        </TokenSheet>
                      )}
                      {!isWide && (
                        <TokensToggle
                          isOpen={isTokensOpen}
                          onToggle={toggleTokens}
                        />
                      )}
                      {isWide && (
                        // Between the toolbar and the zoom buttons, so no panel covers another.
                        <Stack
                          pos="absolute"
                          top={68}
                          bottom={68}
                          right={PANEL_COLUMN_RIGHT}
                          w={PANEL_COLUMN_WIDTH}
                          gap={PANEL_GAP}
                          style={{ pointerEvents: "none", zIndex: 10 }}
                        >
                          <TokenDrawer>{tokenPanel}</TokenDrawer>
                          <DiceTray
                            mt="auto"
                            style={{ pointerEvents: "auto", flexShrink: 0 }}
                          />
                        </Stack>
                      )}
                    </Box>
                    {hasDiceBar && <DiceBar />}
                  </Stack>
                </AppShell.Main>
                <AppShell.Aside>
                  <AppShell.Section
                    grow
                    component={ScrollArea}
                    p="md"
                    // Keeps the end of the list clear of the toggle above the panel.
                    pb={TOKENS_TOGGLE_SPACE}
                  >
                    <Stack>
                      {!isWide && !hasDiceBar && (
                        <>
                          {tokenPanel}
                          <DicePanel />
                        </>
                      )}
                    </Stack>
                  </AppShell.Section>
                </AppShell.Aside>
              </AppShell>
            </ThrowDieContext>
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
