# SESSION.md — 项目当前状态

> 更新日期：2026-11-04。线上：https://imgsync.civlensai.com（可公开访问）。仅记录状态与下一步。

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
- [x] **二批功能裁决与 PRD 修订（2026-10-29，`b69e4dc`）**：去水印因合规风险否决 → 改为 F17 擦除物体并填充（纯算法 inpainting：Telea FMM + 例证合成，避开 PatchMatch 专利）；F18 多图合成 PSD 分层导出规格定稿并**当日开发上线**；用户原意"单图拆层"按 B 方案拆出为 F19 split-layers（主体/背景两层，复用 F01 flood-fill），规格入 PRD 附录 B.4
- [x] **F18 Layered PSD Export 上线（2026-10-29，`13235c1`）**：`/tools/psd-export`——多图上传（每图一层，命名/排序/可见性）→ ag-psd 浏览器端写 PSD（大画布走 Worker）；算法接缝 `lib/image-core/psdExport.ts`；BDD 单测 8 场景（writePsd→readPsd 往返）+ E2E（8BPS 魔数断言）；TOOLS/sitemap/llms.txt 纳入；`pnpm check` 全绿（130 测试 / 27 页）+ 已部署，线上验证通过
- [x] **F03 质量滑块压缩完成（2026-10-30，`8964a84`）**：`/tools/compress`——拖滑块实时看体积（复用 F10 编码管线，`encodeAtQuality` clamp 0..1，`lib/image-core/compress.ts`）；编排层 + Worker + Workbench + guide/FAQ + TOOLS/sitemap/llms.txt 纳入；`pnpm check` 全绿（136 测试 / 28 页）——**待 push + 部署**
- [x] **F19 split-layers 完成（2026-10-30，`474633d`）**：`/tools/split-layers`——单图拆主体/背景两层 PSD（border 中值背景估计 + flood-fill，复用 F01 思路，`lib/image-core/split-layers.ts`）；BDD 7 场景全过；guide 诚实标注效果边界（纯色背景最佳，部件级细拆留三期）
- [x] **部署失败修复（2026-10-30，`8b9625a`）**：服务器构建抓出 F03 Worker 路径 bug（引用 `./compress.worker.ts`，实际文件 `compress-quality.worker.ts`；本地测试不走 worker 分支所以没暴露）——已修复并本地 build 验证（29/29 页）
- [x] **F03 + F19 部署上线（2026-10-30）**：用户 push（代理恢复）+ 服务器重建（`pnpm build` 49.9s 通过）；线上 curl 确认 `/tools/compress` 与 `/tools/split-layers` 均 200——二批工具 7 个中 3 个已上线（F18/F03/F19），站点现共 7 个工具页（build 29/29）
- [x] **Fotor 联盟推广位接入（2026-10-30）**：Rewardful 审批当日通过（30% 佣金、45 天 Cookie）；`config/promos.ts` 启用 Fotor 槽位（`https://www.fotor.com/?via=jameyi`，挂 compress/resize-to-preset）；两个过时测试断言同步更新（原「无推广位」断言 → 现「Fotor 存在」；T1g 改为分页断言有/无推广位）；`pnpm check` 全绿——**待 push + 部署**；**收款邮箱待切新 PayPal（见 Blockers）**
- [x] **F19 split-layers 移除（2026-10-30，`c8ed609`）**：快速档 flood-fill 对复杂场景效果差（deer001 森林鹿图实测）；AI 档（SAM 点击逐层）链路打通但模型加载等待久 + mask 质量/背景白洞效果不达标，用户裁定整个工具下线。删除 9 个文件（Workbench/编排/worker/算法/测试）+ sam-web 依赖 + 44MB 模型资产；`next.config.ts` 加 308 `/tools/split-layers` → `/tools` 保外链权重；`pnpm check` 全绿（137 测试 / 28 页）+ test:seo 93 项过。PRD 附录 B.4 规格作废，勿再开发
- [x] **/tools 索引页分组折叠（2026-11-04，`67686e0`）**：7 工具按功能分 4 组（Background & cutouts / Compression & size / Marketplace compliance / PSD & layers），原生 `<details>/<summary>` 折叠（零 JS、SSR 链接保持可爬取）；分组字段 `category` 落在 TOOLS 注册表作单一数据源
- [x] **F17 擦除物体并填充上线（2026-11-04，`67a0301`，待部署）**：`/tools/erase-object`——画笔涂抹（笔刷 8/16/32 + 撤销栈 + 红罩预览）→ Telea 式填充 → 导出 PNG。算法接缝 `lib/image-core/telea-inpaint.ts`（`inpaintFill`）+ `brush.ts`（`stampBrush`，mask 不可变支撑撤销）；编排层 Worker 调度沿用既有模式。流程：算法层 TDD 红绿切片 + 真图最小验证（deer001 实测 49ms，Telea 档定位"小区域清理"，大区域/纹理涂抹伪影如实记档）→ BDD 空测试确认 → 编排/UI 纵切；`pnpm check` 全绿（149 测试 / 29 页）。**例证合成档（纹理保持）留第二迭代**，stripe 测试已 skip 留档

## 当前开发实现进度

- **本地领先远端 5 个提交（待 push + 部署）**：F17 擦除物体（`67a0301`）、/tools 分组折叠（`67686e0`）、AI 抠图路线归档 docs（`76e8635`）等；线上停在 `c8ed609`
- 二批工具进度：**F17 / F18 / F03 已开发完成，F19 已移除**（站点 8 个工具页，build 29/29，本地）；F17 例证合成档留第二迭代
- 服务器拓扑：Cloudflare 橙云 → civvue-nginx 容器（80/443）→ imgsync 容器（3000，compose 双网络）；`.env.docker` 含 `NEXT_PUBLIC_URL` 与 GA ID
- 已知非阻塞：webpack "Circular dependency" 警告；遗留 lint warnings（法务页未用 import）
- 联盟收款链路：PhotoRoom（Dub）+ Fotor（Rewardful）已接线；**Fotor 佣金经 PayPal 发放，收款邮箱当前为默认 contact@civlensai.com，旧 PayPal 已永久关闭 → 需新号后于 Rewardful 后台改绑，否则首笔（min $25 月结）打款失败**
- **工程教训**：①新增 Worker 引用后，push 前必须本地跑 `pnpm build`（F03 根因）；②大功能先最小验证再写产品代码（F19/SAM、AI 抠图两次教训确立）

## 待完成任务清单

1. **push + 部署本地积压**（5 个提交：F17 + /tools 分组折叠 + docs；推前确认代理在线；部署务必 `docker compose --env-file .env.docker build --no-cache imgsync && docker compose --env-file .env.docker up -d imgsync`，否则 GA 丢）；部署后线上复验 `/tools/erase-object` 200、`/tools` 分组折叠渲染、GA 仍在
2. **【押后讨论】复杂背景 AI 抠图路线**（2026-11-04 验证后搁置）：目标"复杂背景多主体完整抠出"。已验证三个显著性模型（u2netp/u2net/isnet，结论：边缘+遮挡+低对比主体全部丢失）；要多主体完整需 YOLO 检测两段管线，但 COCO 80 类对"任意电商商品"有覆盖缺口。重启时二选一：YOLO 两段管线 vs isnet 上线 AI 档主打单主体
3. **PayPal 新号注册 + Rewardful 收款邮箱改绑**：旧 PayPal 已永久关闭；注册中国站（paypal.com/c2）新号 → 绑卡验证（旧卡可能未释放，需联系 PayPal 客服或换卡）→ 生效后回 Rewardful 后台把 payout email 改为新号邮箱（第一笔 min $25 打款前完成）
4. **内容计划二批**：含 remove.bg 关停替代时效文（**12 月 1 日前发**，时间敏感）；其余按 GSC 曝光选题
5. Amazon Associates：内容二批上线后申请
6. 观察收录：GSC 报告 + GA4 实时/漏斗事件（promo_click 已开始积累）
7. **F17 例证合成档**（第二迭代，非阻塞）：纹理保持（stripe 测试已留档），大区域填充质量提升

## Blockers

- 无硬阻塞
- **PayPal 收款卡点**：旧 PayPal 账号已永久关闭（客服确认）；新中国账号注册中（中国站 paypal.com/c2，国家需选中国）；未改绑 Rewardful 收款邮箱前，Fotor 首笔佣金（min $25 月结）会打款失败挂起
- 本机代理连 GitHub 时通时断（`127.0.0.1:11119` 离线时 push 失败）——push 前先确认代理
- 服务器 SSH：admin 密钥登录可用、root 密码不可用 → 走 admin + sudo 或阿里云控制台

## 下一会话明确下一步

1. push + 部署本地 5 个积压提交（见待办第 1 项的完整命令与复验清单）
2. 内容二批：remove.bg 关停替代时效文（12 月 1 日前发）+ 按 GSC 曝光补选题
3. PayPal 新号注册收尾（中国站 c2，国家=中国）→ 绑卡验证 → Rewardful 后台改 payout email；旧卡提示已使用则找客服释放或换卡
4. 本地开发服务：`pnpm dev`（http://localhost:6553）
