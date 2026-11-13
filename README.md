# Pi Bot website

[English](#english) · [中文](#中文)

## English

The bilingual (Chinese / English) website of Pi Bot: https://pibot.space

- `public/index.html`: the homepage, six sections (hero · three devices · what it can do · you stay in control · three steps and downloads · FAQ).
- `public/product/`: the app front end compiled from `../PiBot` (demo data in `demo/`). Used only as the screenshot source and not deployed (the owner removed the product tour page on 2026-11-12; `/tour` redirects to the homepage with a 301).
- `public/assets/shots/`: real app screenshots used on the homepage (demo data), each in Chinese and English, light and dark, as webp + jpg.
- `public/assets/flow/`: the data-flow video and stills for the four scenarios.

```sh
npm run dev            # local preview at http://127.0.0.1:4173
npm run sync:product   # regenerate the screenshot source after the app front end changes (also syncs theme and icons)
npm run build          # build dist/
npm run deploy         # build and deploy to Cloudflare (first time: npx wrangler login)
```

Homepage screenshots come from `public/product/` (local preview): `product/index.html?scene=<scene>&lang=<zh|en>&theme=<light|dark>`, captured with a headless browser at a fixed size. After an app update, re-capture the same scenes with the same crops if the images need replacing.

At launch, fill in each platform's installer address in `public/releases.json`. The desktop app's update feed is `public/updates/` (`stable.json`, `latest*.yml`, written by `../PiBot/tools/release/publish.mjs`); installers are served from R2 under `https://pibot.space/downloads/<version>/`.

### To do

- The main project's welcome copy `welcome.apps.body` is outdated; run `npm run sync:product` after it changes.
- Text inside the data-flow video and stills is Chinese only; the English page notes "labels in Chinese".

## 中文

Pi Bot 的中英文官网：https://pibot.space

- `public/index.html`：首页，六段（首屏 · 三台设备 · 能做什么 · 你说了算 · 三步上手与下载 · 常见问题）。
- `public/product/`：编译自 `../PiBot` 的 App 前端（演示数据，`demo/`），只用来截首页截图，不部署（负责人 2026-11-12 去掉了产品导览页，`/tour` 301 回首页）。
- `public/assets/shots/`：首页用的 App 实际界面截图（演示数据），每张分中英文、浅深色，webp + jpg。
- `public/assets/flow/`：数据流转视频与四个场景的静态图。

```sh
npm run dev            # 本地预览 http://127.0.0.1:4173
npm run sync:product   # App 前端更新后重新生成截图来源（同时同步主题和图标）
npm run build          # 生成 dist/
npm run deploy         # 构建并部署到 Cloudflare（首次需 npx wrangler login）
```

首页截图来自 `public/product/`（本地预览）：`product/index.html?scene=<场景>&lang=<zh|en>&theme=<light|dark>`，用无头浏览器按固定尺寸截取。App 更新后如需换图，按同样的场景和裁切重新截取。

正式发布时，在 `public/releases.json` 里填好各平台的安装包地址。桌面 App 的更新源是 `public/updates/`（`stable.json`、`latest*.yml`，由 `../PiBot/tools/release/publish.mjs` 写入）；安装包放在 R2，经 `https://pibot.space/downloads/<版本>/` 提供。

### 待处理

- 主项目欢迎页 `welcome.apps.body` 的文案已过时，改完后运行 `npm run sync:product`。
- 数据流转视频和场景图里的文字只有中文；英文页面在说明里标注了「labels in Chinese」。
