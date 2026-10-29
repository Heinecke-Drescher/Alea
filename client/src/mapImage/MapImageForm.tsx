import { Button, Group, Image, NumberInput, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { isValidMapBounds, MAX_MAP_CELLS, MIN_MAP_CELLS } from "../room/grid";
import { mapImageRows } from "../room/mapImage";

interface MapImageFormProps {
  image: string;
  width: number;
  height: number;
  initialColumns: number;
  onSave: (columns: number, rows: number) => void;
  onCancel: () => void;
}

export function MapImageForm({
  image,
  width,
  height,
  initialColumns,
  onSave,
  onCancel,
}: MapImageFormProps) {
  const [columns, setColumns] = useState<number | string>(initialColumns);
  const rows =
    typeof columns === "number" ? mapImageRows(width, height, columns) : null;
  const isValid =
    typeof columns === "number" &&
    rows !== null &&
    isValidMapBounds({ x: 0, y: 0, columns, rows });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (isValid) onSave(columns, rows);
      }}
    >
      <Stack>
        <Image src={image} alt="Map image" mah={240} fit="contain" />
        <NumberInput
          label="Width in cells"
          value={columns}
          onChange={setColumns}
          allowDecimal={false}
          allowNegative={false}
          data-autofocus
        />
        {rows !== null && <Text size="sm">Height: {rows} cells</Text>}
        {!isValid && (
          <Text size="sm" c="red">
            Width and height must be between {MIN_MAP_CELLS} and {MAX_MAP_CELLS}{" "}
            cells.
          </Text>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!isValid}>
            Set image
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
