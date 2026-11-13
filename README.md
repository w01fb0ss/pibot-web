# Pi Bot 官网

Pi Bot 的中英文官网：https://pibot.leen-zhou-cn.workers.dev

- `public/index.html`：首页，六段（首屏 · 三台设备 · 能做什么 · 你说了算 · 三步上手与下载 · 常见问题）。2026-11-13 按 App 的活泼风格改版：首屏是 Bot 阵容，每段一个颜色（`styles.css` 的 `tone-*`），软卡片、彩色图标块，能力区是七张卡的 bento。颜色只用 `product-tokens.css` 和 `styles.css` 顶部的站点 token。
- 语言和外观：`display-init.js`（首屏前定好 `lang` / `data-theme`）+ `display.js`（切换、记住、`?lang=&theme=`）；中文是源文案，英文在 `translations.js` 按文本节点替换，新增或改动中文时同一次加英文。
- `public/downloads.js`：下载区三张卡（桌面 / 手机 / 执行端），各一个「下载」菜单；平台、链接和测试状态都读 `public/releases.json`。
- `public/product/`：编译自 `../PiBot` 的 App 前端（演示数据，`demo/`），只用来截首页截图，不部署（负责人 2026-11-12 去掉了产品导览页，`/tour` 301 回首页）。
- `public/assets/shots/`：首页用的 App 实际界面截图（演示数据），每张分中英文、浅深色，webp + jpg。
- `public/assets/flow/`：数据流转视频与四个场景的静态图。

```sh
npm run dev            # 本地预览 http://127.0.0.1:4173
npm run sync:product   # App 前端更新后重新生成截图来源（同时同步主题和图标）
npm run capture:shots  # 用本机 Chrome 无头重截 public/assets/shots（需要 npm run dev 在 4173，没开会自动起）
npm run build          # 生成 dist/
npm run deploy         # 构建并部署到 Cloudflare（首次需 npx wrangler login）
```

首页截图来自 `public/product/`（本地预览）：`product/index.html?scene=<场景>&lang=<zh|en>&theme=<light|dark>`。`scripts/capture-shots.mjs` 经 DevTools 协议驱动已安装的 Chrome（`/Applications/Google Chrome.app`，可用 `--chrome` 或 `CHROME` 换路径；不加 npm 依赖），每个场景截一张完整 App 窗口（1280×800，1.5 倍，即 1920×1200），中英文 × 浅深色，各出 webp 和 jpg：`<场景>-<zh|en>-<light|dark>.{webp,jpg}`。场景：`team`（首屏）、`plan`、`browser`、`preview`、`connectors`、`routine`、`computer`、`memory`、`audit`；只重截几个用 `--scenes plan,memory`。卡片里的裁切不在图上做，而是 `styles.css` 的 `.crop-<场景>`（`--zoom` 放大倍数、`--focus` 放大的锚点），换图后看一眼卡片即可。

App 更新后的顺序：`npm run sync:product` → `npm run capture:shots` → 本地预览检查 → 提交。

## 下载与测试状态（`public/releases.json`）

`platforms` 的每个键是一个下载选项：`mac-x64`、`mac-arm64`、`windows`、`linux`（桌面），`android`（手机），`runner-windows`、`runner-mac`、`runner-linux`（执行端）。每项：

```json
{ "url": null, "label": "macOS · Intel 芯片", "detail": "首发时提供", "status": "testing", "version": "0.0.4" }
```

- `status`：`tested`（已测试）/ `testing`（测试中）/ `untested`（未实机测试），缺省或写错按 `untested` 显示。「已测试」= 这个版本已在该平台实际安装并跑通。
- `version`（可选）：`status` 针对的版本。`tested` 且 `version` 和顶层 `version` 不一致时，页面显示「测试中」，换版本后需要重新测过再改。
- `url`：没有时点选项弹「即将发布」对话框；有 https 地址或站内 `downloads/` 时直接下载，`detail` 显示在选项下面。
- `../PiBot/tools/release/publish.mjs --launch` 只改 `url`、`detail` 和顶层 `status` / `version`，保留 `status` 等其他字段；执行端还没有发布流程，地址手动填。

## 待处理

- 主项目欢迎页 `welcome.apps.body` 的文案已过时，改完后运行 `npm run sync:product`。
- 数据流转视频和场景图里的文字只有中文；英文页面在说明里标注了「labels in Chinese」。
- `og:image` 用正式域名 pibot.space 的绝对地址。
