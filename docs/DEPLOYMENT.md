# 官网部署与接力说明

更新日期：2026-11-19。供 Claude、Codex 和维护者接手官网发布使用。本文记录的是官网部署，不代表重新打包或发布了 Pi Bot 应用。

## 当前来源与公开版本

- 官网源码与问题反馈：[w01fb0ss/pibot-web](https://github.com/w01fb0ss/pibot-web)，**公开仓库**，生产分支 `main`。
- 本地官网仓库的 `origin` 指向新仓库；旧 `it-works-123/pibot-web` 远端保留为 `suspended-origin`，仅作历史参考，不再用它发布。旧账号已被暂停，申诉结果未确认。
- 这里只公开官网项目，**Pi Bot 桌面应用源码尚未公开，正在准备开源**。不能将官网仓库标成应用源码仓库。
- 当前官网提供的应用版本仍为 **v0.0.1**，以 `public/releases.json` 为准。2026-11-19 负责人确认朋友在 M 系列芯片 Mac 上成功打开，macOS Apple 芯片下载项由 `untested` 改为 `tested`，中英文分别显示“已测试” / “Tested”；此反馈只证明实机启动，不代表所有功能或所有 M 系列机型已完整验收。本次变更没有重打或替换安装包；应用热更新另按发布流程维护。

## Cloudflare 生产配置

使用拥有 `pibot.space` 的个人 Cloudflare 账号，账户 ID 为 `73dc69d8dd9681761edb1f0a6184d900`。不要误用其他工作账号。

| 项目 | 当前配置 |
|---|---|
| 官网 Worker | `pibot`，配置 `wrangler.jsonc` |
| 自定义域名 | `pibot.space`、`auth.pibot.space` |
| Git 来源 | GitHub `w01fb0ss/pibot-web` |
| 生产分支 / 根目录 | `main` / `/` |
| 构建命令 | `pnpm run build` |
| 发布命令 | `pnpm exec wrangler deploy` |
| 预览构建 | 关闭 |
| 构建令牌名称 | `pibot-web-builds`，值仅由 Cloudflare 管理 |
| 包管理器 | `package.json` 锁定 `pnpm@12.14.0` |
| Node | 项目要求 >=22；本次云端实际使用 24.22.1 |
| 安装包存储 | R2 `pibot-releases`，绑定名 `RELEASES` |
| 下载 / 更新计数 | 原 `COUNTER` → `Counter` Durable Object |
| Gmail 临时授权状态 | 原 `GMAIL_AUTH` → `GmailAuth` Durable Object |

**后续推送 `main` 会自动构建和上线**。不要把未经检查的改动推到生产分支；通过 Cloudflare 部署页或 GitHub 的 `Workers Builds: pibot` 检查确认成功后，才算发布完成。

保留现有 Worker 名称、Durable Object 绑定、迁移记录、R2 桶和生产 secrets。不要为了换仓库或发新功能新建替代 Worker，也不要把官网 Worker 替换成只提供单个新接口的脚本，以免下载、统计和 Gmail 授权失效。`GMAIL_OAUTH_CLIENT_ID`、`GMAIL_OAUTH_CLIENT_SECRET`、`STATS_TOKEN` 的值不进文档、Git、构建变量或日志。GitHub token 也不进仓库或远端 URL。

`www.pibot.space` 由独立 Worker `pibot-www-redirect` 管理，配置为 `wrangler.www.jsonc`；它将请求 301 到主域名并保留路径和查询参数。此次没有改 DNS 或切换 Cloudflare 账号。

## 语言地址与旧链接

- 根地址 `/`（含 `/index.html`）根据 `Accept-Language` 的**首选、非零权重语言**返回 302：明确的简体中文 `zh-CN`、`zh-SG` 或 `zh-Hans` → `/cn/`；其他语言或无请求头 → `/en/`。繁体中文 `zh-TW` / `zh-HK` / `zh-Hant`、仅 `zh` 均不会自动进入中文。
- 自动跳转设置 `Cache-Control: private, no-store`、`Vary: Accept-Language`，避免不同访客之间复用跳转。
- `/cn/` 和 `/en/` 下均生成独立、无需 JavaScript 即有正文的首页、下载、指南、关于、版本、隐私和条款页面。显式语言地址不再按浏览器语言改跳；手动语言切换保留当前页面。
- 旧中文 `/guides/...`、`/download/`、`/about/`、`/releases/`、`/privacy/`、`/terms/` 永久 301 到对应 `/cn/` 路径；旧法律页 `?lang=en` 链接到对应 `/en/` 路径，其他查询参数保留。
- **服务接口不加语言前缀**：`/downloads/*`、`/download-click/*`、`/updates/*`、`/api/download-stats`、`/_stats`、`/gmail/*` 保持原路径。以后新增接口（如角色目录）也不能被语言跳转误接管。

对应入口：`worker/language-routing.js` 管根地址及旧路径跳转；`scripts/site-locales.mjs` 管 URL 与 hreflang；`scripts/build-homepage.mjs`、`build-search-pages.mjs`、`build-manual.mjs`、`product-identity.mjs` 生成静态页面；`public/display-init.js`、`display.js` 管显式页面语言、主题及切换。改路由时同时核对 `assets.run_worker_first`，确保根地址不会绕过 Worker 直接返回静态文件。

## 构建与本机备用发布

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm preview
```

默认本机预览端口 4173，可通过 `PORT` 指定空闲端口。开发源 `public/index.html` 仍是中文模板；验证正式语言路径应使用构建后的 `pnpm preview`。构建只需要官网仓库，不需要旁边存在应用仓库或 `public/product/` 截图源文件。重新生成截图才需要应用仓库。

`pnpm-workspace.yaml` 只允许 `esbuild@0.28.2`、`workerd@1.20261019.1` 的安装脚本。这是首轮 Cloudflare 构建 `ERR_PNPM_IGNORED_BUILDS` 的修复；升级依赖后要核对新版本，不要全局放开依赖脚本。

优先走 Git 自动构建。本机应急发布可以使用 `pnpm deploy`：先构建，再 Wrangler 发布，最后尝试 IndexNow。先用 `pnpm exec wrangler whoami` 确认账号；手动发布仍需确认代码已归档到新仓库，避免线上版本和 `main` 分叉。

## 下载统计和更新源

- `/api/download-stats` 是公开的**所有版本累计官网下载按钮点击次数**，不是去重用户、安装完成数或活跃用户。2026-11-19 按负责人要求取消 Cloudflare 聚合缓存：每次直接读取原下载计数 Durable Object，并返回 `Cache-Control: no-store`。页面在前台每 5 秒重新读取，切回页面或从往返缓存恢复时立即读取；请求禁用浏览器缓存，后台页面暂停定时读取，总数、产品和平台明细一起更新。私有 `/_stats` 继续实时读取原明细，鉴权不变。两个请求之间若有新点击，短暂差值可能来自读取时点；页面同步仍受网络延迟和五秒轮询影响，不是服务端推送。
- 累计总量由 Durable Object 持久保存；私有 `/_stats?kind=downloads` 保留按日期、版本、产品、平台、架构的明细和原鉴权。日明细保留 400 天，不应让累计总数随明细过期减少。
- 官网按钮每次实际触发会独立提交一条同源 `POST /download-click/<版本>/<文件名>`，并直接打开安装包。每条统计事件使用随机点击 ID，同一 ID 在一小时内重试只累计一次，处理新事件时清理过期 ID。统计服务不使用来源 IP。旧 `GET /download-click/*` 仍跳转到原安装包，直接访问链接、安装包分段请求和应用内更新不再增加官网点击计数。新口径生效前的历史计数原样保留。
- `/_stats` 使用 `Authorization: Bearer <STATS_TOKEN>`；未鉴权返回 404 是预期行为，不代表统计服务不存在。不要把令牌放 URL 或复制到反馈中。
- `/updates/stable.json`、`latest.yml`、`latest-mac.yml`、`latest-linux.yml` 和 R2 安装包路径保持不变。应用发布清单与平台验收状态需要走既有发布流程维护，官网改版不等于发布应用。

## 搜索发现：已完成与待办

已完成并上线：

- `https://pibot.space/sitemap.xml` 包含 `/cn/`、`/en/` 共 46 个规范页面，`robots.txt` 继续指向同一 sitemap 地址。
- 每页 canonical 指向自身语言 URL，中英文互相标记 hreflang，`x-default` 指向对应英文页。保留 Bing 所有权验证标签。
- 旧链接 301；新官网反馈链接已改为新 GitHub 仓库。
- 路由迁移后 IndexNow 返回 HTTP 200，接收 69 个变更 URL；反馈链接发布后再接收 4 个。**接收通知不等于已收录或排名提高。**

**Google Search Console 后台复核（2026-11-19）：**继续使用原 `sc-domain:pibot.space` 资源，没有重新验证或使用“地址变更”工具。

- 已重新提交 `https://pibot.space/sitemap.xml`，后台明确显示“已成功提交站点地图”，状态“成功”，已发现网页从 44 更新为 **46**；列表显示提交及上次读取日期为 2026-11-18。发现数量不等于收录数量。
- `https://pibot.space/en/`：**已收录到 Google**，上次抓取显示 2026-11-17 19:33:46，Googlebot 智能手机版抓取成功，允许抓取及索引。用户声明 canonical 为自身，Google 选择的规范网址为“所检查的网址”。本轮未重复申请已收录的英文首页。
- `https://pibot.space/cn/`：索引报告为**已发现 - 尚未编入索引**，当时无历史抓取时间。实际网址测试于后台显示的 2026-11-19 00:01:06 成功，允许抓取及索引，声明 canonical 为自身，结论“网址可编入 Google 索引”。随后点击申请，后台明确显示**“已请求编入索引”，已加入优先抓取队列**。
- 中文实际收录及 Google 最终规范网址仍待处理，不能把实时测试通过或请求成功写成已收录。本轮只逐项检查中英文首页；其余 44 页（含指南目录）已经包含在成功读取的 sitemap 中，但未逐页做 URL 检查或申请收录。后台时间按界面原值记录。

IndexNow 的两条发布路径要区分：

- **本机 `pnpm deploy`** 会尝试调用 `search:notify`；**Cloudflare Git 构建的发布命令只是 `pnpm exec wrangler deploy`，不会自动发 IndexNow 通知**。
- 需要通知搜索引擎时，在有基线的维护工作区、确认线上发布成功后执行 `pnpm search:preview` / `pnpm search:notify`。
- 新检出工作区应在修改前构建并运行 `node scripts/indexnow.mjs --initialize`。`.review/indexnow-state.json` 是本地、被 Git 忽略的基线，不要复制 secrets，也不要把一次性云构建工作区当作持久基线。

## 2026-11-18 验收收据

- 应用版本未变，8 个平台安装包 HEAD 均为 200；旧 v0.0.2 安装包测试路径返回 404。
- 12 种首选语言 / 权重组合、GET/HEAD、旧路径及服务接口排除检查通过；真实浏览器 `en-US`、`zh-CN`、`zh-TW`、`ja-JP` 分别跳到预期语言。
- 46 页 canonical / hreflang / 图片检查，以及 2300 个站内页面和资源链接检查通过；法律页手动切换保留页面，手机无横向溢出，无页面脚本报错。
- 干净检出构建通过；首轮云构建暴露依赖脚本许可问题，`e181280` 修复后，GitHub 检查 `Workers Builds: pibot` 为 `completed / success`。
- 成功构建：`56485731-4617-43a3-bad5-ad2f1c6505fb`；部署版本：`4da747af-9e5d-43d2-b118-3b44b5fe2599`；源码提交：`e1812800fb61a3b7da38442e2ca3547185b010da`。
- [Cloudflare 构建详情](https://dash.cloudflare.com/73dc69d8dd9681761edb1f0a6184d900/workers/services/view/pibot/production/builds/56485731-4617-43a3-bad5-ad2f1c6505fb)；本机完整收据和截图在官网仓库的 `.review/`，该目录不会推到公开仓库。

这些 ID 是此次首次自动发布的历史证据，不代表永远是最新部署。后续发布仍需查看最新提交的检查结果。应用侧角色库发布等并行任务不属于本次验收，不据此宣称已上传。
