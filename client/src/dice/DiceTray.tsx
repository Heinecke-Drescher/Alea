import {
  ActionIcon,
  Box,
  Collapse,
  Group,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconChevronDown,
  IconChevronUp,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { FloatingPanel } from "../FloatingPanel";
import { usePlayer } from "../player/PlayerContext";
import { DieButtons } from "./DieButtons";
import { NewestRoll, RollHistory } from "./RollHistory";
import { SecretRolls } from "./SecretRolls";
import { useDice } from "./useDice";

const TRAY_WIDTH = 240;
const HISTORY_HEIGHT = 300;

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

// The newest roll below the tray, which opens up into all rolls.
function TrayHistory() {
  const { isSecret, secretRolls } = useDice();
  const [isOpen, { toggle }] = useDisclosure();
  return (
    <Box p="xs" pt={4}>
      <Group wrap="nowrap" gap="xs">
        <UnstyledButton
          flex={1}
          miw={0}
          aria-label={isOpen ? "Hide all rolls" : "Show all rolls"}
          aria-expanded={isOpen}
          onClick={toggle}
        >
          <Group wrap="nowrap" gap="xs">
            <Box flex={1} miw={0}>
              {/* Open, the list below starts with the newest roll itself. */}
              {isOpen ? <Text size="sm">Rolls</Text> : <NewestRoll compact />}
            </Box>
            {isOpen ? (
              <IconChevronDown size={18} />
            ) : (
              <IconChevronUp size={18} />
            )}
          </Group>
        </UnstyledButton>
        <SecretToggle />
      </Group>
      <Collapse expanded={isOpen}>
        <ScrollArea.Autosize mah={HISTORY_HEIGHT} mt="xs">
          <Stack>
            {isSecret && <SecretRolls rolls={secretRolls} />}
            <RollHistory />
          </Stack>
        </ScrollArea.Autosize>
      </Collapse>
    </Box>
  );
}

// Always in the same place, so no player has to look for the dice or arrange them.
export function DiceTray() {
  const { isSecret } = useDice();
  return (
    <FloatingPanel
      pos="absolute"
      // Right above the zoom and undo buttons in the lower right corner.
      right={12}
      bottom={68}
      w={TRAY_WIDTH}
      pt="xs"
      style={{ zIndex: 10 }}
    >
      <Tooltip
        label={
          isSecret
            ? "Click to roll secretly"
            : "Drag a die onto the map to roll it there, or click to roll"
        }
        openDelay={500}
        multiline
        w={TRAY_WIDTH - 40}
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
          <DieButtons columns={4} spacing="xs" />
        </Box>
      </Tooltip>
      <TrayHistory />
    </FloatingPanel>
  );
}
