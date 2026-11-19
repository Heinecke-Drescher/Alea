import { Anchor, Button, Center, Stack, Text, Title } from "@mantine/core";
import { useNavigate } from "react-router";
import { createRoomId } from "../../../shared/roomId";
import { RecentRooms } from "../recentRooms/RecentRooms";
import { NEW_ROOM_STATE } from "./newRoom";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <Center h="100dvh">
      <Stack align="center">
        <Title>Aleax</Title>
        <Text c="dimmed">A shared map and dice for your tabletop group.</Text>
        <Button
          size="lg"
          onClick={() =>
            navigate(`/r/${createRoomId()}`, { state: NEW_ROOM_STATE })
          }
        >
          Create room
        </Button>
        <RecentRooms />
        <Anchor href="/licenses.txt" size="xs" c="dimmed">
          Open source licenses
        </Anchor>
      </Stack>
    </Center>
  );
}
