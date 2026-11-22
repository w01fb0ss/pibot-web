# 15 · Self-hosting the relay

> Deploying your own relay requires the Pi Bot source code (open source on [GitHub](https://github.com/w01fb0ss/PiBot)). The steps below cover deployment and verification from source.

When the phone or a runner connects to your computer, they connect directly whenever they can (over the LAN or through NAT, see chapter 11); when a direct connection is not possible, traffic goes through the **relay**. The relay only forwards end-to-end encrypted data: it cannot see chats, files or approvals, and it stores no messages. The official relay `wss://relay.pibot.space` is the default. To use only your own infrastructure, deploy the relay to your own Cloudflare account.

## What the relay can see

- It can see: connecting IP addresses, connection times, frame sizes, and whether each end is online.
- It cannot see: messages, files, approvals or keys. Content is encrypted between the two ends with the Noise protocol, and the relay has no key.
- It stores nothing: no accounts, messages or push tokens; it writes no application logs, and Cloudflare observability and telemetry are off.
- The official relay also counts connections per day (without room IDs or IP addresses); a self-hosted relay can keep or drop that (see "Statistics" below).

## What you need

- A Cloudflare account (the free plan is enough: the relay's Durable Objects use the free SQLite-backed kind and keep no application storage).
- A domain on Cloudflare, to give the relay a fixed `wss://` address such as `relay.example.com`.
- The Pi Bot open-source repository, Node (the version in the repository's `.nvmrc`) and pnpm.
- For phone push notifications (approvals, finished tasks), an Expo access token. Without one the relay works, just without push.

## Deploy

1. Install dependencies at the repository root and go to the relay:

   ```sh
   pnpm install
   cd apps/relay
   ```

2. Sign in to Cloudflare (Wrangler's config and logs live in the repository's `.cache/wrangler`, not in your home folder, and Wrangler telemetry is off):

   ```sh
   node tools/wrangler.ts login
   ```

3. Edit `wrangler.jsonc`:
   - set `name` to your own Worker name, for example `my-pibot-relay`;
   - replace `relay.pibot.space` in `routes` with your domain, for example `{ "pattern": "relay.example.com", "custom_domain": true }`.

4. (Optional) set the Expo token for push and paste it when asked:

   ```sh
   node tools/wrangler.ts secret put EXPO_ACCESS_TOKEN
   ```

5. Deploy:

   ```sh
   pnpm run deploy
   ```

   If your account does not support the Rate Limiting binding, use the fallback environment (rate limits fall back to in-memory counters):

   ```sh
   node tools/wrangler.ts secret put EXPO_ACCESS_TOKEN --env memory
   pnpm run deploy --env memory
   ```

Your relay address is now `wss://relay.example.com`.

## Check that it works

Open `https://relay.example.com/room/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA` (a room id has 43 characters) in a browser. A 400 or 426 response (bad parameters / not a WebSocket upgrade) means the Worker runs on your domain. The real connection is confirmed by the client setup below: afterwards Settings › Devices should show "Connected".

## Point Pi Bot at your relay

The computer, the phone and every runner must use the **same** relay.

1. **Computer**: Settings › Devices › Advanced, choose **Self-hosted relay** and enter `wss://relay.example.com` under **Relay address (wss://)**. It must be `wss://`, without a user name, password, query or fragment.
2. **Phone**: the computer hands the relay address to the phone when pairing by QR code. After changing the relay, pair the phone again: on the computer use Add device › Phone (scan), then scan with the phone.
3. **Runners**: copy the code from Add runner on the computer and paste it on the runner. It includes the custom relay, saved after pairing. Pair again after changing the relay.

## Statistics

The official relay has a `STATS` object that counts connections per day (only date × role × room kind, no identifiers). A self-hosted relay that does not want it can remove the `STATS` binding from `wrangler.jsonc`; migration tags that were already deployed can only be added to, never changed.

## Updating

After pulling a new version of the repository, run `pnpm run deploy` again in `apps/relay`. Migrations are append-only and the relay keeps no application data, so nothing is lost.

## Trying it locally

For development or troubleshooting you can run it on your machine:

```sh
cd apps/relay
pnpm dev        # listens on 127.0.0.1 only
```

The local address is `ws://127.0.0.1:<port>` and is for development only; real use requires `wss://`.

## Run the relay and STUN with Docker

If you do not want a Cloudflare account, the repository includes a single-image deployment. From the repository root, run `pnpm --filter @pibot/relay image`, then edit `apps/relay/docker/docker-compose.yml` and start it with `docker compose -f apps/relay/docker/docker-compose.yml up -d`. The image runs the relay with workerd, Caddy and optional coturn; it stores Durable Object data and Caddy certificates below `/data`, and does not write access logs. Set `TLS_MODE=public` with a public `DOMAIN` for automatic Let's Encrypt certificates, `TLS_MODE=internal` for a private network (install the printed root certificate on the computer and runner), or `TLS_MODE=certificate` with `TLS_CERT` and `TLS_KEY`. Set `HTTPS_PORT=8443` when port 443 is already occupied, and set `STUN_PORT` or `ENABLE_STUN=0` as needed. The phone cannot currently trust a private self-signed root, so use the public mode for phone connections.
