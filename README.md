# Pi Bot 官网

Pi Bot 的中英文官网：https://pibot.leen-zhou-cn.workers.dev

- `public/index.html`：首页，六段（首屏 · 三台设备 · 能做什么 · 你说了算 · 三步上手与下载 · 常见问题）。
- `public/tour.html`：「看看实际界面」，产品导览直接编译自 `../PiBot` 的 App 前端，用的是演示数据（`demo/`）。
- `public/assets/shots/`：首页用的 App 实际界面截图（演示数据），每张分中英文、浅深色，webp + jpg。
- `public/assets/flow/`：数据流转视频与四个场景的静态图。

```sh
npm run dev            # 本地预览 http://127.0.0.1:4173
npm run sync:product   # App 前端更新后重新生成导览（同时同步主题和图标）
npm run build          # 生成 dist/
npm run deploy         # 构建并部署到 Cloudflare（首次需 npx wrangler login）
```

首页截图来自导览页面：`product/index.html?scene=<场景>&lang=<zh|en>&theme=<light|dark>`，用无头浏览器按固定尺寸截取。导览更新后如需换图，按同样的场景和裁切重新截取。

正式发布时，在 `public/releases.json` 里填好各平台的安装包地址。

## 待处理

- 主项目欢迎页 `welcome.apps.body` 的文案已过时，改完后运行 `npm run sync:product`。
- 数据流转视频和场景图里的文字只有中文；英文页面在说明里标注了「labels in Chinese」。
- `og:image` 用正式域名 pibot.space 的绝对地址。
