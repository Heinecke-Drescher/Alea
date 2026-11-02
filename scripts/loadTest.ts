import { setTimeout as sleep } from "node:timers/promises";
import { parseArgs } from "node:util";
import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
} from "@hocuspocus/provider";
import * as Y from "yjs";
import { createRoomId } from "../shared/roomId.ts";

const { values } = parseArgs({
  options: {
    url: { type: "string", default: "ws://localhost:3001" },
    rooms: { type: "string", default: "60" },
    players: { type: "string", default: "6" },
    ramp: { type: "string", default: "10" },
    hold: { type: "string", default: "60" },
    "seed-kb": { type: "string", default: "1000" },
  },
});

function positiveInteger(name: keyof typeof values) {
  const value = Number(values[name]);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`--${name} must be a positive integer`);
  }
  return value;
}

const rooms = positiveInteger("rooms");
const playersPerRoom = positiveInteger("players");
const rampSeconds = positiveInteger("ramp");
const holdSeconds = positiveInteger("hold");
const seedKilobytes = positiveInteger("seed-kb");
const syncUrl = new URL("/sync", values.url).href;
// The server accepts only connections whose origin matches its own host.
const origin = new URL(values.url.replace(/^ws/, "http")).origin;

const CURSOR_INTERVAL_MS = 50;
const REPORT_INTERVAL_MS = 10_000;

// The provider creates its socket with `new` and only passes the address.
function OriginWebSocket(address: string) {
  return new WebSocket(address, { headers: { origin } });
}

const stats = {
  latencies: [] as number[],
  loopLags: [] as number[],
  connected: 0,
  disconnects: 0,
};

function randomCoordinate() {
  return Math.round(Math.random() * 2000);
}

const timers: NodeJS.Timeout[] = [];
const sockets: HocuspocusProviderWebsocket[] = [];

function every(milliseconds: number, action: () => void) {
  // Started at a random moment, so players do not all act at once.
  const start = setTimeout(() => {
    action();
    timers.push(setInterval(action, milliseconds));
  }, Math.random() * milliseconds);
  timers.push(start);
}

function joinPlayer(roomId: string, index: number) {
  const document = new Y.Doc();
  // Each player has its own connection, like a browser tab.
  const socket = new HocuspocusProviderWebsocket({
    url: syncUrl,
    WebSocketPolyfill: OriginWebSocket,
    onClose: () => {
      stats.disconnects += 1;
    },
  });
  sockets.push(socket);
  const provider = new HocuspocusProvider({
    websocketProvider: socket,
    name: roomId,
    document,
  });
  provider.attach();
  const synced = new Promise<void>((resolve) => {
    provider.on("synced", () => resolve());
  });
  return synced.then(() => {
    stats.connected += 1;
    play(provider, document, index);
    return document;
  });
}

function play(provider: HocuspocusProvider, document: Y.Doc, index: number) {
  const { awareness } = provider;
  if (!awareness) throw new Error("Provider has no awareness");
  const player = `load-${index}`;
  awareness.setLocalStateField("player", {
    id: player,
    name: player,
    color: "blue",
  });
  const cells = document.getMap("cells");
  const strokes = document.getMap("strokes");
  const rolls = document.getArray("rolls");
  const probe = document.getMap<number>("loadProbe");

  probe.observe((event) => {
    for (const key of event.keysChanged) {
      const sentAt = probe.get(key);
      if (key !== player && sentAt !== undefined) {
        stats.latencies.push(performance.now() - sentAt);
      }
    }
  });

  every(CURSOR_INTERVAL_MS, () =>
    awareness.setLocalStateField("cursor", {
      x: randomCoordinate(),
      y: randomCoordinate(),
    }),
  );
  // Painting cells writes to the room while the pointer moves.
  every(5_000, () => {
    let painted = 0;
    const brush = setInterval(() => {
      const x = Math.round(randomCoordinate() / 50);
      const y = Math.round(randomCoordinate() / 50);
      cells.set(`${x},${y}`, { x, y, color: "red" });
      painted += 1;
      if (painted === 20) clearInterval(brush);
    }, CURSOR_INTERVAL_MS);
  });
  // A pen stroke is written once, when the pointer is released.
  every(7_000, () => {
    const id = crypto.randomUUID();
    const points = Array.from({ length: 200 }, randomCoordinate);
    strokes.set(id, { id, color: "red", points });
  });
  every(30_000, () =>
    rolls.push([{ name: player, color: "blue", sides: 20, result: 12 }]),
  );
  every(2_000, () => probe.set(player, performance.now()));
}

async function openRoom() {
  const roomId = createRoomId();
  const [first, ...others] = await Promise.all(
    Array.from({ length: playersPerRoom }, (_, index) =>
      joinPlayer(roomId, index),
    ),
  );
  if (!first || others.length !== playersPerRoom - 1) {
    throw new Error("Room opened without its players");
  }
  // Like a map with an image and tokens.
  first
    .getMap("images")
    .set(
      "load-seed",
      `data:image/webp;base64,${"A".repeat(seedKilobytes * 1024)}`,
    );
}

function percentile(sorted: number[], share: number) {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * share))];
}

let lastLoopCheck = performance.now();
// A late timer shows that this script itself is too busy to measure.
setInterval(() => {
  const now = performance.now();
  stats.loopLags.push(now - lastLoopCheck - 100);
  lastLoopCheck = now;
}, 100);

let openRooms = 0;
const startedAt = performance.now();
setInterval(() => {
  const latencies = stats.latencies.toSorted((a, b) => a - b);
  const seconds = Math.round((performance.now() - startedAt) / 1000);
  const median = percentile(latencies, 0.5)?.toFixed(0) ?? "-";
  const p95 = percentile(latencies, 0.95)?.toFixed(0) ?? "-";
  const lag = Math.max(0, ...stats.loopLags).toFixed(0);
  console.log(
    `${seconds}s rooms ${openRooms} players ${stats.connected}/${openRooms * playersPerRoom} ` +
      `latency median ${median} ms p95 ${p95} ms disconnects ${stats.disconnects} script lag ${lag} ms`,
  );
  stats.latencies = [];
  stats.loopLags = [];
}, REPORT_INTERVAL_MS);

console.log(
  `${rooms} rooms with ${playersPerRoom} players, one more every ${rampSeconds} s, against ${syncUrl}`,
);
for (let room = 0; room < rooms; room += 1) {
  await openRoom();
  openRooms += 1;
  if (room < rooms - 1) await sleep(rampSeconds * 1000);
}
await sleep(holdSeconds * 1000);
for (const timer of timers) clearInterval(timer);
for (const socket of sockets) socket.destroy();
process.exit(0);
