import path from "node:path";
import { Database } from "@hocuspocus/extension-database";
import { Server } from "@hocuspocus/server";
import { createRoomStorage } from "./roomStorage.ts";

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`Invalid PORT: ${process.env.PORT}`);
}
const dataDirectory = path.resolve(process.env.DATA_DIR ?? "data");
const storage = createRoomStorage(path.join(dataDirectory, "rooms"));

const server = new Server({
  port,
  extensions: [
    new Database({
      fetch: ({ documentName }) => storage.load(documentName),
      store: ({ documentName, state }) => storage.save(documentName, state),
    }),
  ],
});
await server.listen();
console.log(`Rooms are saved in ${dataDirectory}`);
