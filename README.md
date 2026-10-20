# Pi Bot 官网

Pi Bot 的中英文官网：https://pibot.leen-zhou-cn.workers.dev

页面里的产品导览直接编译自 `../PiBot` 的 App 前端，用的是演示数据。

```sh
npm run dev            # 本地预览 http://127.0.0.1:4173
npm run sync:product   # App 前端更新后重新生成导览
npm run deploy         # 构建并部署到 Cloudflare（首次需 npx wrangler login）
```

正式发布时，在 `public/releases.json` 里填好各平台的安装包地址。

## 待处理

- 主项目欢迎页 `welcome.apps.body` 的文案已过时，改完后运行 `npm run sync:product`。
- `public/showcase.css`、`public/product-demo.css`、`public/preset-data.js` 没有被页面引用，可以删除。
- 补上 `og:image` 等分享预览信息。
