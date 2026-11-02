import { Box, Portal } from "@mantine/core";
import { useRef, useState, type PointerEvent } from "react";
import type { DieSides } from "../room/dice";
import type { PlayerColor } from "../room/playerColors";
import { PRIMARY_BUTTON } from "../board/pointer";
import { DieButton, DieFace } from "./DieButton";
import { useThrowDie, type ScreenSample } from "./throwDie";

// Below this a press clicks the die; beyond it, it drags the die towards the map.
const DRAG_DISTANCE = 10;
// Only the end of the drag gives the throw its swing.
const KEPT_SAMPLES_MS = 200;
const GHOST_SIZE = 48;

function sampleOf(event: PointerEvent) {
  return { x: event.clientX, y: event.clientY, time: event.timeStamp };
}

function ghostPlace({ x, y }: ScreenSample) {
  return { left: x - GHOST_SIZE / 2, top: y - GHOST_SIZE / 2 };
}

interface Press {
  pointerId: number;
  start: ScreenSample;
  samples: ScreenSample[];
  isDragging: boolean;
}

interface DraggableDieProps {
  sides: DieSides;
  color: PlayerColor;
  onRoll: () => void;
}

// Fingers and pens cannot use the browser's drag and drop in every browser, so the die follows
// every pointer itself.
export function DraggableDie({ sides, color, onRoll }: DraggableDieProps) {
  const throwDie = useThrowDie();
  const press = useRef<Press | null>(null);
  const [ghostStart, setGhostStart] = useState<ScreenSample | null>(null);
  // Moved without rendering, as a drag sends a move with every frame.
  const ghost = useRef<HTMLDivElement>(null);
  // The click that may follow the release of a drag must not roll a second die.
  const ignoresClick = useRef(false);

  function stop() {
    press.current = null;
    setGhostStart(null);
  }

  return (
    <>
      <DieButton
        sides={sides}
        color={color}
        onRoll={() => {
          if (!ignoresClick.current) onRoll();
        }}
        drag={{
          onPointerDown(event) {
            if (event.button !== PRIMARY_BUTTON || press.current) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            const start = sampleOf(event);
            press.current = {
              pointerId: event.pointerId,
              start,
              samples: [start],
              isDragging: false,
            };
          },
          onPointerMove(event) {
            const current = press.current;
            if (current?.pointerId !== event.pointerId) return;
            const sample = sampleOf(event);
            current.samples = [
              ...current.samples.filter(
                ({ time }) => sample.time - time <= KEPT_SAMPLES_MS,
              ),
              sample,
            ];
            const { start } = current;
            const moved = Math.hypot(sample.x - start.x, sample.y - start.y);
            if (!current.isDragging && moved > DRAG_DISTANCE) {
              current.isDragging = true;
              setGhostStart(sample);
            }
            if (ghost.current)
              Object.assign(ghost.current.style, toPixels(sample));
          },
          onPointerUp(event) {
            const current = press.current;
            if (current?.pointerId !== event.pointerId) return;
            stop();
            if (!current.isDragging) return;
            ignoresClick.current = true;
            // A click, if any, comes right after the pointerup.
            window.setTimeout(() => {
              ignoresClick.current = false;
            });
            throwDie(sides, [...current.samples, sampleOf(event)]);
          },
          onPointerCancel(event) {
            if (press.current?.pointerId === event.pointerId) stop();
          },
        }}
      />
      {ghostStart && (
        <Portal>
          <Box
            ref={ghost}
            pos="fixed"
            opacity={0.7}
            style={{
              ...toPixels(ghostStart),
              width: GHOST_SIZE,
              pointerEvents: "none",
              zIndex: 1000,
            }}
          >
            <DieFace sides={sides} color={color} />
          </Box>
        </Portal>
      )}
    </>
  );
}

// In CSS pixels like the pointer, not in Mantine's rem.
function toPixels(sample: ScreenSample) {
  const { left, top } = ghostPlace(sample);
  return { left: `${left}px`, top: `${top}px` };
}
