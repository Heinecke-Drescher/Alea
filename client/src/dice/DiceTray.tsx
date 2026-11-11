import {
  ActionIcon,
  Box,
  Group,
  Popover,
  ScrollArea,
  Stack,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import type { ComponentProps } from "react";
import { FloatingPanel } from "../FloatingPanel";
import { usePlayer } from "../player/PlayerContext";
import { DieButtons } from "./DieButtons";
import { NewestRoll, RollHistory } from "./RollHistory";
import { SecretRolls } from "./SecretRolls";
import { useDice } from "./useDice";

const HISTORY_WIDTH = 280;
// Beside the tray there is room up to the top of the map, but not on a low window.
const HISTORY_HEIGHT = "min(480px, 60dvh)";

function SecretToggle() {
  const { isDm } = usePlayer();
  const { wantsSecret, setWantsSecret } = useDice();
  if (!isDm) return null;
  const label = wantsSecret ? "Roll for everyone" : "Roll secretly";
  return (
    <Tooltip label={label}>
      <ActionIcon
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

// The newest roll below the tray. All rolls open beside the tray, so it keeps its size.
function TrayHistory() {
  const { isSecret, secretRolls } = useDice();
  const [isOpen, history] = useDisclosure();
  return (
    <Group wrap="nowrap" gap="xs" p="xs" pt={4}>
      <Popover
        opened={isOpen}
        onDismiss={history.close}
        position="left-end"
        offset={16}
        shadow="md"
        width={HISTORY_WIDTH}
      >
        <Popover.Target>
          <UnstyledButton
            flex={1}
            miw={0}
            aria-label={isOpen ? "Hide all rolls" : "Show all rolls"}
            aria-expanded={isOpen}
            onClick={history.toggle}
          >
            <Group wrap="nowrap" gap="xs">
              <Box flex={1} miw={0}>
                <NewestRoll compact />
              </Box>
              {isOpen ? (
                <IconChevronRight size={18} />
              ) : (
                <IconChevronLeft size={18} />
              )}
            </Group>
          </UnstyledButton>
        </Popover.Target>
        <Popover.Dropdown p="xs">
          <ScrollArea.Autosize mah={HISTORY_HEIGHT}>
            <Stack>
              {isSecret && <SecretRolls rolls={secretRolls} />}
              <RollHistory />
            </Stack>
          </ScrollArea.Autosize>
        </Popover.Dropdown>
      </Popover>
      <SecretToggle />
    </Group>
  );
}

export function DiceTray(props: ComponentProps<typeof FloatingPanel>) {
  const { isSecret } = useDice();
  return (
    <FloatingPanel pt="xs" {...props}>
      <Tooltip
        label={
          isSecret
            ? "Click to roll secretly"
            : "Drag a die onto the map to roll it there, or click to roll"
        }
        openDelay={500}
        multiline
        w={200}
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
          <DieButtons columns={4} />
        </Box>
      </Tooltip>
      <TrayHistory />
    </FloatingPanel>
  );
}
