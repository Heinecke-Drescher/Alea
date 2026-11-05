import {
  ActionIcon,
  ColorSwatch,
  Divider,
  Group,
  Menu,
  Popover,
  Stack,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBucketDroplet,
  IconCheck,
  IconCircle,
  IconCone,
  IconDots,
  IconEraser,
  IconEye,
  IconEyeOff,
  IconPencil,
  IconPhotoEdit,
  IconPointer,
  IconResize,
  IconRuler,
  IconSquare,
  type Icon,
} from "@tabler/icons-react";
import { FloatingPanel } from "../FloatingPanel";
import { usePlayer } from "../player/PlayerContext";
import { PAINT_COLORS, paintColorValue, type PaintColor } from "./paintColors";
import type { TextFontSize } from "../room/texts";
import { TextToolButton } from "./texts/TextToolButton";
import type { Tool } from "./tools/tool";
import { useWideLayout } from "../theme";

interface ToolButton {
  tool: Tool;
  label: string;
  icon: Icon;
}

const MAP_TOOLS: ToolButton[] = [
  { tool: "select", label: "Select and move", icon: IconPointer },
  { tool: "measure", label: "Measure distance", icon: IconRuler },
];

const RESIZE_TOOL: ToolButton = {
  tool: "resize",
  label: "Resize map",
  icon: IconResize,
};

const ALIGN_TOOL: ToolButton = {
  tool: "alignImage",
  label: "Align map image",
  icon: IconPhotoEdit,
};

const DRAWING_TOOLS: ToolButton[] = [
  { tool: "pen", label: "Draw", icon: IconPencil },
  { tool: "paint", label: "Paint cells", icon: IconBucketDroplet },
  { tool: "eraser", label: "Erase", icon: IconEraser },
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
  canAlignMapImage: boolean;
  activeColor: PaintColor;
  onColorChange: (color: PaintColor) => void;
  textSize: TextFontSize;
  onTextSizeChange: (size: TextFontSize) => void;
}

export function Toolbar({
  activeTool,
  onToolChange,
  canAlignMapImage,
  activeColor,
  onColorChange,
  textSize,
  onTextSizeChange,
}: ToolbarProps) {
  const theme = useMantineTheme();
  const { isDm } = usePlayer();
  const [isPicking, picking] = useDisclosure();
  const isWide = useWideLayout();
  // A narrow screen, e.g. a phone, keeps the tools players need most in view.
  const menuTools = [
    RESIZE_TOOL,
    ...(canAlignMapImage ? [ALIGN_TOOL] : []),
    ...SHAPE_TOOLS,
    ...(isDm ? FOG_TOOLS : []),
  ];
  // The menu's button shows the tool picked from it, so the toolbar always tells what is active.
  const pickedFromMenu = menuTools.find(({ tool }) => tool === activeTool);
  const MenuIcon = pickedFromMenu ? pickedFromMenu.icon : IconDots;

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
    <FloatingPanel
      pos="absolute"
      top={12}
      left="50%"
      style={{ transform: "translateX(-50%)" }}
      p={4}
    >
      <Tooltip.Group>
        <Group gap={4} wrap="nowrap">
          {MAP_TOOLS.map(toolButton)}
          {isWide && toolButton(RESIZE_TOOL)}
          {isWide && canAlignMapImage && toolButton(ALIGN_TOOL)}
          <Divider orientation="vertical" />
          {DRAWING_TOOLS.map(toolButton)}
          <TextToolButton
            isActive={activeTool === "text"}
            onSelect={() => onToolChange("text")}
            size={textSize}
            onSizeChange={onTextSizeChange}
          />
          {isWide && (
            <>
              <Divider orientation="vertical" />
              {SHAPE_TOOLS.map(toolButton)}
            </>
          )}
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
          {isWide && isDm && (
            <>
              <Divider orientation="vertical" />
              {FOG_TOOLS.map(toolButton)}
            </>
          )}
          {!isWide && (
            <Menu position="bottom-end" shadow="md">
              <Menu.Target>
                <Tooltip
                  label={pickedFromMenu ? pickedFromMenu.label : "More tools"}
                  position="bottom"
                >
                  <ActionIcon
                    variant={pickedFromMenu ? "filled" : "subtle"}
                    size="lg"
                    aria-label="More tools"
                  >
                    <MenuIcon size={20} />
                  </ActionIcon>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown>
                {menuTools.map(({ tool, label, icon: ToolIcon }) => (
                  <Menu.Item
                    key={tool}
                    leftSection={<ToolIcon size={16} />}
                    rightSection={
                      tool === activeTool && <IconCheck size={16} />
                    }
                    onClick={() => onToolChange(tool)}
                  >
                    {label}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Tooltip.Group>
    </FloatingPanel>
  );
}
