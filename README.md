# Pi Bot website

[English](#english) · [中文](#中文)

Website source and issue tracker: https://github.com/w01fb0ss/pibot-web. Cloudflare Workers Builds deploys this repository's `main` branch to the existing `pibot` Worker using `pnpm run build` and `pnpm exec wrangler deploy`. Preview builds are disabled. This repository contains the website, not the Pi Bot desktop application's source code.

官网源码与问题反馈：https://github.com/w01fb0ss/pibot-web。Cloudflare Workers Builds 从此仓库的 `main` 分支自动构建并发布到现有 `pibot` Worker，命令分别为 `pnpm run build` 和 `pnpm exec wrangler deploy`，预览构建关闭。此仓库是官网项目，不是 Pi Bot 桌面应用源码仓库。

Deployment, language routing, preserved service bindings, verification receipts, and Google Search Console status: [Deployment and handoff guide](docs/DEPLOYMENT.md).

部署、语言路由、服务绑定、验收记录和 Google Search Console 状态，统一见 [官网部署与接力说明](docs/DEPLOYMENT.md)。Claude 接手官网时先读这份文档。

## English

The bilingual (Chinese / English) website of Pi Bot: https://pibot.space

- `public/index.html`: the homepage, six sections (hero · three devices · what it can do · you stay in control · three steps and downloads · FAQ). Redesigned on 2026-11-13 in the app's lively style: the hero is the Bot cast, each section has one colour (`tone-*` in `styles.css`), soft cards and coloured icon tiles, and the capabilities section is a seven-card bento. Colours come only from `product-tokens.css` and the site tokens at the top of `styles.css`.
- The homepages share `public/index.html`. The build generates complete static pages under `/cn/` and `/en/`, including guides, downloads, privacy, and terms. The root URL redirects using the primary `Accept-Language` preference: explicitly Simplified Chinese (`zh-CN`, `zh-SG`, or `zh-Hans`) selects `/cn/`; every other preference, including Traditional Chinese or an absent header, selects `/en/`. Explicit locale URLs keep their language. Language buttons preserve the current page. Preference redirects are not cached; old Chinese page URLs permanently redirect to `/cn/` and legacy `?lang=en` legal links redirect to `/en/`.
- `public/downloads.js`: the three download cards (desktop / phone / runner), each with one Download menu; platforms, links and test status are read from `public/releases.json`.
- `content/guides/`: the public manual, adapted from the app's `docs/guide/`. `scripts/build-manual.mjs` resolves chapter links and uses the reviewed screenshots in `public/assets/guides/`. The build generates the bilingual pages and `sitemap.xml`. Run `npm run build` then `npm run preview` to check the output locally.
- `public/product/`: the app front end compiled from `../PiBot` (demo data in `demo/`). Used only as the screenshot source and not deployed (the owner removed the product tour page on 2026-11-12; `/tour` redirects to the homepage with a 301).
- `public/assets/shots/`: real app screenshots used on the homepage (demo data), each in Chinese and English, light and dark, as webp + jpg.
- The data-flow diagrams in "three devices": one per scenario, written directly in `index.html` (lanes: phone / computer · brain / computer · files and records / model provider / runner, with numbered steps and arrows). They are real text, so language and theme follow the rest of the site; on narrow screens they become numbered lists. The owner replaced the earlier video and stills on 2026-11-13.

```sh
npm run dev            # local preview at http://127.0.0.1:4173
npm run sync:product   # regenerate the screenshot source after the app front end changes (also syncs theme and icons)
npm run capture:shots  # re-capture public/assets/shots with local headless Chrome (starts npm run dev on 4173 if it is not running)
npm run build          # build dist/
npm run deploy         # build and deploy to Cloudflare (first time: npx wrangler login)
npx wrangler deploy -c wrangler.www.jsonc  # deploy the www.pibot.space redirect
```

Homepage screenshots come from `public/product/` (local preview): `product/index.html?scene=<scene>&lang=<zh|en>&theme=<light|dark>`. `scripts/capture-shots.mjs` drives the installed Chrome over the DevTools protocol (`/Applications/Google Chrome.app`; change the path with `--chrome` or `CHROME`; no npm dependency) and captures one full app window per scene (1280×800 at 1.5×, i.e. 1920×1200), Chinese and English × light and dark, as webp and jpg: `<scene>-<zh|en>-<light|dark>.{webp,jpg}`. Scenes: `team` (hero), `plan`, `browser`, `preview`, `connectors`, `routine`, `computer`, `memory`, `audit`; re-capture only some with `--scenes plan,memory`. Card crops are not baked into the images but set by `.crop-<scene>` in `styles.css` (`--zoom` magnification, `--focus` anchor point); check the cards after replacing images.

After an app update: `npm run sync:product` → `npm run capture:shots` → check in the local preview → commit.

### Downloads and test status (`public/releases.json`)

Each key in `platforms` is one download option: `mac-x64`, `mac-arm64`, `windows`, `linux` (desktop), `android` (phone), `runner-windows`, `runner-mac`, `runner-linux` (runner). Each entry:

```json
{ "url": null, "label": "macOS · Intel 芯片", "detail": "首发时提供", "status": "testing", "version": "0.0.4" }
```

- `status`: `tested` / `testing` / `untested` (not tested on real hardware); missing or invalid values show as `untested`. "Tested" means this version was actually installed and run through on that platform.
- `version` (optional): the version `status` refers to. If `status` is `tested` but `version` differs from the top-level `version`, the page shows "testing"; re-test after a version change before updating it.
- `url`: when absent, choosing the option opens the "coming soon" dialog; with an https address or an on-site `downloads/` path it downloads directly, and `detail` is shown under the option.
- `../PiBot/tools/release/publish.mjs --launch` changes only `url`, `detail` and the top-level `status` / `version` (runner entries included) and keeps `status` and every other field.

### Update feed (`public/updates/`)

`stable.json` and `latest*.yml` are the desktop app's update feed, written by `publish.mjs`; the installers themselves are served from the R2 bucket under `https://pibot.space/downloads/<version>/`.

Website download clicks go through `/download-click/<version>/<file>`. The Worker records a daily count for the product, version, platform and architecture before redirecting to the R2 download. Use an existing stats token to read `GET /_stats?kind=downloads` for totals by version and daily details. The optional `from=YYYY-MM-DD` parameter narrows the retained 400-day window. Direct file requests and app updates do not count as website clicks.

The home page and download page show cumulative website download-button clicks across all versions. `GET /api/download-stats` (also `HEAD`) returns the UTC reporting period, total, product and platform/architecture totals, and any unclassified count. The download counter seeds a bounded lifetime aggregate from existing daily records once, then updates it atomically with each click; daily retention cannot reduce this cumulative total. History already deleted before this migration cannot be recovered. Responses are cached for 5 minutes. No token, daily rows, update checks or historical release identifiers are exposed. Unavailable statistics show a message rather than a misleading zero; download links remain usable. The authenticated `/_stats` interface and its retained daily records are unchanged.

### To do

- The main project's welcome copy `welcome.apps.body` is outdated; run `npm run sync:product` after it changes.

## 中文

Pi Bot 的中英文官网：https://pibot.space

- `public/index.html`：首页，六段（首屏 · 跨设备 · 能做什么 · 权限与隐私 · 三步上手与下载 · 常见问题）。2026-11-13 按 App 的活泼风格改版：首屏是 Bot 阵容，每段一个颜色（`styles.css` 的 `tone-*`），软卡片、彩色图标块，能力区是七张卡的 bento。颜色只用 `product-tokens.css` 和 `styles.css` 顶部的站点 token。
- 中英文首页共用 `public/index.html`。构建生成 `/cn/` 和 `/en/` 下的完整静态页面，包括指南、下载、隐私政策和服务条款。根地址根据浏览器 `Accept-Language` 首选语言跳转：只有明确的简体中文（`zh-CN`、`zh-SG`、`zh-Hans`）进入 `/cn/`，其他语言（含繁体中文）或没有语言请求头均默认 `/en/`。直接访问语言地址不会再自动切换；语言按钮保留当前页面。自动跳转不缓存，旧中文页面永久跳转到 `/cn/`，旧法律页面 `?lang=en` 链接转到 `/en/`。
- `public/downloads.js`：下载区三张卡（桌面 / 手机 / 执行端），各一个「下载」菜单；平台、链接和测试状态都读 `public/releases.json`。
- `content/guides/`：从 App 的 `docs/guide/` 整理出的官网手册。`scripts/build-manual.mjs` 转换章节链接，并使用 `public/assets/guides/` 中已检查的截图。构建时生成中英文页面与 `sitemap.xml`，本地可先运行 `npm run build`，再运行 `npm run preview` 检查。
- `public/product/`：编译自 `../PiBot` 的 App 前端（演示数据，`demo/`），只用来截首页截图，不部署（负责人 2026-11-12 去掉了产品导览页，`/tour` 301 回首页）。
- `public/assets/shots/`：首页用的 App 实际界面截图（演示数据），每张分中英文、浅深色，webp + jpg。
- 「跨设备」里的数据流转图默认打开桌面任务，四个场景各一张，直接写在 `index.html` 里（泳道 手机 / 电脑 · 大脑 / 电脑 · 文件与记录 / 模型服务商 / 执行端，编号步骤和箭头），是真实文字，中英文和深浅色跟着全站走；窄屏变成编号列表。负责人 2026-11-13 去掉了原来的视频和静态图。

```sh
npm run dev            # 本地预览 http://127.0.0.1:4173
npm run sync:product   # App 前端更新后重新生成截图来源（同时同步主题和图标）
npm run capture:shots  # 用本机 Chrome 无头重截 public/assets/shots（需要 npm run dev 在 4173，没开会自动起）
npm run build          # 生成 dist/
npm run deploy         # 构建并部署到 Cloudflare（首次需 npx wrangler login）
npx wrangler deploy -c wrangler.www.jsonc  # 部署 www.pibot.space 的永久跳转
```

首页截图来自 `public/product/`（本地预览）：`product/index.html?scene=<场景>&lang=<zh|en>&theme=<light|dark>`。`scripts/capture-shots.mjs` 经 DevTools 协议驱动已安装的 Chrome（`/Applications/Google Chrome.app`，可用 `--chrome` 或 `CHROME` 换路径；不加 npm 依赖），每个场景截一张完整 App 窗口（1280×800，1.5 倍，即 1920×1200），中英文 × 浅深色，各出 webp 和 jpg：`<场景>-<zh|en>-<light|dark>.{webp,jpg}`。场景：`team`（首屏）、`plan`、`browser`、`preview`、`connectors`、`routine`、`computer`、`memory`、`audit`；只重截几个用 `--scenes plan,memory`。卡片里的裁切不在图上做，而是 `styles.css` 的 `.crop-<场景>`（`--zoom` 放大倍数、`--focus` 放大的锚点），换图后看一眼卡片即可。

App 更新后的顺序：`npm run sync:product` → `npm run capture:shots` → 本地预览检查 → 提交。

### 下载与测试状态（`public/releases.json`）

`platforms` 的每个键是一个下载选项：`mac-x64`、`mac-arm64`、`windows`、`linux`（桌面），`android`（手机），`runner-windows`、`runner-mac`、`runner-linux`（执行端）。每项：

```json
{ "url": null, "label": "macOS · Intel 芯片", "detail": "首发时提供", "status": "testing", "version": "0.0.4" }
```

- `status`：`tested`（已测试）/ `testing`（测试中）/ `untested`（未实机测试），缺省或写错按 `untested` 显示。「已测试」= 这个版本已在该平台实际安装并跑通。
- `version`（可选）：`status` 针对的版本。`tested` 且 `version` 和顶层 `version` 不一致时，页面显示「测试中」，换版本后需要重新测过再改。
- `url`：没有时点选项弹「即将发布」对话框；有 https 地址或站内 `downloads/` 时直接下载，`detail` 显示在选项下面。
- `../PiBot/tools/release/publish.mjs --launch` 只改 `url`、`detail` 和顶层 `status` / `version`（包括执行端），保留 `status` 等其他字段。

### 更新源（`public/updates/`）

`stable.json` 和 `latest*.yml` 是桌面 App 的更新源，由 `publish.mjs` 写入；安装包本身放在 R2，经 `https://pibot.space/downloads/<版本>/` 提供。

官网点击下载时先经过 `/download-click/<版本>/<文件>`。Worker 按日期记录产品、版本、平台和架构的汇总计数，再跳转到 R2 下载地址。使用现有统计令牌访问 `GET /_stats?kind=downloads`，可以查看各版本合计和每日明细。默认提供保留期内的 400 天数据，可用 `from=YYYY-MM-DD` 缩小范围。直接访问文件和应用内更新不计入官网点击。

首页下载区和下载页公开展示全部版本累计下载按钮点击。`GET /api/download-stats`（支持 `HEAD`）返回 UTC 统计区间、总量、产品、平台/架构汇总与未分类计数。下载计数器首次从已有每日记录初始化独立累计表，此后每次点击与每日计数在同一事务内更新；每日明细过期清理不会减少累计值。迁移前已经删除的历史无法恢复。响应缓存 5 分钟，不公开令牌、每日记录、更新检查或历史版本标识。计数不可用时显示暂不可用，不显示假零，也不影响下载。原 `/_stats` 令牌鉴权及每日明细保持不变。

### 待处理

- 主项目欢迎页 `welcome.apps.body` 的文案已过时，改完后运行 `npm run sync:product`。


## Built-in Gmail OAuth / 内置 Gmail OAuth

The Worker serves both `pibot.space` and `auth.pibot.space`. Configure a Google **Web application** OAuth client with the exact authorized redirect URI:

```text
https://auth.pibot.space/gmail/callback
```

Google Auth Platform branding uses `https://pibot.space/`, `https://pibot.space/privacy`, and `https://pibot.space/terms`. Enable Gmail API and add your account under Test users when the consent screen is in Testing. Testing refresh tokens with Gmail scopes expire after seven days under Google's rules.

Set deployment secrets using interactive stdin, never source control or command-line values:

```sh
npx wrangler secret put GMAIL_OAUTH_CLIENT_ID
npx wrangler secret put GMAIL_OAUTH_CLIENT_SECRET
npm run deploy
```

`/gmail/start` accepts an app-generated PKCE/state and a bounded random-port loopback URL. Google returns only to the HTTPS callback above. A short-lived Durable Object record is consumed once; the callback exchanges the code and returns an AES-GCM ticket encrypted with a key derived from the private verifier. The service uses `openid email` to identify the account without adding mailbox read access for send-only connections. `/gmail/refresh` exchanges a locally stored refresh token for an access token; neither is persisted by the Worker.

本服务同时承载官网和授权域名。Google OAuth 客户端必须是「Web 应用」，授权重定向 URI 必须逐字匹配上面的 HTTPS 地址（无尾斜杠）。Google 控制台的品牌页面分别填写官网首页、隐私政策和服务条款地址；启用 Gmail API，测试模式下将测试账号加入 Test users。凭据只存 Worker secrets，不写进仓库、桌面安装包、日志或浏览器。更新本网站不会上传新的桌面安装包。


Guide search summaries live in `scripts/guide-discovery.mjs`: each chapter must have a reviewed Chinese and English summary. The same text appears in the visible lead, meta description, social preview and page structured data. The build also links related chapters in the same manual category. Keep these summaries aligned with the manual; do not invent release dates, reviews, or supported features for search markup. Existing www-to-apex redirects are managed outside this Worker; `/product/` remains an excluded screenshot source and returns 404 on the public site.

教程搜索摘要维护在 `scripts/guide-discovery.mjs`，每章需同时提供中英文摘要；正文导读、meta description、分享预览和页面结构化数据使用同一份内容。构建时补齐同分类相关教程链接。摘要须与手册一致，不为搜索标记虚构发布日期、评价或功能。现有 www 到主域名跳转由 Worker 外的规则管理；`/product/` 仅作截图来源，不发布到官网，公开访问继续返回 404。


### Search discovery / 搜索发现

- `/cn/about/` and `/en/about/` identify the product by its official domain, release and documentation links; `/cn/releases/` and `/en/releases/` use the current public `releases.json` version. No release dates or desktop source repository URLs are invented.
- Bing ownership is verified with the public `msvalidate.01` homepage tag. Keep this tag after verification.
- `pnpm deploy` builds, deploys, then sends added/changed/deleted sitemap URLs to IndexNow. The notification only includes public page URLs and domain ownership proof; it sends no visitor, app, chat or download-count data. IndexNow receipt does not mean indexing or ranking success.
- On a fresh checkout, run the build and `node scripts/indexnow.mjs --initialize` **before editing** to establish `.review/indexnow-state.json`. It is local deployment state, ignored by Git. Existing state is never overwritten by initialization. `pnpm search:preview` lists changes without a network request; `pnpm search:notify` retries a failed notification. A failed submission preserves the baseline for retry; ordinary builds/previews never submit URLs.
- `/cn/about/`、`/en/about/` 用官方域名、公开版本和文档链接说明产品身份；`/cn/releases/`、`/en/releases/` 与 `releases.json` 保持一致，不虚构发布日期或桌面应用源码仓库。
- Bing 通过首页公开的 `msvalidate.01` 标记验证所有权，验证后不要移除。
- `pnpm deploy` 构建并部署成功后，向 IndexNow 通知 sitemap 中新增、修改或删除的公开网址。只发送网址与域名验证信息，不发送访客、应用、聊天或下载统计数据；收到通知不等于收录或排名提升。
- 新检出工作区应在修改前先构建并执行 `node scripts/indexnow.mjs --initialize`，建立 Git 忽略的本地基线；`pnpm search:preview` 只预览变化，`pnpm search:notify` 可重试失败通知。失败不推进基线，普通构建和预览不发通知。

### Git-backed Cloudflare deployment / Git 仓库自动部署

The website repository has migrated to `w01fb0ss/pibot-web`; Git-triggered deployment was verified successfully. The existing Worker `pibot` tracks production branch `main`, root directory `/`, build command `pnpm run build`, and deploy command `pnpm exec wrangler deploy`. Use Node 22 or newer and pnpm 12.14.0. Keep the existing Worker, R2 bucket, Durable Object bindings and production secrets; creating a replacement Worker would disconnect the existing counters. The build does not require the Pi Bot application checkout or local screenshot-source files. See [the handoff guide](docs/DEPLOYMENT.md) for build-script approvals, the verification receipt and search-console status.

官网仓库已迁到 `w01fb0ss/pibot-web`，Git 推送触发的自动部署已验收成功。现有 Worker `pibot` 跟踪生产分支 `main`，根目录 `/`、构建命令 `pnpm run build`、发布命令 `pnpm exec wrangler deploy`。使用 Node 22 或更新版本及 pnpm 12.14.0，保留现有 Worker、R2、Durable Object 绑定和生产密钥；不要新建替代 Worker，以免统计与已有数据断开。云端构建不需要 Pi Bot 应用仓库或本机截图源文件。依赖脚本许可、验收收据及搜索后台状态见[接力说明](docs/DEPLOYMENT.md)。
