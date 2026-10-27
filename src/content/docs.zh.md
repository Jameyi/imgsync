## 快速开始

ImgSync 是五个面向电商商品图的单任务工具。每个工具都在你的浏览器里运行：解码、处理、编码全在本地完成，图片不会被上传。

完成一次任务只需三步：

1. 从[工具列表](/tools)打开你要用的工具。
2. 把图片拖到上传区 —— PNG、JPEG 或 WebP 都可以。defringe 只接 PNG 与 WebP，因为它处理的是透明通道。
3. 调那一个真正重要的参数，然后下载结果。

没有账号、没有排队、没有水印。关掉标签页就什么都不剩，因为根本没有任何地方存过东西。

## 五个工具

| 工具 | 做什么 | 产物 | 说明 |
| --- | --- | --- | --- |
| [白底转透明](/tools/remove-white-background) | 让白色或近白背景变透明 | 带 alpha 的 PNG | 从边缘做 flood fill，商品内部的白色不会被挖掉 |
| [去白边](/tools/defringe-edges) | 抠图边缘残留的白边去掉 | 带 alpha 的 PNG | 任何抠图之后都建议再跑一遍 |
| [压缩到指定体积](/tools/compress-to-size) | 命中指定的 KB 体积 | JPEG | 搜出能装下的最高画质；下限 5 KB |
| [缩放到平台预设](/tools/resize-to-preset) | 缩放到平台画布尺寸 | PNG | Amazon 2000×2000、Shopify 2048×2048、Instagram 1080×1080、OG 1200×630，另带自由裁切 |
| [平台预检](/tools/platform-preflight) | 按平台规则检查图片 | 通过/失败报告 | 主体占比、最小尺寸、文件体积 |

每个工具页都自带操作步骤和 FAQ，这些问答同时以 FAQPage 结构化数据发布。

## 处理原理

- **解码**在浏览器里完成。图片先转成像素，再以 RGBA 缓冲区交给算法。
- **算法是纯函数**，放在 `src/lib/image-core/`：进像素出像素，不碰 DOM、不发网络请求、没有隐藏状态，所以可以逐像素做单元测试。
- **大图交给 Web Worker**。达到 400 万像素（4,000,000 像素）的图片放到主线程之外处理，页面不会卡。
- **编码用 Canvas / OffscreenCanvas**。结果转成 Blob、就地预览，再交给你下载。文件从未离开这个页面。

## 隐私

- 图片从不上传。没有服务端图片处理、没有存储、没有和文件绑定的账号。
- 浏览器本地存储只记一件事：你选了浅色还是深色主题。
- 不使用广告 cookie，也不使用跨站标识。若开启聚合页面指标，其中不含任何文件内容。
- 指向合作方或联盟站点的出站链接遵循对方自己的隐私政策，你的文件信息不会被转发。

## SEO 与索引

- 每个页面都有自己的标题、描述、canonical 地址，以及页面专属的分享图（1200×630，由 `/api/og` 渲染）。
- 结构化数据与可见内容一致：全站有 WebSite 与 SoftwareSourceCode，嵌套页面有 BreadcrumbList，可见 FAQ 旁边有 FAQPage，文章页有 Article。
- `sitemap.xml` 列出公开路由；`robots.txt` 允许抓取以便爬虫读取页面级指令，预览构建输出 `noindex` 且 sitemap 为空。
- 爬虫口径：搜索与引用类爬虫放行（OAI-SearchBot、ChatGPT-User、ClaudeBot、PerplexityBot、Google-Extended），训练与采集类爬虫封禁（GPTBot、anthropic-ai、Bytespider、CCBot、meta-externalagent）。
- `llms.txt` 为答案引擎概括站点，工具页的写法也按“可以被引用并署名”来写。

## 自托管

引擎以 MIT 协议开源。克隆仓库后本地运行：

```bash
git clone https://github.com/Jameyi/imgsync.git
cd imgsync
pnpm install
cp .env.example .env.local
pnpm dev
```

开发服务器跑在 `http://localhost:6553`。`NEXT_PUBLIC_URL` 必须是完整源站地址，例如 `https://imgsync.civlensai.com` —— 它在构建时内联，决定 canonical、sitemap 与分享图。

上线前跑一遍检查：

```bash
pnpm check      # lint + typecheck + 单元测试 + 生产构建
pnpm test:seo   # 针对运行中的生产服务器做 HTTP 检查
```

`pnpm test:seo` 支持 `SEO_CHECK_URL`，可以直接指向已部署的站点。

## 使用限制

- 平台规则随时可能变。预设与预检阈值反映的是写作时已公布的规则，发布前请再核对一次。
- 压缩是有损的。目标体积达不到时，给出的是最接近的结果和一句说明，而不是悄悄把画质砸掉。
- 抠图基于颜色容差、且从边缘起算。复杂背景仍然需要手工处理。
- defringe 只重算“半透明且紧邻全透明”的边缘像素。实心区域、alpha 值与尺寸都不动。
- 没有 AI 分割、没有图层编辑器、没有 PSD 导出。每个工具只做一件事。
- 批量处理尚未上线 —— 目前一次处理一张。

## 获取支持

缺陷反馈与功能需求都发到 issue tracker：[Jameyi/imgsync](https://github.com/Jameyi/imgsync/issues)。请附上所用工具、浏览器版本，以及期望结果与实际结果的差异。

接下来的计划是批量处理、更多平台预设，以及 PNG/WebP 压缩目标。
