import {
  Center,
  ColorSwatch,
  Group,
  Menu,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { IconCrown, IconPencil } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { usePlayer } from "../player/PlayerContext";
import type { Awareness } from "../room/connection/connectRoom";
import { otherPlayers, usePlayers } from "../room/connection/usePlayers";
import type { PlayerColor } from "../room/playerColors";
import type { DmState } from "./useDmControl";

interface RoomPeopleProps {
  awareness: Awareness | null;
  dmState: DmState;
  onEditName: () => void;
}

export function RoomPeople({
  awareness,
  dmState,
  onEditName,
}: RoomPeopleProps) {
  const player = usePlayer();
  const others = otherPlayers(usePlayers(awareness), player.id);
  const crown = <IconCrown size={16} aria-label="DM" />;
  const dmId = dmState.kind === "other" ? dmState.dm.playerId : null;

  return (
    <>
      <Menu.Label>In this room</Menu.Label>
      <Menu.Item
        leftSection={<PlayerDot color={player.color} />}
        rightSection={
          <Group gap={4} wrap="nowrap">
            {dmState.kind === "self" && crown}
            <IconPencil size={16} />
          </Group>
        }
        onClick={onEditName}
      >
        {displayName(player.name)} (you)
      </Menu.Item>
      {others.map((other) => (
        <PersonRow
          key={other.playerId}
          dot={<PlayerDot color={other.color} />}
          name={displayName(other.name)}
          {...(other.playerId === dmId && { right: crown })}
        />
      ))}
      {dmState.kind === "other" && dmState.isAway && (
        <PersonRow
          name={`${displayName(dmState.dm.name)} (away)`}
          right={crown}
          isDimmed
        />
      )}
    </>
  );
}

function displayName(name: string) {
  return name === "" ? "Unnamed" : name;
}

// As wide as the menu icons, so all texts start in one line.
function PlayerDot({ color }: { color: PlayerColor }) {
  const theme = useMantineTheme();
  return (
    <Center w={16}>
      <ColorSwatch color={theme.colors[color][6]} size={14} />
    </Center>
  );
}

interface PersonRowProps {
  dot?: ReactNode;
  name: string;
  right?: ReactNode;
  isDimmed?: boolean;
}

// Not a menu item, so arrow keys skip the other players; spaced like one.
function PersonRow({ dot, name, right, isDimmed = false }: PersonRowProps) {
  return (
    <Group
      gap="xs"
      wrap="nowrap"
      px="sm"
      py="calc(var(--mantine-spacing-xs) / 1.5)"
      c={isDimmed ? "dimmed" : undefined}
    >
      <Center w={16}>{dot}</Center>
      <Text size="sm" flex={1} truncate>
        {name}
      </Text>
      {right}
    </Group>
  );
}
