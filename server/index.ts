import { existsSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { Database } from "@hocuspocus/extension-database";
import { Server } from "@hocuspocus/server";
import sirv from "sirv";
import { isSameOrigin } from "./origin.ts";
import { createRoomStorage } from "./roomStorage.ts";

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`Invalid PORT: ${process.env.PORT}`);
}
const dataDirectory = path.resolve(process.env.DATA_DIR ?? "data");
const storage = createRoomStorage(path.join(dataDirectory, "rooms"));

const MAX_MESSAGE_BYTES = 10 * 1024 ** 2;

// Token images must stay embedded (data:), so other players cannot make
// everyone's browser load images from a third-party server. The only
// third-party frame is YouTube's privacy-enhanced player for room music.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "img-src 'self' data: blob:",
  "frame-src https://www.youtube-nocookie.com",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

const { values: options } = parseArgs({
  options: { client: { type: "string" } },
});
const serveClient = options.client ? createClientHandler(options.client) : null;

function createClientHandler(directory: string) {
  const root = path.resolve(directory);
  if (!existsSync(path.join(root, "index.html"))) {
    throw new Error(`No index.html in ${root}. Run "npm run build" first.`);
  }
  return sirv(root, {
    single: true,
    setHeaders: (response, pathname) => {
      response.setHeader("Content-Security-Policy", CONTENT_SECURITY_POLICY);
      response.setHeader("X-Content-Type-Options", "nosniff");
      // Built assets have a content hash in their name and never change.
      response.setHeader(
        "Cache-Control",
        pathname.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "no-cache",
      );
    },
  });
}

const server = new Server({
  port,
  websocketOptions: { maxPayload: MAX_MESSAGE_BYTES },
  extensions: [
    new Database({
      fetch: ({ documentName }) => storage.load(documentName),
      store: ({ documentName, state }) => storage.save(documentName, state),
    }),
  ],
  onConnect: ({ requestHeaders }) => {
    if (!isSameOrigin(requestHeaders)) {
      throw new Error("Rejected connection from a foreign origin");
    }
    return Promise.resolve();
  },
  onRequest: ({ request, response }) => {
    if (!serveClient) return Promise.resolve();
    serveClient(request, response);
    // Rejecting tells Hocuspocus that the request is already answered.
    return Promise.reject();
  },
});
await server.listen();
console.log(`Rooms are saved in ${dataDirectory}`);
if (serveClient) console.log(`Open http://localhost:${port}`);
