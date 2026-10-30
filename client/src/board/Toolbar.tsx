import {
  ActionIcon,
  ColorSwatch,
  Divider,
  Group,
  Paper,
  Popover,
  Stack,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBucketDroplet,
  IconCircle,
  IconCone,
  IconEraser,
  IconEye,
  IconEyeOff,
  IconPencil,
  IconPointer,
  IconResize,
  IconRuler,
  IconSquare,
  IconTypography,
  type Icon,
} from "@tabler/icons-react";
import { usePlayer } from "../player/PlayerContext";
import { PAINT_COLORS, paintColorValue, type PaintColor } from "./paintColors";
import type { Tool } from "./tools/tool";

interface ToolButton {
  tool: Tool;
  label: string;
  icon: Icon;
}

const MAP_TOOLS: ToolButton[] = [
  { tool: "select", label: "Select and move", icon: IconPointer },
  { tool: "measure", label: "Measure distance", icon: IconRuler },
  { tool: "resize", label: "Resize map", icon: IconResize },
];

const DRAWING_TOOLS: ToolButton[] = [
  { tool: "pen", label: "Draw", icon: IconPencil },
  { tool: "paint", label: "Paint cells", icon: IconBucketDroplet },
  { tool: "eraser", label: "Erase", icon: IconEraser },
  { tool: "text", label: "Write text", icon: IconTypography },
];

const SHAPE_TOOLS: ToolButton[] = [
  { tool: "cone", label: "Cone area", icon: IconCone },
  { tool: "square", label: "Square area", icon: IconSquare },
  { tool: "circle", label: "Circle area", icon: IconCircle },
];

const FOG_TOOLS: ToolButton[] = [
  { tool: "hide", label: "Hide under fog", icon: IconEyeOff },
  { tool: "reveal", label: "Reveal fog", icon: IconEye },
];

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
  const { isDm } = usePlayer();
  const [isPicking, picking] = useDisclosure();

  function toolButton({ tool, label, icon: ToolIcon }: ToolButton) {
    return (
      <Tooltip key={tool} label={label} position="bottom">
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
    <Paper
      pos="absolute"
      top={12}
      left="50%"
      style={{ transform: "translateX(-50%)" }}
      p={4}
      shadow="sm"
      withBorder
    >
      <Tooltip.Group>
        <Group gap={4} wrap="nowrap">
          {MAP_TOOLS.map(toolButton)}
          <Divider orientation="vertical" />
          {DRAWING_TOOLS.map(toolButton)}
          <Divider orientation="vertical" />
          {SHAPE_TOOLS.map(toolButton)}
          <Popover
            opened={isPicking}
            onDismiss={picking.close}
            position="bottom"
            shadow="md"
          >
            <Popover.Target>
              <Tooltip label="Color" position="bottom" disabled={isPicking}>
                <ActionIcon
                  variant="subtle"
                  size="lg"
                  aria-label={`Color: ${activeColor}`}
                  onClick={picking.toggle}
                >
                  <ColorSwatch
                    component="span"
                    color={paintColorValue(theme, activeColor)}
                    size={24}
                  />
                </ActionIcon>
              </Tooltip>
            </Popover.Target>
            <Popover.Dropdown p={6}>
              <Stack gap={6}>
                {PAINT_COLORS.filter((color) => color !== activeColor).map(
                  (color) => (
                    <ColorSwatch
                      key={color}
                      component="button"
                      color={paintColorValue(theme, color)}
                      size={24}
                      aria-label={`Use ${color}`}
                      onClick={() => {
                        onColorChange(color);
                        picking.close();
                      }}
                    />
                  ),
                )}
              </Stack>
            </Popover.Dropdown>
          </Popover>
          {isDm && (
            <>
              <Divider orientation="vertical" />
              {FOG_TOOLS.map(toolButton)}
            </>
          )}
        </Group>
      </Tooltip.Group>
    </Paper>
  );
}
