const RINGS = 3;
const RING_DELAY_SECONDS = 0.2;
const RING_SECONDS = 0.8;
export const PING_SECONDS = (RINGS - 1) * RING_DELAY_SECONDS + RING_SECONDS;

export interface PingRing {
  // Share of the full radius.
  size: number;
  opacity: number;
}

// The rings grow out one after another and fade while they grow.
export function pingRings(seconds: number): PingRing[] {
  return Array.from({ length: RINGS }, (_, i) => {
    const grown = (seconds - i * RING_DELAY_SECONDS) / RING_SECONDS;
    if (grown <= 0 || grown >= 1) return null;
    return { size: 1 - (1 - grown) ** 2, opacity: 1 - grown };
  }).filter((ring) => ring !== null);
}
