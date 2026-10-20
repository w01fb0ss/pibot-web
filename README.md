# Pi Bot 官网

独立的中英文产品宣传与下载站点。字体、亮暗配色、圆角和线性图标直接同步 Pi Bot 主项目，宣传页采用原生 HTML / CSS / JavaScript，产品导览直接复用 App 的 React 组件并随静态资源打包；无第三方字体、无遥测。没有改动 PiBot 应用项目。

## 本地运行

Node.js 22 或更高版本，无需安装依赖。

```sh
npm run dev
```

打开 http://127.0.0.1:4173 。可通过 `PORT=4180 npm run dev` 指定其他端口。

## 构建与部署

```sh
npm run build
npm run preview
```

把 `dist/` 部署到任意静态托管服务即可。站点内全部使用相对路径，部署在域名根路径或子路径（如 GitHub Pages 的 `/仓库名/`）都可以。推送到 `main` 后，`.github/workflows/pages.yml` 会运行 `npm run build` 并把 `dist/` 发布到 GitHub Pages；导览已预先构建在 `public/product/`，CI 不需要安装依赖。更新导览须在本地运行 `npm run sync:product` 后提交。GitHub Pages 不能设置响应头，`scripts/serve.mjs` 里的 CSP 等安全头只在本地预览和自建托管时生效。`scripts/serve.mjs` 仅为本地预览服务。正式托管应配置 HTTPS、安全响应头及安装包大文件支持。

## 首发时启用下载

页面不展示内部里程碑。当前没有已发布版本，下载按钮展示对应平台的待发布说明，演示内容明确标注为场景示意。

发布后编辑 `public/releases.json`，将 `status` 改为 `published`，填写真实 `version`，为可用平台填写 `url` 和 `detail`：

```json
{
  "status": "published",
  "version": "实际发布版本",
  "platforms": {
    "mac": {
      "url": "downloads/实际安装包文件名.dmg",
      "label": "macOS",
      "detail": "实际架构 · 最低系统版本 · 文件大小"
    },
    "windows": { "url": null, "label": "Windows", "detail": "即将发布" },
    "linux": { "url": null, "label": "Linux", "detail": "即将发布" }
  }
}
```

安装包放入 `public/downloads/`，或者使用实际的 HTTPS 下载地址。未填写 URL 的平台继续显示待发布状态。构建会校验本地安装包是否存在。页面根据可用下载更新发布提示与下载按钮，首发前仍需核对产品文案、支持平台、系统要求和发布说明。

当前每个平台提供一个主下载入口；需要多架构时，可把该平台 URL 指向正式的架构选择下载页。不要把开发包作为正式版本。

## 中英文与外观

导航栏提供中文 / English 和浅色 / 深色 / 跟随系统切换。首次访问按浏览器语言与系统外观显示；手动选择保存在浏览器本地，刷新恢复。预先应用外观以减少亮暗闪烁。

宣传文案、导航、FAQ、下载弹窗、无障碍标签、页面标题与描述均有中英文。`public/translations.js` 保存官网文案，`public/display.js` 管理偏好与切换，`public/product-tokens.css` 原样复用主项目主题变量，`public/styles.css` 定义官网布局，`public/display.css` 定义语言与外观控件。

产品导览使用 App 原有的翻译和主题，并与官网双向同步；职业、角色和群的双语展示字段从 App 内置模板生成。用户填写的聊天消息保留原文。新窗口查看链接携带当前语言和外观，演示数据不连接 App 本机数据。

## 产品导览：直接使用 App 前端

轮播顺序：欢迎页 → 选择职业 → 主界面 → 团队协作 → 规划与子任务 → Bot 浏览器 → 教它做一次 → Git 改动 → 文件预览 → 连接应用 → 技能与记忆 → 待办 → 调度 → 记录 → YOLO。支持前后翻页、页码、直接选页与方向键。

这些页面直接编译自 `../PiBot/apps/desktop/src/renderer`，使用 App 的 React 组件、CSS modules、主题 token、头像、图标和中文文案。包含真实 WelcomeFlow、ProfessionFlow、ChatScreen、Sidebar、GroupChat、SidePane（任务、改动、浏览器、预览）、FilePreviewWorkspace、ConnectorsPage、TeachPage、Bot 资料面板、Inbox、RoutinesPage、AuditLog、YoloControl 和它们的弹窗/菜单，没有再手工绘制一套产品页面。连接应用页的内置应用列表直接取自 `packages/connectors/src/builtins.ts`。

- `demo/main.tsx` 挂载 App 的 provider 和真实组件，并连接轮播切换。
- `demo/rpc.tsx`、`demo/fixtures.ts` 以浏览器内存数据替代桌面 RPC；不连接 Electron、模型、真实文件或本机应用数据。浏览器画面是示例网页帧。
- `demo/preview-files.ts` 与 `demo/files/` 是文件预览页的示例排期表（xlsx，中英文各一份）和提纲（Markdown）。
- `demo/catalog.json` 与 `demo/catalog.en.json` 从 App 自带职业、角色和群模板提取中英文展示字段，不包含人设正文、技能脚本或凭据。
- `scripts/sync-product.mjs` 从 App 已安装的 Vite/React 依赖构建导览，输出 `public/product/`；只写官网目录。
- `public/product/source-manifest.json` 记录实际引用的 App 源码路径与 SHA-256，可核对这版导览来自哪份组件。
- 导览放在同源 iframe 中，使官网的宣传页样式不影响 App 样式。手机端缩放完整桌面界面；可在新窗口打开查看。

同步当前 App 前端：

```sh
npm run sync:product
# 或指定另一个只读的 App checkout
node scripts/sync-product.mjs /absolute/path/to/PiBot
npm run build
```

需要 PiBot checkout 已安装其原有依赖；官网运行和部署只使用已生成的静态文件，不需要现场编译或安装 React。App 源码更新后重新同步即可，不必人工重画页面。

导览支持职业多选与团队创建预览、聊天示例、只规划模式下的计划与子任务、审批、调度开关、记录筛选与详情、Git 文件/diff/历史、浏览器标签与接管、xlsx 与 Markdown 多标签预览、连接应用页、YOLO 原生确认。数据只在当前导览窗口内变化，刷新恢复；所有操作都是演示。

`public/source-preview.css` 只负责官网外层轮播容器、缩放和翻页按钮。App 组件的样式声明保持源文件内容。静态托管时 `/product/` 需要允许同源嵌入、App 的内联样式和本地图片帧；Office 预览使用 WebAssembly 解析器，`script-src` 还需要 `'wasm-unsafe-eval'`，并以 `application/wasm` 返回 `.wasm`、以 JavaScript 类型返回 `.mjs`。本地预览服务已按路径配置对应 CSP。`/product/ooxml/`（约 21 MB）是同步时从 App 依赖复制的 Office 解析运行时，只在打开 Office 文件时按需加载。

## 品牌与下载

Logo 来源为 App 的 `design/canvas/Logo.dc.html`；营销插图所用头像由 `scripts/sync-avatars.mjs` 从实际 Avatar 几何、主题 token 和内置模板提取。研究员、写作搭子、小管家使用 App 支持的示例头像配置，不代表用户现有 Bot 的设置。

```sh
node scripts/sync-avatars.mjs /absolute/path/to/PiBot
```

页面不展示内部里程碑。下载入口在正式发布前保持「即将发布」，不提供开发包。

## 与主项目统一视觉

官网直接使用 `packages/ui/src/tokens.css` 的系统字体栈、黑白灰亮暗配色、品牌紫、状态色和圆角。按钮按主项目的 40px 高度、14px 字号及胶囊形处理，卡片使用 16px 圆角与细边框；导航分段控件、开关和焦点样式遵循 App。官网标题按宣传页场景调整层级，产品导览仍完整使用 App 原组件。

`npm run sync:theme` 可单独同步主题变量及 `Icon.tsx` 中使用的图标。`npm run sync:product` 也会执行这一步；`public/theme-source.json` 记录两份源文件的 SHA-256。同步只写官网目录，不改主项目，不加载第三方字体。

## 待处理

- 主项目欢迎页文案过时：`../PiBot/packages/i18n/src/zh.ts` 的 `welcome.apps.body`（及 `en.ts` 对应项）仍写「连接应用将在后续版本开放」，操作电脑和首批连接应用已合并。主项目改完后运行 `npm run sync:product` 同步导览。
- 未引用文件：`public/showcase.css`、`public/product-demo.css` 没有被页面引用；`public/preset-data.js` 只由 `scripts/sync-avatars.mjs` 生成，也没有被引用。三者都会随构建进入 `dist/`，确认后删除，删除 `preset-data.js` 时同步调整 `sync-avatars.mjs`。
- 分享预览：缺 `og:image`、`og:url`、canonical 和 Twitter 卡片。确定正式域名后用绝对地址补上。
