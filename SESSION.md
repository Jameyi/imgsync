# SESSION.md — 项目当前状态

> 更新日期：2026-10-27。线上：https://imgsync.civlensai.com（可公开访问）。仅记录状态与下一步。

## 已完成里程碑

- [x] **MVP 五工具上线**：remove-white-background / compress-to-size / resize-to-preset / defringe-edges / platform-preflight（算法层 `lib/image-core` 纯函数 + 编排层 `lib/tools` + `/tools/[slug]` SSG 页 + guide/FAQPage）
- [x] **站点成形**：Next.js 16 + React 19 + Tailwind 4，Warm Precision 设计系统；首页、`/tools` 索引页、5 工具页、4 个法务页、`/docs` 中英双语产品文档
- [x] **SEO/GEO 基建**：逐页 canonical/OG/JSON-LD、sitemap/robots、`llms.txt`、预览 noindex、`check-seo.mjs` 门禁、动态 OG 图
- [x] **工程基线**：`pnpm check` 全绿（115 测试 / build 25/25 页）；Playwright E2E 覆盖 5 工具主路径
- [x] **部署上线**：阿里云 Docker + civvue-nginx 容器反代 + Cloudflare 橙云边缘，2026-10-27 正式可访问
- [x] **上线后实测与修复（2026-10-27，代码已提交待部署）**：生产站 6 页主路径实测通过；查出并修掉 `/tools` 404、GitHub 占位地址、starter demo 仍可索引、robots 口径过宽、llms.txt 表述失真；`/docs` 正文由 starter 模板改写为产品文档；robots 改为"引用爬虫放行 / 训练爬虫封禁"

## 当前开发实现进度

- **功能侧无待办**：本轮修复全部落在提交里，部署后即生效
- 待推提交：ImgSync 8 个（`aa9d614` → `942009a`，含 `/tools` 索引页与真实仓库地址、robots 口径、robots 与 `/tools` 测试、部署文档修正、`/docs` 正文重写）；CivVue 1 个（`dd92b12` robots 口径）
- 服务器拓扑：Cloudflare 橙云 → civvue-nginx 容器（80/443）→ imgsync 容器（3000，civvue 网络）；`.env.docker` 中 `NEXT_PUBLIC_URL=https://imgsync.civlensai.com`
- 已知非阻塞：webpack "Circular dependency between chunks with runtime" 警告（构建产物正常）

## 待完成任务清单

1. **部署本轮修复并复测**：push → 服务器 `git pull --ff-only` + `docker compose --env-file .env.docker up -d --build` → 复测 `/tools` 200、sitemap、robots、5 工具页主路径、`test:seo`
2. **Cloudflare www 收敛**：DNS `CNAME www → imgsync.civlensai.com`（橙云）+ Redirect Rules 301 到 apex（做法见 DEPLOY.md；源站泛域名证书覆盖不到 www，故在边缘终结）
3. **CivVue 同步上线**：push + 重新构建部署，核对线上 robots.txt
4. **Google Search Console 提交 sitemap**（`google-site-verification` TXT 已在 CF DNS 就位）
5. **服务器安全加固**：SSH 关闭密码登录只留密钥 / fail2ban（admin 密钥登录已验证可用）
6. **内容计划（主线）**：首批 5 篇电商图片规格指南，复用 `src/content/articles.ts` 结构，走 BDD 流程（先 Gherkin 行为注释确认再写测试）
7. **收入路径**：`config/promos.ts` 开启真实联盟链接；privacy-policy 补第三方 cookie 披露段；埋点真实端点
8. **遗留清理**：`/examples*` 演示页彻底下线或改造成真实文章目录（并入内容计划那轮）

## Blockers

- 无硬阻塞
- 本机代理连 GitHub 时通时断（`127.0.0.1:11119` 离线时 push 失败）
- 服务器 SSH：admin 密钥登录可用、root 密码不可用 → 走 admin + sudo 或阿里云控制台
- Cloudflare 托管 robots.txt 的 AI 爬虫封禁已关闭（zone 级放开，应用 robots.txt 为唯一权威）；若日后重开，需同步改 `src/app/robots.ts` 与 `/docs` 的爬虫口径段

## 下一会话明确下一步

1. 完成清单第 1 项：部署后跑生产 6 页主路径 + `SEO_CHECK_URL=https://imgsync.civlensai.com node scripts/check-seo.mjs`
2. 完成清单第 2 项：Cloudflare www 收敛
3. 完成清单第 5 项：SSH 加固（改 sshd_config 前先确认密钥可用，防锁死）
4. 启动清单第 6 项：内容计划首批 5 篇
5. 本地开发服务：`pnpm dev`（http://localhost:6553）
