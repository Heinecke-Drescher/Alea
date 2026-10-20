import { Anchor, CloseButton, Group, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";
import { useRecentRooms } from "./useRecentRooms";

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export function RecentRooms() {
  const { rooms, remove } = useRecentRooms();
  if (rooms.length === 0) return null;

  return (
    <Stack gap="xs" w={280} mt="lg">
      <Title order={4}>Recent rooms</Title>
      {rooms.map(({ id, number, visitedAt }) => (
        <Group key={id} justify="space-between" wrap="nowrap">
          <Anchor component={Link} to={`/r/${id}`}>
            Room {number}
          </Anchor>
          <Group gap="xs" wrap="nowrap">
            <Text size="sm" c="dimmed">
              {dateFormat.format(visitedAt)}
            </Text>
            <CloseButton
              size="sm"
              aria-label={`Remove room ${number} from the list`}
              onClick={() => remove(id)}
            />
          </Group>
        </Group>
      ))}
    </Stack>
  );
}
