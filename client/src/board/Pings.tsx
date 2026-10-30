import { useMantineTheme } from "@mantine/core";
import { Animation } from "konva/lib/Animation";
import type { Context } from "konva/lib/Context";
import type { Shape as ShapeNode } from "konva/lib/Shape";
import { useCallback, useEffect, useRef, useState } from "react";
import { Group, Shape } from "react-konva";
import type { Awareness } from "../room/connectRoom";
import { pingKey, toPing, type Ping } from "../room/pings";
import { PING_SECONDS, pingRings } from "./pingRings";
import { useStageZoom } from "./useStageZoom";

// On screen, whatever the zoom.
const PING_RADIUS = 60;
const RING_WIDTH = 4;

function pingsIn(awareness: Awareness) {
  return Array.from(awareness.getStates())
    .map(([clientId, state]) => toPing(clientId, state))
    .filter((ping) => ping !== null);
}

interface PingRingsProps {
  ping: Ping;
  zoom: number;
  onDone: (key: string) => void;
}

function PingRings({ ping, zoom, onDone }: PingRingsProps) {
  const theme = useMantineTheme();
  const shapeRef = useRef<ShapeNode>(null);
  const [startedAt] = useState(() => performance.now());
  const color = theme.colors[ping.color][6];

  useEffect(() => {
    const layer = shapeRef.current?.getLayer();
    if (!layer) throw new Error("Ping is not on a layer");
    const animation = new Animation((frame) => {
      if (frame.time / 1000 < PING_SECONDS) return;
      animation.stop();
      onDone(pingKey(ping));
    }, layer);
    animation.start();
    return () => {
      animation.stop();
    };
  }, [ping, onDone]);

  function drawRings(context: Context) {
    const canvas = context._context;
    const seconds = (performance.now() - startedAt) / 1000;
    canvas.strokeStyle = color;
    canvas.lineWidth = RING_WIDTH / zoom;
    for (const { size, opacity } of pingRings(seconds)) {
      canvas.globalAlpha = opacity;
      canvas.beginPath();
      canvas.arc(ping.x, ping.y, (size * PING_RADIUS) / zoom, 0, 2 * Math.PI);
      canvas.stroke();
    }
    canvas.globalAlpha = 1;
  }

  return <Shape ref={shapeRef} sceneFunc={drawRings} listening={false} />;
}

interface PingsProps {
  awareness: Awareness | null;
}

// Pings of everyone, the own ones included; pings sent before the board opened are over.
export function Pings({ awareness }: PingsProps) {
  const { groupRef, zoom } = useStageZoom();
  const [shown, setShown] = useState<Ping[]>([]);

  useEffect(() => {
    if (!awareness) return;
    const seen = new Set(pingsIn(awareness).map(pingKey));
    const showNew = () => {
      const fresh = pingsIn(awareness).filter(
        (ping) => !seen.has(pingKey(ping)),
      );
      for (const ping of fresh) seen.add(pingKey(ping));
      if (fresh.length > 0) setShown((pings) => [...pings, ...fresh]);
    };
    awareness.on("change", showNew);
    return () => awareness.off("change", showNew);
  }, [awareness]);

  const done = useCallback(
    (key: string) =>
      setShown((pings) => pings.filter((ping) => pingKey(ping) !== key)),
    [],
  );

  return (
    <Group ref={groupRef} listening={false}>
      {shown.map((ping) => (
        <PingRings key={pingKey(ping)} ping={ping} zoom={zoom} onDone={done} />
      ))}
    </Group>
  );
}
