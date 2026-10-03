import {
  ActionIcon,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const colorScheme = useComputedColorScheme("light");
  const isDark = colorScheme === "dark";
  const label = isDark ? "Use light mode" : "Use dark mode";

  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      onClick={() => setColorScheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
    >
      {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
    </ActionIcon>
  );
}
