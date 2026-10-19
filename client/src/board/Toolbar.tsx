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
  IconCircle,
  IconCone,
  IconEraser,
  IconEye,
  IconEyeOff,
  IconPencil,
  IconPointer,
  IconRuler,
  IconSquare,
  IconTrash,
  type Icon,
} from "@tabler/icons-react";
import { usePlayer } from "../player/PlayerContext";
import { foggedCells } from "../room/fog";
import { useRoom } from "../room/RoomContext";
import { useFog } from "../room/useFog";
import { PAINT_COLORS, paintColorValue, type PaintColor } from "./paintColors";
import type { Tool } from "./tools/tool";

interface ToolButton {
  tool: Tool;
  label: string;
  icon: Icon;
}

const TOOLS: ToolButton[] = [
  { tool: "select", label: "Select and move", icon: IconPointer },
  { tool: "paint", label: "Paint cells", icon: IconBucketDroplet },
  { tool: "pen", label: "Draw", icon: IconPencil },
  { tool: "eraser", label: "Erase", icon: IconEraser },
  { tool: "measure", label: "Measure distance", icon: IconRuler },
  { tool: "cone", label: "Cone area", icon: IconCone },
  { tool: "square", label: "Square area", icon: IconSquare },
  { tool: "circle", label: "Circle area", icon: IconCircle },
];

const FOG_TOOLS: ToolButton[] = [
  { tool: "hide", label: "Hide under fog", icon: IconEyeOff },
  { tool: "reveal", label: "Reveal fog", icon: IconEye },
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
  const { isDm } = usePlayer();
  const fog = useFog();

  function toolButton({ tool, label, icon: ToolIcon }: ToolButton) {
    return (
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
    );
  }

  return (
    <Paper pos="absolute" top={12} left={12} p={4} shadow="sm" withBorder>
      <Tooltip.Group>
        <Stack gap={4} align="center">
          {TOOLS.map(toolButton)}
          {isDm && (
            <>
              <Divider w="100%" />
              {FOG_TOOLS.map(toolButton)}
            </>
          )}
          <Divider w="100%" />
          {PAINT_COLORS.map((color) => (
            <ColorSwatch
              key={color}
              component="button"
              color={paintColorValue(theme, color)}
              size={24}
              aria-label={`Use ${color}`}
              onClick={() => onColorChange(color)}
            >
              {color === activeColor && <CheckIcon size={12} color="white" />}
            </ColorSwatch>
          ))}
          {/* Clearing would also wipe what the fog hides from players. */}
          {(isDm || foggedCells(fog).length === 0) && (
            <>
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
            </>
          )}
        </Stack>
      </Tooltip.Group>
    </Paper>
  );
}
