import { useHotkeys } from "@mantine/hooks";
import { useEffect, useRef, useState } from "react";
import type { Critical } from "./criticalRoll";
import classes from "./CriticalVideo.module.css";

interface CriticalVideoProps {
  critical: Critical;
  onDone: () => void;
}

export function CriticalVideo({ critical, onDone }: CriticalVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStarted, setIsStarted] = useState(false);

  useHotkeys([["Escape", () => isStarted && onDone()]]);

  useEffect(() => {
    const timer = setTimeout(() => setIsStarted(true), critical.delay * 1000);
    return () => clearTimeout(timer);
  }, [critical.delay]);

  useEffect(() => {
    if (!isStarted) return;
    const video = videoRef.current;
    if (!video) throw new Error("Critical video is not mounted");
    // Browsers may refuse sound before the viewer has clicked anything; then it plays muted.
    video.play().catch(() => {
      video.muted = true;
      return video.play().catch(onDone);
    });
  }, [isStarted, onDone]);

  // Mounted hidden during the delay, so the video loads while the die is still flying.
  return (
    <div className={classes.overlay} hidden={!isStarted} onClick={onDone}>
      <video
        ref={videoRef}
        className={classes.video}
        src={critical.video}
        preload="auto"
        playsInline
        onEnded={onDone}
      />
    </div>
  );
}
