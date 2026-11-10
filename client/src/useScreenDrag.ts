import { useRef, useState, type PointerEvent } from "react";
import { PRIMARY_BUTTON } from "./board/pointer";

// Where the pointer was, in pixels of the browser window.
export interface ScreenSample {
  x: number;
  y: number;
  time: number;
}

// Below this a press clicks; beyond it, it drags.
const DRAG_DISTANCE = 10;
// Only the end of a drag gives a throw its swing.
const KEPT_SAMPLES_MS = 200;
export const GHOST_SIZE = 48;

interface Press {
  pointerId: number;
  start: ScreenSample;
  samples: ScreenSample[];
  isDragging: boolean;
}

function sampleOf(event: PointerEvent) {
  return { x: event.clientX, y: event.clientY, time: event.timeStamp };
}

// In CSS pixels like the pointer, not in Mantine's rem.
export function ghostPixels({ x, y }: ScreenSample) {
  return {
    left: `${x - GHOST_SIZE / 2}px`,
    top: `${y - GHOST_SIZE / 2}px`,
  };
}

// Fingers and pens cannot use the browser's drag and drop in every browser, so what is dragged
// follows every pointer itself, shown as a ghost.
export function useScreenDrag(
  onDrop: (samples: ScreenSample[]) => void,
  onStart?: () => void,
) {
  const press = useRef<Press | null>(null);
  const [ghostStart, setGhostStart] = useState<ScreenSample | null>(null);
  // Moved without rendering, as a drag sends a move with every frame.
  const ghost = useRef<HTMLDivElement>(null);
  // The click that may follow the release of a drag must not count as a click.
  const ignoresClick = useRef(false);

  function stop() {
    press.current = null;
    setGhostStart(null);
  }

  const handlers = {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      if (event.button !== PRIMARY_BUTTON || press.current) return;
      // The browser keeps a finger or pen on what it pressed by itself. Capturing them only once
      // they drag lets a tap on a button inside still click that button.
      if (event.pointerType === "mouse") {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      const start = sampleOf(event);
      press.current = {
        pointerId: event.pointerId,
        start,
        samples: [start],
        isDragging: false,
      };
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
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
        event.currentTarget.setPointerCapture(event.pointerId);
        setGhostStart(sample);
        onStart?.();
      }
      if (ghost.current)
        Object.assign(ghost.current.style, ghostPixels(sample));
    },
    onPointerUp(event: PointerEvent<HTMLElement>) {
      const current = press.current;
      if (current?.pointerId !== event.pointerId) return;
      stop();
      if (!current.isDragging) return;
      ignoresClick.current = true;
      // A click, if any, comes right after the pointerup.
      window.setTimeout(() => {
        ignoresClick.current = false;
      });
      onDrop([...current.samples, sampleOf(event)]);
    },
    onPointerCancel(event: PointerEvent<HTMLElement>) {
      if (press.current?.pointerId === event.pointerId) stop();
    },
  };

  return {
    handlers,
    ghostRef: ghost,
    ghostStart,
    isClickIgnored: () => ignoresClick.current,
  };
}
