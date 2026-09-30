import {
  ActionIcon,
  CheckIcon,
  ColorSwatch,
  Divider,
  Paper,
  Stack,
  Text,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import {
  IconBucketDroplet,
  IconEraser,
  IconPencil,
  IconPointer,
  IconTrash,
  type Icon,
} from "@tabler/icons-react";
import { useRoom } from "../room/RoomContext";
import { PAINT_COLORS, type PaintColor } from "./paintColors";

export type Tool = "select" | "paint" | "pen" | "eraser";

const TOOLS: { tool: Tool; label: string; icon: Icon }[] = [
  { tool: "select", label: "Select and move", icon: IconPointer },
  { tool: "paint", label: "Paint cells", icon: IconBucketDroplet },
  { tool: "pen", label: "Draw", icon: IconPencil },
  { tool: "eraser", label: "Erase", icon: IconEraser },
];

function confirmClearDrawings(clearDrawings: () => void) {
  modals.openConfirmModal({
    title: "Clear drawings",
    centered: true,
    children: (
      <Text size="sm">
        Remove all painted cells and lines for everyone? Tokens stay.
      </Text>
    ),
    labels: { confirm: "Clear drawings", cancel: "Cancel" },
    confirmProps: { color: "red" },
    onConfirm: clearDrawings,
  });
}

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  activeColor: PaintColor;
  onColorChange: (color: PaintColor) => void;
}

export function Toolbar({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
}: ToolbarProps) {
  const theme = useMantineTheme();
  const room = useRoom();

  return (
    <Paper pos="absolute" top={12} left={12} p={4} shadow="sm" withBorder>
      <Stack gap={4} align="center">
        {TOOLS.map(({ tool, label, icon: ToolIcon }) => (
          <Tooltip key={tool} label={label} position="right">
            <ActionIcon
              variant={tool === activeTool ? "filled" : "subtle"}
              size="lg"
              aria-label={label}
              onClick={() => onToolChange(tool)}
            >
              <ToolIcon size={20} />
            </ActionIcon>
          </Tooltip>
        ))}
        <Divider w="100%" />
        {PAINT_COLORS.map((color) => (
          <ColorSwatch
            key={color}
            component="button"
            color={theme.colors[color][6]}
            size={24}
            aria-label={`Use ${color}`}
            onClick={() => onColorChange(color)}
          >
            {color === activeColor && <CheckIcon size={12} color="white" />}
          </ColorSwatch>
        ))}
        <Divider w="100%" />
        <Tooltip label="Clear drawings" position="right">
          <ActionIcon
            variant="subtle"
            color="red"
            size="lg"
            aria-label="Clear drawings"
            onClick={() => confirmClearDrawings(room.clearDrawings)}
          >
            <IconTrash size={20} />
          </ActionIcon>
        </Tooltip>
      </Stack>
    </Paper>
  );
}
