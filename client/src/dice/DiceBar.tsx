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
import { DIE_SIDES } from "../room/dice";
import { useLandscape } from "../theme";
import { DieButtons, SECRET_OUTLINE, SecretToggle } from "./DieButtons";
import { NewestRoll, RollHistory } from "./RollHistory";
import { SecretRolls } from "./SecretRolls";
import { useDice } from "./useDice";

// Below the map on narrow screens, where the fitted map usually leaves room. In one row in
// landscape, which has little height to spare.
export function DiceBar() {
  const { isSecret, secretRolls } = useDice();
  const [isOpen, history] = useDisclosure();
  const isLandscape = useLandscape();

  return (
    <Paper p="xs" radius={0} withBorder>
      <Stack gap="xs">
        <Box
          bdrs="md"
          style={{
            outline: isSecret ? SECRET_OUTLINE : undefined,
            outlineOffset: 4,
          }}
        >
          <DieButtons columns={isLandscape ? DIE_SIDES.length : 4} />
        </Box>
        <Group wrap="nowrap" gap="xs">
          <UnstyledButton
            flex={1}
            miw={0}
            aria-label="Show all rolls"
            onClick={history.open}
          >
            <Group wrap="nowrap" gap="xs">
              <Box flex={1} miw={0}>
                <NewestRoll />
              </Box>
              <IconChevronUp size={20} />
            </Group>
          </UnstyledButton>
          <SecretToggle size="lg" />
        </Group>
      </Stack>
      <Drawer
        opened={isOpen}
        onClose={history.close}
        position="bottom"
        size="70%"
        title="Rolls"
      >
        <Stack>
          {isSecret && <SecretRolls rolls={secretRolls} />}
          <RollHistory />
        </Stack>
      </Drawer>
    </Paper>
  );
}
