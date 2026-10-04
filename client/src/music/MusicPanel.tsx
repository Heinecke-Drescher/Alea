import { Button, Group, Stack, TextInput } from "@mantine/core";
import { IconPlayerPlay, IconPlayerStop } from "@tabler/icons-react";
import { useState } from "react";
import { videoIdFromUrl } from "../room/music";
import { useRoom } from "../room/RoomContext";
import { useMusic } from "../room/useMusic";
import { MusicPlayer } from "./MusicPlayer";

export function MusicPanel() {
  const room = useRoom();
  const music = useMusic();
  const [link, setLink] = useState("");
  const videoId = videoIdFromUrl(link);

  function setMusic() {
    if (!videoId) throw new Error("Set music without a valid link");
    room.setMusic(videoId);
    setLink("");
  }

  return (
    <Stack gap="xs">
      <Group gap="xs" align="flex-end" wrap="nowrap">
        <TextInput
          label="YouTube link"
          placeholder="https://www.youtube.com/watch?v=…"
          value={link}
          onChange={(event) => setLink(event.currentTarget.value)}
          error={link !== "" && !videoId && "Not a YouTube video link"}
          flex={1}
        />
        <Button variant="light" disabled={!videoId} onClick={setMusic}>
          Set
        </Button>
      </Group>
      {music && (
        <>
          <MusicPlayer
            key={`${music.videoId}-${music.playing}-${music.at}`}
            music={music}
          />
          {music.playing ? (
            <Button
              variant="light"
              leftSection={<IconPlayerStop size={16} />}
              onClick={room.stopMusic}
            >
              Stop for everyone
            </Button>
          ) : (
            <Button
              variant="light"
              leftSection={<IconPlayerPlay size={16} />}
              onClick={room.playMusic}
            >
              Play for everyone
            </Button>
          )}
        </>
      )}
    </Stack>
  );
}
