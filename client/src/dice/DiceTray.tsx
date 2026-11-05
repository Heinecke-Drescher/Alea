import { Box, Center, Paper } from "@mantine/core";
import {
  clamp,
  useDrag,
  useElementSize,
  useLocalStorage,
} from "@mantine/hooks";
import { IconGripHorizontal } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { DieButtons } from "./DieButtons";

const TRAY_WIDTH = 240;
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

// Floats over the map view at a place each player picks for themselves.
export function DiceTray() {
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
        <Center
          ref={handleRef}
          h={20}
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
        <Box
          m="xs"
          mt={0}
          p="xs"
          bdrs="md"
          bg="var(--mantine-color-default-hover)"
          style={{ boxShadow: "inset 0 2px 6px rgb(0 0 0 / 35%)" }}
        >
          <DieButtons columns={4} spacing="xs" />
        </Box>
      </Paper>
    </Box>
  );
}
