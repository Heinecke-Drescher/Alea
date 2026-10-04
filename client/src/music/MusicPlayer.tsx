import { AspectRatio } from "@mantine/core";
import { useState } from "react";
import { embedUrl } from "../room/music";
import type { Music } from "../room/roomStore";

// Mount anew for each change of the shared music, so the start second is taken once.
export function MusicPlayer({ music }: { music: Music }) {
  const [src] = useState(() => embedUrl(music, Date.now()));
  return (
    <AspectRatio ratio={16 / 9}>
      <iframe
        src={src}
        title="Music"
        allow="autoplay; encrypted-media"
        style={{ border: 0 }}
      />
    </AspectRatio>
  );
}
