import { Server } from "@hocuspocus/server";

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`Invalid PORT: ${process.env.PORT}`);
}

const server = new Server({ port });
await server.listen();
