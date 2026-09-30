// Browsers send the Origin header with every WebSocket connection. Accepting
// only our own origin stops other websites from connecting in the background.
export function isSameOrigin(headers: Headers) {
  const origin = headers.get("origin");
  const host = headers.get("host");
  if (!origin || !host || !URL.canParse(origin)) return false;
  return new URL(origin).host === host;
}
