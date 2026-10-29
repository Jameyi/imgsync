# SESSION.md — 项目当前状态

> 更新日期：2026-10-28（晚间收尾）。线上：https://imgsync.civlensai.com（可公开访问）。仅记录状态与下一步。

## 已完成里程碑

- [x] **MVP 五工具上线**：remove-white-background / compress-to-size / resize-to-preset / defringe-edges / platform-preflight（算法层 `lib/image-core` 纯函数 + 编排层 `lib/tools` + `/tools/[slug]` SSG 页 + guide/FAQPage）
- [x] **站点成形**：Next.js 16 + React 19 + Tailwind 4，Warm Precision 设计系统；首页、`/tools` 索引页、5 工具页、4 个法务页、`/docs` 中英双语产品文档
- [x] **SEO/GEO 基建**：逐页 canonical/OG/JSON-LD、sitemap/robots、`llms.txt`、预览 noindex、`check-seo.mjs` 门禁、动态 OG 图
- [x] **工程基线**：`pnpm check` 全绿（115 测试 / build 25/25 页）；Playwright E2E 覆盖 5 工具主路径
- [x] **部署上线**：阿里云 Docker + civvue-nginx 容器反代 + Cloudflare 橙云边缘，2026-10-27 正式可访问
- [x] **上线后实测与修复（2026-10-27，代码已提交待部署）**：生产站 6 页主路径实测通过；查出并修掉 `/tools` 404、GitHub 占位地址、starter demo 仍可索引、robots 口径过宽、llms.txt 表述失真；`/docs` 正文由 starter 模板改写为产品文档；robots 改为"引用爬虫放行 / 训练爬虫封禁"
- [x] **修复已部署并复测通过（2026-10-28）**：8 个修复提交 + `391253a` compose 网络根治（imgsync 声明外部 civvue 网络，`up -d --build` 重建不再丢网络导致 502）全部上线；线上复测 `/tools` 200、robots 新口径、sitemap 15 条 URL、llms.txt 产品化版本均正确
- [x] **内容计划首批 + SEO/GEO 强化 + 残留清理（2026-10-28 已部署）**：5 个提交（`03c035e`…`bfb747d`）上线——/articles 5 篇电商图片指南（SSG + Article/BreadcrumbList/FAQPage JSON-LD + 可见 FAQ 问答区）、llms.txt 增 Guides 段、隐私页联盟披露、漏斗埋点接线 GA4（TrackBridge，无 GA ID 时 no-op）、starter 残留清理（Header/Footer GitHub 链接删除，导航换 Guides；Contact 改 mailto contact@civlensai.com；AuthorProjects 简化）。验证：pnpm check 全绿（94 单测 + 26 页）+ test:seo 93 项过；线上 sitemap 20 条 URL、文章页 200
- [x] **邮件转发打通（2026-10-28 实测）**：contact@civlensai.com → hanboxgame@zohomail.cn（CivVue 时期已在 CF Email Routing 配好，含 legal@/privacy@，本次发信实测确认）
- [x] **GA4 本地接线完成（2026-10-28）**：measurement ID `G-MGY84D47M8` 已入本机 `.env.local`；隐私政策两处口径对齐 GA4（`be7d31d`，本地未推）；服务器侧待配置（见待办）
- [x] **GA4 上线生效（2026-10-29）**：修复构建参数缺口（`fa4e8b2`——compose/Dockerfile 补声明 `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` build arg，此前 `.env.docker` 里的 ID 进不了构建、线上全 CACHED 跑的无 GA 版本）；服务器重建后 `pnpm build` 真实执行，线上首页源码已含 `G-MGY84D47M8`（curl 确认 2 处），漏斗事件开始上报
- [x] **PhotoRoom 推广位上线（2026-10-29，`87edd0c`）**：联盟申请当日获批（Dub 平台），`config/promos.ts` 启用 Photoroom 槽位（20% 首购佣金、`refer.photoroom.com/jameyi`，挂 remove-white-background 工具页，SPONSORED 标签 + rel=sponsored + promo_click 埋点齐备）；测试同步（promos 3/3）+ `pnpm check` 全绿 + 已部署；线上 curl 确认推广卡渲染（Photoroom ×6、SPONSORED、推荐链接 ×2）

## 当前开发实现进度

- **线上与本地有 1 个提交差距**：`be7d31d`（隐私政策 GA4 口径）本地已提交未推送；GA4 上线验证未完成（见待办 1）
- GA4 状态：measurement ID `G-MGY84D47M8` 已入本机 `.env.local`；**服务器 `.env.docker` 尚未写入该 ID**，线上页面 Network 面板无 `g-MGY84D47M8` 请求、GA4 实时报告无用户——即线上还在跑无 GA 版本
- 服务器拓扑：Cloudflare 橙云 → civvue-nginx 容器（80/443）→ imgsync 容器（3000，compose 声明双网络：imgsync_default + civvue_civvue-network）；`.env.docker` 中 `NEXT_PUBLIC_URL=https://imgsync.civlensai.com`
- 已知非阻塞：webpack "Circular dependency between chunks with runtime" 警告（构建产物正常）

## 待完成任务清单

1. ~~Cloudflare www 收敛~~ **已关闭（2026-10-28 用户裁定方案 A）**：`www.imgsync.civlensai.com` 为二级子域，不在 CF Universal SSL（仅 apex + 一级子域）覆盖内，边缘证书需 ACM $10/月——判定不值得，已删除试验 CNAME；规范域名唯一为 `imgsync.civlensai.com`（canonical/sitemap 已一致），勿再为 www 子域建 DNS 记录
2. ~~CivVue 同步上线~~ **已完成（2026-10-28）**：`dd92b12` robots 口径修复已 push 并在服务器重建 civvue-frontend（`--env-file .env.prod`，frontend 单服务 rebuild，nginx/backend 未动）；线上 civlensai.com/robots.txt 新口径已验证。注意：CivVue 的 env 文件是本次新落的 `/opt/projects/civvue/.env.prod`（从运行容器反向提取），ADMIN_TOKEN 已轮换（2026-10-28，新值仅在服务器 .env.prod，未记录）
3. ~~Google Search Console 提交 sitemap~~ **已完成（2026-10-28）**：资源已验证，sitemap 已提交，首页+5 工具页已请求编入索引；新文章页随下次抓取自动发现
4. ~~服务器安全加固~~ **已完成（用户确认，2026-10-28）**：SSH 已关密码登录只留密钥
5. **收入路径（进行中）**：
   - [x] 邮件转发 contact@civlensai.com → zohomail（已实测打通）
   - [x] GA4 本地接线（.env.local 已配 `G-MGY84D47M8`，隐私口径已对齐）
   - [x] GA4 上线生效（2026-10-29，`fa4e8b2` 修复构建参数缺口后重建，漏斗事件已开始上报）
   - [x] **PhotoRoom 联盟已获批并上线（2026-10-29 当日完成闭环）**：remove.bg 2026-12-01 关停并入 Canva，弃用；替代者 PhotoRoom（20% 首购佣金、30 天 Cookie、Dub 平台）——申请经 Dub Partners 提交（网站 imgsync.civlensai.com 已 TXT 验证，记录在 `imgsync` 子域），当日获批；Referral link `refer.photoroom.com/jameyi` 已配置进 `config/promos.ts` 并部署上线（见里程碑 `87edd0c`）
   - [ ] **Fotor 联盟（2026-10-29 用户裁定：今天先不申请，待办提醒）**——25-35% 首购+续费、45 天 Cookie、Rewardful 平台，门槛最低；申请入口 `https://fotor-1.getrewardful.com/signup`（3 分钟），通过后挂 compress/resize 工具页
   - [ ] Amazon Associates——等内容二批上线后再申请（需 180 天内出 3 单保留资格）
6. **内容计划二批（主线）**：10-15 篇长尾细化（平台拆分/场景拆分/工具教程深化），2-4 周后按 GSC 曝光词选题；走 BDD 流程
7. ~~遗留清理~~ **已完成（2026-10-28）**：`/examples*` 已删，`/articles` 真实文章目录已上线

## Blockers

- 无硬阻塞
- 本机代理连 GitHub 时通时断（`127.0.0.1:11119` 离线时 push 失败）——`be7d31d` 推送依赖代理在线
- 服务器 SSH：admin 密钥登录可用、root 密码不可用 → 走 admin + sudo 或阿里云控制台
- Cloudflare 托管 robots.txt 的 AI 爬虫封禁已关闭（zone 级放开，应用 robots.txt 为唯一权威）；若日后重开，需同步改 `src/app/robots.ts` 与 `/docs` 的爬虫口径段

## 下一会话明确下一步

1. **查 PhotoRoom 审批邮件（提醒）**：审批结果 1-3 天内发 contact@civlensai.com（转发至 zohomail）——通过则拿 Dub 后台的 Referral link 交给 AI 配置 `config/promos.ts` 上线推广位；被拒则把拒信理由发给 AI 分析对策
2. **Fotor 联盟申请（待办，今日未申请）**：入口 `https://fotor-1.getrewardful.com/signup`（约 3 分钟），通过后挂 compress/resize 工具页
3. 内容计划二批：2-4 周后按 GSC 曝光数据选题（10-15 篇）；可加入 remove.bg 关停替代类时效选题
4. Amazon Associates：内容二批上线后申请
5. 观察收录：GSC「效果」与「网页索引」报告，2-6 周内看文章页收录与 AI 引用迹象
