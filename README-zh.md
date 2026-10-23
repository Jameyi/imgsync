# ImgSync

免费、纯浏览器端的图像工具。所有文件都在你自己的浏览器内用 Canvas 与 Web Worker 完成——不上传、不需要账号、无跟踪。

> ImgSync 的站点骨架基于 [wangrunlin/seo-nextjs-starter](https://github.com/wangrunlin/seo-nextjs-starter)（MIT）二次开发；图像引擎与产品本身为 ImgSync 原创。

## 功能规划（详见 docs/PRD.md）

- **纯本地处理** —— 图片不离开设备；站点无后端、无数据库。
- **纯函数图像引擎** —— `lib/image-core` 暴露统一接缝 `process(input: ImageData, options)`，并作为独立 npm 包发布。
- **一工具一路由** —— `/tools/[slug]` SSG 路由，含 how-to 步骤、FAQ schema 与相关工具内链。
- **SEO 基础设施** —— 继承 starter 的逐页 canonical/OG、路由化 sitemap/robots、动态分享图、JSON-LD 与 hreflang。

## 快速开始

使用 Node.js 22.x 与 pnpm 11.24.0。

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

访问 `http://localhost:6553`。

## 常用脚本

| 命令 | 用途 |
|---|---|
| `pnpm dev` | 开发服务器（端口 6553） |
| `pnpm build` / `pnpm start` | 生产构建 / 启动 |
| `pnpm test` | 单元测试（node:test） |
| `pnpm test:seo` | 针对生产服务器的 HTTP SEO 检查 |
| `pnpm check` | lint + typecheck + test + build |

## 项目文档

- [docs/PRD.md](docs/PRD.md) —— 产品需求与工具清单
- [docs/CODING_RULES.md](docs/CODING_RULES.md) —— 模块边界与依赖规则
- [docs/Testing_Strategy.md](docs/Testing_Strategy.md) —— 测试矩阵与验收标准

## 许可

[MIT](LICENSE)。基于 SEO Next.js Starter 二次开发，按许可要求保留原版权声明。
