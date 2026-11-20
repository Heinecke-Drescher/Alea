import { ActionIcon, Button, NumberInput, Text, Tooltip } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { IconRotateClockwise } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { CELL_SIZE, MAX_MAP_CELLS, MIN_MAP_CELLS } from "../../room/grid";
import {
  MAP_SIZE_LIMIT_MESSAGE,
  turnedClockwise,
  type MapImagePlace,
} from "../../room/mapImage";
import { useRoom } from "../../room/RoomContext";
import { ToolbarHint } from "../ToolbarHint";
import { notifyMapFit } from "./notifyMapFit";

const TYPING_PAUSE = 600;

interface MapImageAlignHintProps {
  place: MapImagePlace;
  onDone: () => void;
  axisShift: number;
}

function isMapWidth(value: unknown): value is number {
  return (
    Number.isInteger(value) &&
    typeof value === "number" &&
    value >= MIN_MAP_CELLS &&
    value <= MAX_MAP_CELLS
  );
}

export function MapImageAlignHint({
  place,
  onDone,
  axisShift,
}: MapImageAlignHintProps) {
  const room = useRoom();
  // What is typed but not yet applied; otherwise the field shows the image's width.
  const [typed, setTyped] = useState<string | number | null>(null);
  const columns = Math.round(place.width / CELL_SIZE);
  const rows = Math.round(place.height / CELL_SIZE);

  // Half typed numbers stay in the field until they are done or the field is left.
  function scaleTo(value: string | number) {
    if (!isMapWidth(value)) return;
    setTyped(null);
    if (value === columns) return;
    notifyMapFit(
      room.scaleMapImage(value),
      `The map would be ${value} × ${Math.round((place.height * value) / place.width)} cells, but a map is ${MIN_MAP_CELLS} to ${MAX_MAP_CELLS} cells wide and high.`,
    );
  }

  const applyTyped = useDebouncedCallback(scaleTo, TYPING_PAUSE);
  // Mantine hands a step and a keystroke to onChange alike, so the press says which it was.
  const isStepping = useRef(false);

  return (
    <ToolbarHint axisShift={axisShift}>
      <Text size="sm">Width</Text>
      <NumberInput
        aria-label="Width in cells"
        size="xs"
        w={72}
        min={MIN_MAP_CELLS}
        max={MAX_MAP_CELLS}
        allowDecimal={false}
        allowNegative={false}
        clampBehavior="none"
        value={typed ?? columns}
        rightSectionProps={{
          onPointerDownCapture: () => {
            isStepping.current = true;
          },
        }}
        // Arrows apply at once; typing waits, as 100 passes through 10 on its way.
        onChange={(value) => {
          if (isStepping.current) {
            isStepping.current = false;
            applyTyped.cancel();
            scaleTo(value);
          } else {
            setTyped(value);
            applyTyped(value);
          }
        }}
        onKeyDown={(event) => {
          isStepping.current =
            event.key === "ArrowUp" || event.key === "ArrowDown";
          if (event.key === "Enter") applyTyped.flush();
        }}
        onBlur={() => {
          applyTyped.flush();
          setTyped(null);
        }}
      />
      <Text size="sm" style={{ whiteSpace: "nowrap" }}>
        cells · Height {rows}
      </Text>
      <Tooltip label="Rotate 90°">
        <ActionIcon
          variant="default"
          aria-label="Rotate 90°"
          onClick={() =>
            notifyMapFit(
              room.placeMapImage(turnedClockwise(place)),
              MAP_SIZE_LIMIT_MESSAGE,
            )
          }
        >
          <IconRotateClockwise size={18} />
        </ActionIcon>
      </Tooltip>
      <Button
        size="xs"
        variant="default"
        onClick={onDone}
        style={{ flexShrink: 0 }}
      >
        Done
      </Button>
    </ToolbarHint>
  );
}
