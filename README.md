# Alea

A shared map and dice roller for tabletop groups. Create a room, send the link
to your players and play together in real time.

- Grid map with zoom and pan
- Tokens with your own images: drag them around, rename, resize, remove
- Paint cells, draw freehand lines, erase, clear the map
- Dice from d4 to d100 with a shared roll history
- Rooms are saved to disk and survive restarts

## Requirements

- Node.js 24 or newer

## Development

```bash
npm install
npm run dev
```

Open http://localhost:5173. `npm run dev` starts the website (Vite) and the
sync server together.

Other scripts:

| Command                | What it does                     |
| ---------------------- | -------------------------------- |
| `npm test`             | Runs the tests in watch mode     |
| `npm run typecheck`    | Checks the TypeScript types      |
| `npm run lint`         | Lints the code with oxlint       |
| `npm run format`       | Formats all files with Prettier  |
| `npm run format:check` | Checks formatting without fixing |

## Production

```bash
npm run build
npm start
```

Open http://localhost:3000. A single process serves the website and the sync
server.

Restart the server after every build. It reads the list of website files once
at startup.

## Configuration

| Variable   | Default  | Meaning                           |
| ---------- | -------- | --------------------------------- |
| `PORT`     | `3000`   | Port of the server                |
| `DATA_DIR` | `./data` | Folder where the rooms are stored |

The server refuses to start if a value is invalid.

## Playing over the internet

Everyone in your local network can open `http://<your-ip>:3000`.

For a quick test over the internet, start a
[Cloudflare Quick Tunnel](https://try.cloudflare.com/) next to `npm start`:

```bash
cloudflared tunnel --url http://localhost:3000
```

It prints a public `https://….trycloudflare.com` address. Anyone who knows that
address can open the site while the tunnel runs, so stop it when you are done.

## Data and limits

- Each room is stored as one file in `data/rooms/<room-id>.ydoc`.
- To back up or move all rooms, copy the `data` folder.
- To delete a room, delete its file while the server is stopped.
- A single message to the server may be at most 10 MB. Rooms stay far below
  that, since token images are shrunk to 128 × 128 pixels.

## Project structure

| Folder    | Contents                                                     |
| --------- | ------------------------------------------------------------ |
| `client/` | The website: React, Mantine and Konva                        |
| `server/` | The sync server: Hocuspocus with file storage                |
| `shared/` | Code used by both, such as dice rolls and room id validation |
