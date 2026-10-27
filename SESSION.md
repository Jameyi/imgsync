# SESSION.md — 项目当前状态

> 更新日期：2026-10-27（**正式上线**：https://imgsync.civlensai.com 可公开访问）。仅记录状态与下一步，不记录对话细节与零散改动。

## 已完成里程碑

- [x] 项目文档体系落地：docs/CODING_RULES、Testing_Strategy 本地化；MVP 拆解为 T0a–T8（用户已确认）
- [x] 地基：`config/tools.ts` 5 工具注册表；`lib/image-core/types.ts`（PixelBuffer）；`lib/tools/runtime.ts`（4MP 分流、track、loadImageFromFiles）
- [x] **F01 remove-white-background 纵切（T1a–T1g）**：算法纯函数 + 编排/Worker + `/tools/[slug]` SSG 页 + guide/FAQPage + 联盟位（enabled:false）→ `pnpm check` 全绿
- [x] UI demo（/prototype/demo，吸收参考用，T8 删除）
- [x] **T2 compress-to-size 纵切（F10）**：`compressToSize` 算法 → 编排 → Workbench 页面 → guide/FAQPage → `pnpm check` 全绿
- [x] **T3 defringe-edges 纵切（F08）**：`defringeEdges` 白混合反解算法 → 双路径编排 → Workbench → guide → `pnpm check` 全绿
- [x] **T4 resize-to-preset 纵切（F02）**：`resizeToPreset` contain 双线性缩放 → 双路径编排 → Workbench（4 平台预设）→ guide → `pnpm check` 全绿
- [x] **T3+T4 已提交**：commit `745867d`（17 文件 +2035 行）；git local 身份已配置（Jameyi）
- [x] **T5 platform-preflight 纵切（F09）**：`checkPreflight` 报告型算法（subjectRatio/boundingBox/checks）→ 双路径编排 → 报告渲染 Workbench（File.size 第三条 check + 失败内链 resize 修复漏斗）→ **MVP 5 工具全部完成**；已提交 `a395c46`
- [x] **T6 首页真实化**：`page.tsx` 重写（starter 落地页 → hero 定位句 + 5 张注册表驱动工具卡 + 信任条 + FAQ），JSON-LD/canonical 保留；BDD 场景 LIVE 门控（离线 skip）；已提交 `04f2198`；`pnpm check` 全绿
- [x] **用户实测反馈两轮修复（已提交）**：compress-to-size 目标体积改有界滑条（min 5KB / max=原图大小，`LoadedImage.fileSizeBytes`，`475b987`）；resize-to-preset 增 Photoshop 式自由裁切（`cropToBox` 纯函数 + 8 向控制点/边/整体移动 + Enter/Apply 确认 → 原生分辨率预览 → 确认制下载，`7d274bd`）；`pnpm check` 全绿（98 单测）
- [x] **UI 改造：Warm Precision 设计系统（用户选定 deepseek demo 方案）**：全局令牌（暖纸底/信号橙/Instrument Sans+Serif/JetBrains Mono/明暗双主题）→ 首页重写（kicker hero + 棋盘格对比卡 + preflight band + 工具网格 + FAQ/CTA）→ Header/Footer（sticky 毛玻璃导航 + 主题切换 + 四栏 footer）→ 5 工具页 bench 框架；提交链 `6e2fe89`（首页+对比卡）→ `5fb2df8`（全站 UI）；design-demo/ 两个 demo 页留存备查
- [x] **T7 E2E + SEO 回归（已提交 `4f3edba`）**：Playwright E2E 5/5（每工具主路径：canvas 生成 fixture 上传→处理→下载魔数断言 PNG/JPEG；滑条 min=5/原图上限；裁切拖拽→Apply→crop-NxM.png；preflight 三报告卡）+ sitemap 覆盖测试 2/2（indexable 全路由 / preview 空 urlset，子进程隔离）+ **修复 sitemap 缺失 5 工具路由的真实缺口**（`sitemap.ts` 相对 import 化）+ 生产模式 `test:seo` 123 项检查全过（`pnpm build` 22/22 页）
- [x] **T8 收尾清理（已提交 `e5d233c`）**：删 /prototype/demo、探针遗留与 design-demo/；引用检查后删 SeoStudio/Brand 组件（AuthorProjects/LaunchChecklist 仍被引用保留）；webpack Circular dependency 警告确认非阻塞
- [x] **SEO/GEO 合规强化（已提交 `683ea9f`）**：4 个法务页（privacy/terms/disclaimer/contact）+ footer 法务链接修正 + robots 显式放行 6 个 AI 爬虫（GPTBot/OAI-SearchBot/ClaudeBot/PerplexityBot 等）+ `public/llms.txt` + sitemap 纳入法务路由
- [x] **拖拽上传修复（已提交 `f464b11`）**：5 个 Workbench 上传区补 onDragOver/onDrop（文案 "Drop your…" 此前无实现）；Playwright 真实 drop 事件验证通过
- [x] **GitHub 开源**：仓库 `Jameyi/imgsync`，main 分支与本地同步（存量源码/文档补推完成）
- [x] **服务器部署跑通（2026-10-23）**：阿里云 `/opt/projects/imgsync` 与 civvue 并列；`docker compose --env-file .env.docker up -d --build` 成功，容器监听 3001，`curl 127.0.0.1:3001` 返回 200。关键修复：Dockerfile deps 阶段补 COPY `pnpm-workspace.yaml`（pnpm 11 的 allowBuilds 只认该文件，`22cf89e`）；compose 必须带 `--env-file .env.docker`（否则 NEXT_PUBLIC_URL 空串）
- [x] **正式上线（2026-10-27）**：https://imgsync.civlensai.com 可公开访问（HTTP/2 200）。反代与 HTTPS 落在 civvue-nginx 容器：80/443 被其独占，宿主机宝塔 nginx 处于 dead 状态不参与；在 civvue 的 nginx.conf 的 http 块内追加 imgsync 的 80/443 server 块（proxy_pass 走容器网络 imgsync:3000，imgsync 容器已接入 civvue 网络）；证书为 Cloudflare Origin 泛域名证书（仅被 CF 信任），imgsync 必须**橙云代理**浏览器才可信，灰云会报证书错误。原配置有 .bak 备份；本机留存 `deploy/imgsync-server-blocks.conf`
- [x] **上线后实测与 SEO 修复（2026-10-27，待部署）**：生产站浏览器实测 6 页（首页+5 工具）主路径全通（下载产物魔数校验）、法务页/robots/sitemap/llms/OG 图/404/hreflang 核对通过；实测查出并修复 5 个问题——①`/tools` 无索引页导致导航与面包屑 404 → 新增 `/tools` 索引页（canonical/OG/BreadcrumbList/sitemap）②GitHub 占位地址 `your-name/imgsync` → `Jameyi/imgsync`（config/Header/footer/about/contact/docs）③starter demo 页仍可索引 → `/examples*` 自动 noindex + 出 sitemap + 门禁页面表收口 ④robots 口径过宽（放行 GPTBot 训练爬虫）→ 改为“引用爬虫放行 / 训练爬虫封禁”⑤llms.txt 声称引擎已作独立库发布（未发布）→ 改为事实表述；另补首页 FAQPage schema、DEPLOY.md 更新命令漏 `--env-file` 的 bug。Cloudflare 侧：托管 robots.txt 的 AI 爬虫封禁已关闭（zone 级放开），应用 robots.txt 恢复为唯一权威；CivVue 主站 robots.ts 同步收紧（提交 `dd92b12`）。新增测试：`tests/tools-index-page.test.mjs`、`tests/robots-policy.test.mjs`（BDD 行为注释经用户确认）
- [x] **/docs 正文重写为产品文档（2026-10-27）**：删除 starter 模板叙述（Vercel 部署、Use template、示例文章、0.2 升级），改为 ImgSync 产品文档——快速开始、五个工具对照表、处理原理（纯函数算法 / 4MP Worker 阈值 / Canvas 编码）、隐私口径、SEO 与索引（爬虫放行/封禁口径、sitemap、robots、llms.txt）、自托管（Docker + `pnpm check`/`test:seo`）、使用限制、获取支持；中英双语同步（`docs.en.md` / `docs.zh.md`），侧栏目录与 `MarkdownContent` 的中文锚点映射同步更新，`/docs` 与 `/docs/zh` 的 metadata description 改写；导航 `Tools → /tools`、`Docs → /docs` 保持不变

## 当前开发实现进度

- **已上线（https://imgsync.civlensai.com）**：MVP 5 工具全部完成 + 部署 + 反代/HTTPS 打通；**本轮 SEO 修复已提交待部署**（ImgSync 4 个提交 + CivVue 1 个提交）
- 服务器架构：Cloudflare 橙云边缘（泛域名证书）→ `civvue-nginx` 容器（80/443，imgsync server 块在 nginx.conf 内）→ `imgsync` 容器（3000，已接入 civvue 网络）；`.env.docker` 配置 `NEXT_PUBLIC_URL=https://imgsync.civlensai.com`
- GitHub：`Jameyi/imgsync` main 分支停在 `22cf89e`；本地 4 个提交待推（`aa9d614` / `f7b9d79` / `1d7bcee` / 本轮测试+文档）；`prompt.txt` 未跟踪（用户要求保留）
- 验证基线：`pnpm check` 全绿（115 测试 / 88 通过 / 27 需服务器跳过 + build 25/25 页，含新 `/tools`）；生产 `pnpm test:seo` 修前失败（`/examples: sitemap index policy`）、修后待部署复测
- 已知非阻塞：webpack "Circular dependency between chunks with runtime" 警告（构建产物正常）

## 待完成任务清单

1. **部署本轮修复（一次性）**：本地 `git push origin main` → 服务器 `git pull --ff-only` + `docker compose --env-file .env.docker up -d --build` → 复测 `/tools` 200、sitemap 含 `/tools` 不含 `/examples`、robots 口径、5 工具页主路径
2. **Cloudflare www 收敛**：DNS 加 `CNAME www → imgsync.civlensai.com`（橙云）+ Redirect Rules 301 到 apex（做法见 DEPLOY.md「域名收敛」；源站泛域名证书覆盖不到 www，故在边缘做）
3. **Google Search Console 提交 sitemap**（`google-site-verification` TXT 已在 CF DNS 就位）
4. **CivVue 主站复测**：`frontend/src/app/robots.ts` 已收紧（提交 `dd92b12`），需 push + 重新构建部署后核对线上 robots.txt
5. **服务器安全加固（建议尽快）**：SSH 已见境外 IP 爆破记录——关闭密码登录只留密钥（`PasswordAuthentication no`）或装 fail2ban；admin 用户密钥登录可用，root 密码不明
6. **内容计划（上线后主线）**：20-30 篇原创文章（Amazon/eBay/Etsy 图片规格指南、工具教程），复用 `src/content/articles.ts` 结构；首批 5 篇
7. **收入路径**：上线即挂 Amazon/SaaS affiliate（`config/promos.ts` 开启 + 真实链接）→ 内容养 2-3 月 → 申 AdSense（备选 Ezoic）
8. **广告前置**：privacy-policy 补 AdSense/第三方 cookie 披露段；埋点真实端点
9. **遗留清理（并入内容计划那轮）**：`/examples*` 演示页虽已 noindex，但仍在线且在仓库里；计划彻底删除或改造成真实文章目录

## Blockers

- 无硬阻塞。上线链路已全部打通
- 本机代理连 GitHub 时通时断（`127.0.0.1:11119` 离线时 push 失败）——推送需用户代理在线
- 服务器 SSH：`admin` 用户密钥登录正常（passphrase 认证）；`root` 密码不可用（Workbench 密码登录同样失败）——服务器操作走 admin + sudo，或阿里云控制台

## 下一会话明确下一步

1. 部署本轮修复（见「待完成任务清单」第 1 项）→ 复测生产站 6 页主路径 + `test:seo`
2. Cloudflare www 收敛（DNS + 边缘 301）
3. SSH 加固：admin 登录后改 sshd_config 关密码登录（改前确认密钥可用，防锁死）
4. 启动内容计划：首批 5 篇电商图片规格指南（走既有 BDD/文档流程，先 Gherkin 行为注释确认再动代码）
5. 本地开发服务：`pnpm dev`（http://localhost:6553）
