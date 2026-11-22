# 15 · 自建中继

> 部署中继需要 Pi Bot 的源代码（已在 [GitHub](https://github.com/w01fb0ss/PiBot) 开源）。这里记录从源码部署和验证的步骤。

手机和执行端连电脑时，能直连就直连（局域网或打洞，见第 11 章）；直连不通时经**中继**转发。中继只转发端到端加密的数据，看不到聊天、文件和审批内容，也不保存消息。默认用官方中继 `wss://relay.pibot.space`。想完全用自己的服务，可以把中继部署到自己的 Cloudflare 账号上。

## 中继能看到什么

- 能看到：连接的 IP、连接时间、帧大小、两端是否在线。
- 看不到：消息、文件、审批和密钥——内容由两端的 Noise 协议加密，中继没有解密的钥匙。
- 不保存：没有账号、不存消息、不存推送令牌；不写应用日志，关闭了 Cloudflare 的可观测性和遥测。
- 官方中继额外按天汇总连接次数（不含房间号和 IP），自建时可以保留或去掉（见下面「统计」）。

## 准备

- 一个 Cloudflare 账号（免费套餐即可：中继用的 Durable Objects 走免费的 SQLite 类型，不产生应用存储）。
- 一个托管在 Cloudflare 上的域名，用来给中继一个固定的 `wss://` 地址，例如 `relay.example.com`。
- Pi Bot 的开源仓库、Node（版本见仓库的 `.nvmrc`）和 pnpm。
- 想让手机收到推送（审批、任务完成）时，需要一个 Expo 访问令牌；不配也能用，只是没有推送。

## 部署

1. 在仓库根目录安装依赖，进入中继目录：

   ```sh
   pnpm install
   cd apps/relay
   ```

2. 登录 Cloudflare（Wrangler 的配置和日志都放在仓库的 `.cache/wrangler` 里，不写你的主目录，也不发送 Wrangler 遥测）：

   ```sh
   node tools/wrangler.ts login
   ```

3. 编辑 `wrangler.jsonc`：
   - `name` 改成你自己的 Worker 名，例如 `my-pibot-relay`；
   - `routes` 里的 `relay.pibot.space` 改成你的域名，例如 `{ "pattern": "relay.example.com", "custom_domain": true }`。

4. （可选）配置推送用的 Expo 令牌，按提示粘贴：

   ```sh
   node tools/wrangler.ts secret put EXPO_ACCESS_TOKEN
   ```

5. 部署：

   ```sh
   pnpm run deploy
   ```

   如果账号不支持 Rate Limiting 绑定，改用备用环境（限流退回内存计数）：

   ```sh
   node tools/wrangler.ts secret put EXPO_ACCESS_TOKEN --env memory
   pnpm run deploy --env memory
   ```

部署完成后，中继地址就是 `wss://relay.example.com`。

## 检查是否可用

在浏览器里打开 `https://relay.example.com/room/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`（房间号必须是 43 位），返回 400 或 426（参数不对 / 不是 WebSocket 升级）说明 Worker 已经在你的域名上运行。真正的连接要靠下面的客户端配置来验证：配置完成后，设置 › 设备 里应显示「已连接」。

## 让 Pi Bot 用自建中继

电脑、手机、执行端三处必须用**同一个**中继。

1. **电脑**：设置 › 设备 ›「高级」，选「自建中继」，在「中继地址（wss://）」里填 `wss://relay.example.com`。地址必须是 `wss://`，不能带账号、密码、查询参数或片段。
2. **手机**：中继地址在扫码配对时由电脑带给手机。换中继后，在电脑上重新「添加设备 › 手机（扫码）」，用手机重新扫码配对。
3. **执行端**：电脑在「添加执行端」给码，粘贴到执行端即可。码里带自建中继，配对后自动记住。换中继后重新配对。

## 统计

官方中继有一个按天汇总连接次数的 `STATS` 对象（只有日期 × 角色 × 房间类型的计数，没有标识）。自建时不需要可以在 `wrangler.jsonc` 里删掉 `STATS` 绑定；已经部署过的迁移标签（`migrations`）只能追加、不能改。

## 更新

拉取新版本的仓库代码后，在 `apps/relay` 里重新运行 `pnpm run deploy`。迁移只追加，已部署的数据不受影响（中继本身不存业务数据）。

## 本机试运行

开发或排查时可以在本机启动：

```sh
cd apps/relay
pnpm dev        # 只监听 127.0.0.1
```

本机地址是 `ws://127.0.0.1:<端口>`，只用于开发；正式使用必须是 `wss://`。

## 用 Docker 运行中继和 STUN

如果不想使用 Cloudflare 账号，仓库提供了单镜像部署。在仓库根目录运行 `pnpm --filter @pibot/relay image`，然后编辑 `apps/relay/docker/docker-compose.yml`，用 `docker compose -f apps/relay/docker/docker-compose.yml up -d` 启动。镜像用 workerd、Caddy 和可选的 coturn 运行中继与 STUN，Durable Object 数据和 Caddy 证书都放在 `/data`，不写访问日志。公网用 `TLS_MODE=public` 和公网 `DOMAIN` 自动申请 Let's Encrypt 证书；内网用 `TLS_MODE=internal`，把日志打印的根证书安装到电脑和执行端；自有证书用 `TLS_MODE=certificate`、`TLS_CERT` 和 `TLS_KEY`。443 被占用时把 `HTTPS_PORT` 改成 8443，需要时调整 `STUN_PORT` 或设 `ENABLE_STUN=0`。手机暂时不能信任内网自签根证书，手机连接请使用公网模式。
