import {
  AppShell,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  useDisclosure,
  useElementSize,
  useHotkeys,
  useMergedRef,
} from "@mantine/hooks";
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
import { TOOLBAR_SPACE } from "../board/Toolbar";
import { fittedAxisShift } from "../board/useBoardView";
import { DiceBar } from "../dice/DiceBar";
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
import { HoldTokensContext, type HeldToken } from "../tokens/holdTokens";
import { SelectedTokensContext } from "../tokens/selectedTokens";
import { TokenMenuContext } from "../tokens/tokenMenu";
import { DETAIL_WIDTH, TokenDetail } from "../tokens/TokenDetail";
import { TokenDetailContext } from "../tokens/tokenDetailControl";
import { TokenPanel } from "../tokens/TokenPanel";
import { undoStep } from "../undo/useUndo";
import { AleaMenu } from "./AleaMenu";
import { HideHeaderButton, ShowHeaderButton } from "./HeaderToggle";
import { useHeaderCollapsed } from "./useHeaderCollapsed";
import { TAB_WIDTH, TokenDrawer } from "../tokens/TokenDrawer";
import { SHEET_WIDTH, TokenSheet } from "../tokens/TokenSheet";
import { TOKENS_TOGGLE_SPACE, TokensToggle } from "../tokens/TokensToggle";
import { useWideLayout } from "../theme";
import {
  fitsBesideToolbar,
  PANEL_COLUMN_EDGE_GAP,
  PANEL_COLUMN_WIDTH,
  PANEL_GAP,
} from "./panelColumn";
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
  const [isTokensOpen, { toggle: toggleTokens, close: closeTokens }] =
    useDisclosure();
  const { ref: sheetSizeRef, height: sheetHeight } = useElementSize();
  // The sheet on phones or the drawer on wide screens.
  const [tokenListArea, setTokenListArea] = useState<HTMLElement | null>(null);
  const sheetRef = useMergedRef(sheetSizeRef, setTokenListArea);
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
  const isSheetOpen = isTokensOpen && !isWide;
  const covered = {
    right: isWide ? PANEL_COLUMN_EDGE_GAP + PANEL_COLUMN_WIDTH + PANEL_GAP : 0,
    bottom: isSheetOpen ? TOKENS_TOGGLE_SPACE + sheetHeight : 0,
  };
  const { ref: viewSizeRef, width: viewWidth } = useElementSize();
  const { ref: toolbarSizeRef, width: toolbarWidth } = useElementSize();
  const isBesideToolbar = fitsBesideToolbar(
    viewWidth,
    toolbarWidth,
    fittedAxisShift(covered),
  );
  const header = useHeaderCollapsed();
  const [detailTokenId, setDetailTokenId] = useState<string | null>(null);
  const tokenDetail = useMemo(
    () => ({
      toggle: (tokenId: string) =>
        setDetailTokenId((shown) => (shown === tokenId ? null : tokenId)),
      hide: () => setDetailTokenId(null),
    }),
    [],
  );
  // The detail, and on phones the token list, lie over the map, where the held tokens are to be
  // put down.
  const holdTokens = (tokens: HeldToken[]) => {
    tokenDetail.hide();
    if (!isWide) closeTokens();
    board.current?.holdTokens(tokens);
  };
  const tokenPanel = (
    <FocusTokenContext value={focusToken}>
      <TokenMenuContext value={openTokenMenu}>
        <SelectedTokensContext value={selectedTokens}>
          <DropTokenContext value={dropToken}>
            <TokenDetailContext value={tokenDetail}>
              <HoldTokensContext value={holdTokens}>
                <TokenPanel />
              </HoldTokensContext>
            </TokenDetailContext>
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
              <AppShell header={{ height: 60, collapsed: header.isCollapsed }}>
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
                    {header.canCollapse && (
                      <HideHeaderButton
                        onHide={() => header.setCollapsed(true)}
                      />
                    )}
                  </Group>
                </AppShell.Header>
                <AppShell.Main>
                  <Stack
                    gap={0}
                    // The offset, unlike the header's height, drops to 0 while the header is hidden.
                    h="calc(100dvh - var(--app-shell-header-offset, 0px))"
                  >
                    <Box ref={viewSizeRef} flex={1} mih={0} pos="relative">
                      <ErrorBoundary
                        FallbackComponent={MapError}
                        // The broken map takes the toolbar and its button for the header with it.
                        onError={() => header.setCollapsed(false)}
                      >
                        <Board
                          ref={board}
                          toolbarRef={toolbarSizeRef}
                          toolbarEnd={
                            header.isCollapsed && (
                              <ShowHeaderButton
                                isDisconnected={connection === "disconnected"}
                                onShow={() => header.setCollapsed(false)}
                              />
                            )
                          }
                          onSelectedTokensChange={setSelectedTokens}
                          covered={covered}
                          awareness={awareness}
                          isSynced={isSynced}
                          critical={criticals.critical}
                          onCriticalDone={criticals.clear}
                        />
                      </ErrorBoundary>
                      {!isWide && (
                        <TokenSheet isOpen={isSheetOpen} ref={sheetRef}>
                          {tokenPanel}
                        </TokenSheet>
                      )}
                      {isSheetOpen && detailTokenId && (
                        <TokenDetail
                          tokenId={detailTokenId}
                          listArea={tokenListArea}
                          onClose={tokenDetail.hide}
                          left={12}
                          right={`calc(${SHEET_WIDTH} + 24px)`}
                          bottom={TOKENS_TOGGLE_SPACE}
                          mah="50%"
                        />
                      )}
                      {!isWide && (
                        <TokensToggle
                          isOpen={isTokensOpen}
                          onToggle={() => {
                            tokenDetail.hide();
                            toggleTokens();
                          }}
                        />
                      )}
                      {isWide && (
                        // Beside or below the toolbar, so no panel covers another.
                        <Stack
                          pos="absolute"
                          top={
                            isBesideToolbar
                              ? PANEL_COLUMN_EDGE_GAP
                              : TOOLBAR_SPACE
                          }
                          bottom={PANEL_COLUMN_EDGE_GAP}
                          right={PANEL_COLUMN_EDGE_GAP}
                          w={PANEL_COLUMN_WIDTH}
                          gap={PANEL_GAP}
                          style={{ pointerEvents: "none", zIndex: 10 }}
                        >
                          <TokenDrawer
                            onClose={tokenDetail.hide}
                            ref={setTokenListArea}
                          >
                            {tokenPanel}
                          </TokenDrawer>
                          {detailTokenId && (
                            // Left of the drawer's tab, which it must not cover.
                            <TokenDetail
                              tokenId={detailTokenId}
                              listArea={tokenListArea}
                              onClose={tokenDetail.hide}
                              top={0}
                              right={`calc(100% + ${TAB_WIDTH + PANEL_GAP}px)`}
                              w={DETAIL_WIDTH}
                              mah="100%"
                            />
                          )}
                          <DiceTray
                            mt="auto"
                            style={{ pointerEvents: "auto", flexShrink: 0 }}
                          />
                        </Stack>
                      )}
                    </Box>
                    {!isWide && <DiceBar />}
                  </Stack>
                </AppShell.Main>
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
