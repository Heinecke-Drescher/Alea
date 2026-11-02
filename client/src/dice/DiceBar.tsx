import {
  Box,
  Drawer,
  Group,
  Paper,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronUp } from "@tabler/icons-react";
import { DieButtons, SecretSwitch } from "./DieButtons";
import { LastRoll, RollHistory } from "./RollHistory";
import { RollRow } from "./RollRow";
import { SecretRolls } from "./SecretRolls";
import { useDice } from "./useDice";

// The DM's secret rolls and everyone's rolls share the line; the newest of both is shown.
function NewestRoll() {
  const { secretRolls, rolls } = useDice();
  const [newestSecret] = secretRolls;
  const [newest] = rolls;
  const isSecretNewer =
    newestSecret && (!newest || newestSecret.at.getTime() > newest.at);
  if (isSecretNewer) {
    return (
      <RollRow
        label={`Secret · d${newestSecret.sides}`}
        value={newestSecret.value}
      />
    );
  }
  return newest ? (
    <LastRoll roll={newest} />
  ) : (
    <Text c="dimmed">No rolls yet</Text>
  );
}

// Below the map on a phone held upright, where the fitted map usually leaves room.
export function DiceBar() {
  const { isSecret, secretRolls } = useDice();
  const [isOpen, history] = useDisclosure();

  return (
    <Paper p="xs" radius={0} withBorder>
      <Stack gap="xs">
        <DieButtons columns={7} spacing="xs" dragWith="finger" />
        <UnstyledButton aria-label="Show all rolls" onClick={history.open}>
          <Group wrap="nowrap" gap="xs">
            <Box flex={1} miw={0}>
              <NewestRoll />
            </Box>
            <IconChevronUp size={20} />
          </Group>
        </UnstyledButton>
      </Stack>
      <Drawer
        opened={isOpen}
        onClose={history.close}
        position="bottom"
        size="70%"
        title="Rolls"
      >
        <Stack>
          <SecretSwitch />
          {isSecret && <SecretRolls rolls={secretRolls} />}
          <RollHistory />
        </Stack>
      </Drawer>
    </Paper>
  );
}
