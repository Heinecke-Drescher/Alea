import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/notifications/styles.css";
import {
  AppShell,
  Burger,
  Group,
  MantineProvider,
  Stack,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Notifications } from "@mantine/notifications";
import { MotionConfig } from "motion/react";
import { ErrorBoundary } from "react-error-boundary";
import { Board } from "./board/Board";
import { MapError } from "./board/MapError";
import { DicePanel } from "./dice/DicePanel";
import { TokenPanel } from "./tokens/TokenPanel";

export function App() {
  const [asideOpened, { toggle: toggleAside }] = useDisclosure();

  return (
    <MantineProvider defaultColorScheme="auto">
      <Notifications />
      <MotionConfig reducedMotion="user">
        <AppShell
          header={{ height: 60 }}
          aside={{
            width: 320,
            breakpoint: "sm",
            collapsed: { mobile: !asideOpened },
          }}
        >
          <AppShell.Header>
            <Group h="100%" px="md" justify="space-between">
              <Title order={3}>Alea</Title>
              <Burger
                opened={asideOpened}
                onClick={toggleAside}
                hiddenFrom="sm"
                size="sm"
              />
            </Group>
          </AppShell.Header>
          <AppShell.Main>
            <ErrorBoundary FallbackComponent={MapError}>
              <Board />
            </ErrorBoundary>
          </AppShell.Main>
          <AppShell.Aside p="md">
            <Stack>
              <TokenPanel />
              <DicePanel />
            </Stack>
          </AppShell.Aside>
        </AppShell>
      </MotionConfig>
    </MantineProvider>
  );
}
