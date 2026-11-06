import {
  Box,
  Drawer,
  Group,
  Paper,
  Stack,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronUp } from "@tabler/icons-react";
import { DieButtons, SecretSwitch } from "./DieButtons";
import { NewestRoll, RollHistory } from "./RollHistory";
import { SecretRolls } from "./SecretRolls";
import { useDice } from "./useDice";

// Below the map on a phone held upright, where the fitted map usually leaves room.
export function DiceBar() {
  const { isSecret, secretRolls } = useDice();
  const [isOpen, history] = useDisclosure();

  return (
    <Paper p="xs" radius={0} withBorder>
      <Stack gap="xs">
        <DieButtons columns={4} spacing="xs" />
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
