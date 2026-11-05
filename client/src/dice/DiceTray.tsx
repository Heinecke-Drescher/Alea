import {
  ActionIcon,
  Box,
  Center,
  Collapse,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import {
  clamp,
  useDisclosure,
  useDrag,
  useElementSize,
  useLocalStorage,
} from "@mantine/hooks";
import {
  IconChevronDown,
  IconChevronUp,
  IconEye,
  IconEyeOff,
  IconGripHorizontal,
} from "@tabler/icons-react";
import { useRef, useState } from "react";
import { usePlayer } from "../player/PlayerContext";
import { DieButtons } from "./DieButtons";
import { NewestRoll, RollHistory } from "./RollHistory";
import { SecretRolls } from "./SecretRolls";
import { useDice } from "./useDice";

const TRAY_WIDTH = 240;
const HISTORY_HEIGHT = 300;
// Right above the zoom and undo buttons in the lower right corner.
const START_PLACE = { right: 12, bottom: 68 };

// Distances to the lower right corner of the map view, where the tray starts, in CSS pixels.
interface TrayPlace {
  right: number;
  bottom: number;
}

function isTrayPlace(value: unknown): value is TrayPlace {
  if (typeof value !== "object" || value === null) return false;
  const { right, bottom } = value as Partial<Record<keyof TrayPlace, unknown>>;
  return Number.isFinite(right) && Number.isFinite(bottom);
}

function SecretToggle() {
  const { isDm } = usePlayer();
  const { wantsSecret, setWantsSecret } = useDice();
  if (!isDm) return null;
  const label = wantsSecret ? "Roll for everyone" : "Roll secretly";
  return (
    <Tooltip label={label}>
      <ActionIcon
        pos="absolute"
        top={2}
        right={8}
        size="sm"
        variant={wantsSecret ? "light" : "subtle"}
        color="gray"
        aria-label={label}
        aria-pressed={wantsSecret}
        onClick={() => setWantsSecret(!wantsSecret)}
      >
        {wantsSecret ? <IconEyeOff size={16} /> : <IconEye size={16} />}
      </ActionIcon>
    </Tooltip>
  );
}

// The newest roll below the tray, which opens up into all rolls.
function TrayHistory() {
  const { isSecret, secretRolls } = useDice();
  const [isOpen, { toggle }] = useDisclosure();
  return (
    <Box p="xs" pt={4}>
      <UnstyledButton
        w="100%"
        aria-label={isOpen ? "Hide all rolls" : "Show all rolls"}
        aria-expanded={isOpen}
        onClick={toggle}
      >
        <Group wrap="nowrap" gap="xs">
          <Box flex={1} miw={0}>
            <NewestRoll compact />
          </Box>
          {isOpen ? <IconChevronDown size={18} /> : <IconChevronUp size={18} />}
        </Group>
      </UnstyledButton>
      <Collapse expanded={isOpen}>
        <ScrollArea.Autosize mah={HISTORY_HEIGHT} mt="xs">
          <Stack>
            {isSecret && <SecretRolls rolls={secretRolls} />}
            <RollHistory />
          </Stack>
        </ScrollArea.Autosize>
      </Collapse>
    </Box>
  );
}

// Floats over the map view at a place each player picks for themselves.
export function DiceTray() {
  const { isSecret } = useDice();
  const [stored, setStored] = useLocalStorage<unknown>({
    key: "alea-dice-tray",
    defaultValue: START_PLACE,
    getInitialValueInEffect: false,
  });
  const [dragged, setDragged] = useState<TrayPlace | null>(null);
  const dragStart = useRef<TrayPlace>(START_PLACE);
  const {
    ref: viewRef,
    width: viewWidth,
    height: viewHeight,
  } = useElementSize();
  const {
    ref: trayRef,
    width: trayWidth,
    height: trayHeight,
  } = useElementSize();
  // Also pulls the tray back into view when the window gets smaller. Before the first
  // measurement every size is 0.
  const inView = (place: TrayPlace) =>
    viewWidth === 0
      ? place
      : {
          right: clamp(place.right, 0, Math.max(0, viewWidth - trayWidth)),
          bottom: clamp(place.bottom, 0, Math.max(0, viewHeight - trayHeight)),
        };
  const shown = inView(dragged ?? (isTrayPlace(stored) ? stored : START_PLACE));

  const { ref: handleRef, active: isMoving } = useDrag(
    ({ movement: [dx, dy], first, last }) => {
      if (first) dragStart.current = shown;
      const next = inView({
        right: dragStart.current.right - dx,
        bottom: dragStart.current.bottom - dy,
      });
      if (!last) {
        setDragged(next);
        return;
      }
      setStored(next);
      setDragged(null);
    },
  );

  return (
    <Box
      ref={viewRef}
      pos="absolute"
      inset={0}
      style={{ pointerEvents: "none", zIndex: 10 }}
    >
      <Paper
        ref={trayRef}
        pos="absolute"
        w={TRAY_WIDTH}
        withBorder
        shadow="md"
        radius="lg"
        style={{
          right: shown.right,
          bottom: shown.bottom,
          pointerEvents: "auto",
        }}
      >
        <Box pos="relative">
          <Center
            ref={handleRef}
            h={28}
            c="dimmed"
            aria-label="Move the dice tray"
            style={{
              cursor: isMoving ? "grabbing" : "grab",
              // Lets fingers move the tray instead of scrolling the page.
              touchAction: "none",
            }}
          >
            <IconGripHorizontal size={16} />
          </Center>
          <SecretToggle />
        </Box>
        <Tooltip
          label={
            isSecret
              ? "Click to roll secretly"
              : "Drag a die onto the map to roll it there, or click to roll"
          }
          openDelay={500}
          multiline
          w={TRAY_WIDTH - 40}
        >
          <Box
            mx="xs"
            p="xs"
            bdrs="md"
            bg="var(--mantine-color-default-hover)"
            style={{
              boxShadow: "inset 0 2px 6px rgb(0 0 0 / 35%)",
              outline: isSecret
                ? "2px dashed var(--mantine-color-dimmed)"
                : undefined,
            }}
          >
            <DieButtons columns={4} spacing="xs" />
          </Box>
        </Tooltip>
        <TrayHistory />
      </Paper>
    </Box>
  );
}
