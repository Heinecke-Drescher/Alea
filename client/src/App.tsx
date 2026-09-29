import "@mantine/core/styles.css";
import {
  AppShell,
  Burger,
  Group,
  MantineProvider,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

export function App() {
  const [asideOpened, { toggle: toggleAside }] = useDisclosure();

  return (
    <MantineProvider defaultColorScheme="auto">
      <AppShell
        padding="md"
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
          <Text c="dimmed">Map</Text>
        </AppShell.Main>
        <AppShell.Aside p="md">
          <Text c="dimmed">Dice</Text>
        </AppShell.Aside>
      </AppShell>
    </MantineProvider>
  );
}
