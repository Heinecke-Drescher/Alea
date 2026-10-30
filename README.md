# Alea

A shared map and dice roller for tabletop groups: tokens, drawings, fog of war
and scenes, in real time in the browser. Start Alea on your computer and send
the link to your friends.

## Host a game for your friends

You need [Node.js](https://nodejs.org/) 24 or newer.

1. Download the ZIP of the
   [latest release](https://github.com/Heinecke-Drescher/Alea/releases/latest)
   and unpack it (or `git clone` the repository).
2. In that folder, run:

   ```bash
   npm ci
   npm run build
   npm start
   ```

   Open http://localhost:3000 and create a room.

3. To let your friends in over the internet, install
   [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
   and start a [Quick Tunnel](https://try.cloudflare.com/) next to Alea:

   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

   It prints an address like `https://….trycloudflare.com`. Open your room
   through that address and send its link to your friends.

Good to know:

- The tunnel address changes every time you start it.
- Anyone who knows the address can open Alea while the tunnel runs, so stop it
  (Ctrl+C) when you are done.
- Rooms are saved in the `data` folder and are still there next time.
- In your home network, or in a virtual network such as Hamachi or ZeroTier,
  your friends can also open `http://<your-ip>:3000` without a tunnel. Your
  firewall has to let Node.js in for that network; Windows often counts
  virtual networks as public.

<details>
<summary>Run Alea on a server</summary>

On a Linux server, [`deploy/alea.service`](deploy/alea.service) runs Alea as a
systemd service: code in `/opt/alea`, rooms in `/var/lib/alea/data`, user
`alea`. A daily timer deletes rooms that have not changed for about six months.

```bash
sudo cp deploy/alea.service deploy/alea-cleanup.* /etc/systemd/system/
sudo systemctl enable --now alea alea-cleanup.timer
```

To update to the latest version, run `sudo sh /opt/alea/deploy/update.sh`.
If you build by hand, restart the server afterwards; it reads the list of
website files once at startup.

For HTTPS, put a reverse proxy in front of it. With
[Caddy](https://caddyserver.com/), which gets the certificate by itself, the
whole `Caddyfile` is:

```
alea.example.com {
	reverse_proxy localhost:3000
}
```

| Variable   | Default  | Meaning                           |
| ---------- | -------- | --------------------------------- |
| `PORT`     | `3000`   | Port of the server                |
| `DATA_DIR` | `./data` | Folder where the rooms are stored |

The server refuses to start if a value is invalid. Each room is one file in
`<DATA_DIR>/rooms/`; to back up or move all rooms, copy that folder.

</details>

<details>
<summary>Development</summary>

```bash
npm install
npm run dev
```

Open http://localhost:5173. `npm run dev` starts the website (Vite) and the
sync server together.

| Command                | What it does                     |
| ---------------------- | -------------------------------- |
| `npm test`             | Runs the tests in watch mode     |
| `npm run typecheck`    | Checks the TypeScript types      |
| `npm run lint`         | Lints the code with oxlint       |
| `npm run format`       | Formats all files with Prettier  |
| `npm run format:check` | Checks formatting without fixing |

| Folder                         | Contents                                                       |
| ------------------------------ | -------------------------------------------------------------- |
| `client/`                      | The website: React, Mantine and Konva                          |
| `client/src/room/`             | Room state in Yjs and its rules; the only code that changes it |
| `client/src/room/connection/`  | Connection to the sync server, cursors and pings               |
| `client/src/board/`            | Everything drawn on the map (Konva) and map input, by feature  |
| `client/src/dice/`, `tokens/`… | One feature off the map: its sidebar panel, menus and hooks    |
| `client/src/pages/`            | Start page, room page and the parts of its header              |
| `server/`                      | The sync server: Hocuspocus with file storage                  |
| `shared/`                      | Code used by both: room ids and the room limits                |

`board/` and the feature folders may import `room/`, never the other way round.
Components change the room only through the functions `createRoom` returns.

</details>
