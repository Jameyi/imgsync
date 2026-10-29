# PRD：PicForge（暂定名）— 电商/开发者图片合规工具站

版本：v0.1（头脑风暴收敛稿）
日期：2026-10-16
状态：Draft — 待建仓后发布到 issue tracker 并打 `ready-for-agent`

---

## 一、问题陈述（Problem Statement）

电商卖家、内容创作者和开发者每天都会遇到大量"小而硬"的图片任务：主图白底要转透明、边缘有白边要修、图片体积要压到平台限制以内、尺寸要符合平台合规占比、要批量给产品图加水印。现有工具要么功能普通不做深（iLoveIMG 类只给滑块不给精确命中），要么界面过重门槛高（Photopea），要么把最痛的环节（抠图、修边）做成收费墙。

用户要的不是"又一个编辑器"，而是**针对具体任务的、一次点击就合规的一次性工具页**——搜索进来、解决、离开。同时，市面工具普遍缺失的环节（白边去除、目标体积精确压缩、合规占比校验、多尺寸 favicon 套件）没有被任何免费站做成矩阵。

对站长（用户本人）而言，问题是如何以最低开发成本、纯前端零 API 成本的方式，构建一个可被 SEO/GEO 长尾流量养活的工具矩阵，并通过联盟营销（Canva Pro ~$36/单、remove.bg 15% 循环佣金等）变现，作为被动收入组合的组成部分。

## 二、解决方案（Solution）

构建一个纯浏览器端（零后端、零 AI API）的免费在线图片工具站：

- **16 个单任务工具页**，按三档组织：7 个及格线功能（流量入口）+ 5 个高竞争功能（差异化钩子）+ 4 个页面矩阵功能（长尾覆盖）；
- 每个工具页 = 可服务端渲染的静态 HTML + 独立 metadata/canonical/OG 图 + JSON-LD 结构化数据，服务于程序化 SEO 与 AI 搜索引用（GEO）；
- 核心图像处理引擎为独立 TypeScript 纯函数库（浏览器 Canvas + Web Worker），以开源 npm 包形式发布，形成 GitHub 分发杠杆；
- 每个工具页配套教程区块（how-to 步骤 + FAQ schema），联盟推广位（Canva / remove.bg / Shopify 生态）在用户完成工具操作后的"下一步需求"位置自然展示，明确标注为推广内容。

## 三、功能清单（三档 16 项）

### 第一梯队：及格线功能（7 项，流量入口）

| # | 功能 | 实现原理 | 难度 |
|---|------|----------|------|
| F01 | 白底转透明 PNG | 颜色容差 + flood-fill/色距计算 | 低 |
| F02 | 裁剪/尺寸调整（电商尺寸预设） | Canvas API 原生 | 低 |
| F03 | 图片压缩（质量滑块） | canvas.toBlob + 质量参数 | 低 |
| F04 | 格式转换（PNG/JPEG/WebP） | Canvas 重编码 | 低 |
| F05 | EXIF 方向修正 | 解析 EXIF 头，createImageBitmap | 中 |
| F06 | 批量处理 | Web Worker 并行 | 中 |
| F07 | 透明 PNG 边缘基础优化 | 色距→alpha 渐变映射（抗锯齿） | 中 |

### 第二梯队：高竞争差异化功能（5 项，钩子）

| # | 功能 | 为什么有竞争性 | 实现原理 |
|---|------|----------------|----------|
| F08 | 白边去除 / 去光晕（defringe） | 竞品只做"抠"不做"抠完修边"，电商卖家差评集中区；是 F01/F07 的进阶闭环 | 边缘像素按邻域色加权侵蚀 |
| F09 | 指定尺寸内最大化居中（合规占比校验） | 亚马逊主图 85% 占比、Shopify 2048×2048 等"合规校验"竞品不给 | 轮廓检测 → bounding box → 按占比缩放居中 |
| F10 | 压缩到指定 KB（精确命中） | "compress image to under 100kb" 搜索量大且精确；竞品只给滑块 | 二分搜索质量参数 + 降采样兜底，迭代到目标体积 |
| F11 | 多图对齐合成（前景/背景叠加） | "把商品放到背景模板上"电商换背景场景，纯前端可做 | 双图导入 + 蒙版 + 定位预设 |
| F12 | ICO/Favicon 多尺寸生成 | 开发者精准刚需，竞品界面老旧 | 单页生成 16/32/48/180/512 全套 + manifest 预览 |
| F17 | 擦除物体并填充（erase & fill） | "remove object from photo" 正当清洁需求（灰尘/路人/杂物），区别于高风险"去水印"；竞品多绑定 AI 或收费 | 用户画笔涂抹遮罩 → 纯算法 inpainting：小区域 Telea FMM（毫秒级预览）/ 大区域例证纹理合成（Worker 秒级），避开 PatchMatch 专利 |
| F18 | 多图合成 PSD 分层导出 | 打 Photopea"界面过重"软肋；"export layers to psd online" 长尾竞争少；与 F11 共享合成基础设施 | 多图导入（每图一层）→ ag-psd（浏览器端纯 JS 写 PSD，支持 Worker/OffscreenCanvas） |
| F19 | 单图拆层（split layers） | "split image into layers" 独立搜索意图；商品图多为纯色背景，主体/背景两层拆分纯算法可行 | 复用 F01 flood-fill 分割：背景色区域一层 + 主体一层 → ag-psd 两层 PSD；部件级细拆（连通域/语义分割）仍留三期 |

### 第三梯队：页面矩阵功能（4 项，长尾覆盖）

| # | 功能 | 定位 | 实现原理 |
|---|------|------|----------|
| F13 | 圆角/阴影/边框生成器 | 社交卡片图、博客封面长尾词 | Canvas 合成 |
| F14 | 文字水印批量加 | 摄影师/电商防盗图，搜索稳定 | Canvas 绘制 + 批量管线 |
| F15 | 色板提取 | 设计师长尾 | k-means 颜色聚类 |
| F16 | 截图设备壳（mockup） | "screenshot mockup" 词在涨，创作者刚需 | 预置设备框架素材 + 合成 |

### 发布节奏

- **MVP（验证期）**：F01、F10、F02、F08、F09（预检形态）——数据裁决版，依据见附录 A.3；
- **一期补全**：F03–F07、F11、F12（ICO/favicon 自 MVP 顺延至此，见附录 A.3）；
- **二期（2026-10-29 裁决新增）**：F17（擦除物体并填充）、F18（多图合成 PSD 分层导出）、F19（单图拆层，2026-10-29 B 方案裁定）——正式规格见附录 B；
- **矩阵期**：F13–F16。
- 每个工具上线前置条件：对应关键词有真实搜索量（挖词验证通过），且有教程内容与 JSON-LD。

## 四、用户故事（User Stories）

**电商卖家**
1. As an 电商卖家, I want 上传白底商品图一键转透明 PNG, so that 我可以把它放到任何背景的详情页上
2. As an 电商卖家, I want 抠图后自动去除边缘白边/光晕, so that 商品图放到深色背景上不会有一圈白线
3. As an 亚马逊卖家, I want 工具告诉我商品主体占画布的比例并自动缩放到 85% 合规线, so that 主图不被平台驳回
4. As an 亚马逊卖家, I want 图片自动缩放并居中到 2000×2000 画布, so that 主图符合平台尺寸要求
5. As an 电商卖家, I want 把商品图压缩到平台限制的体积（如 100KB 以下）并精确达标, so that 上传一次成功不用反复试
6. As an 电商卖家, I want 把我的商品图叠加到工厂给的背景模板上并导出, so that 不用打开 Photoshop 做简单合成
7. As an 电商卖家, I want 一次上传 20 张商品图批量加水印/转格式/压缩, so that 不需要一张一张处理
8. As an 电商卖家, I want 处理全程图片不上传服务器, so that 我的未发布商品图不会被泄露

**内容创作者 / 普通用户**
9. As a 内容创作者, I want 把截图套上设备壳并加圆角阴影, so that 发到社交媒体的图更专业
10. As a 内容创作者, I want 给博客封面图裁剪到各平台标准尺寸（OG 1200×630 等）, so that 分享卡片不裁脸
11. As a 普通用户, I want 把 HEIC/手机照片自动按 EXIF 方向摆正再处理, so that 导出的图不会横躺
12. As a 普通用户, I want 在 PNG/JPEG/WebP 之间自由转换并看到转换前后体积对比, so that 我能选最优格式
13. As a 普通用户, I want 工具页面直接可用、无注册无广告弹窗, so that 30 秒内解决我的问题

**开发者**
14. As a 开发者, I want 上传 logo 一次生成 16/32/48/180/512 全套 favicon + manifest 片段, so that 不用逐个尺寸手抠
15. As a 开发者, I want favicon 工具页直接给出 HTML 引用代码块, so that 复制粘贴即可完成接入
16. As a 开发者, I want 上传任意图提取主色板并导出 CSS 变量/tailwind 配置, so that 快速建立配色系统
17. As a 开发者, I want 核心图像处理库以 npm 包形式开源, so that 我可以在自己的项目里离线复用

**站长（运营视角）**
18. As the 站长, I want 每个工具页自动生成 canonical/OG 图/JSON-LD, so that 页面可被正确索引且不会重蹈 CivVue 无 metadata 的覆辙
19. As the 站长, I want robots.txt/sitemap 随路由自动维护、预览环境自动 noindex, so that 索引纪律不出事故
20. As the 站长, I want 每个工具页底部有 how-to 步骤 + FAQ + 对应 schema, so that 内容能被 AI 搜索引用（GEO）
21. As the 站长, I want 在工具完成后的"下一步"位置展示明确标注的联盟推广（如抠图后推荐 remove.bg）, so that 转化自然且合规
22. As the 站长, I want 四步漏斗埋点（到站→工具使用→导出完成→推广点击）, so that 我能用数据判断哪个工具有效
23. As the 站长, I want CI 自动校验 canonical/schema/sitemap 未被改坏, so that SEO 回归在部署前被拦截
24. As the 站长, I want 一键把站点提交到 alternativeto/Product Hunt 等目录所需的可信度要素（法务页、隐私说明、联系页）齐备, so that 联盟与目录申请一次通过

## 五、实现决策（Implementation Decisions）

1. **站点骨架**：基于 `wangrunlin/seo-nextjs-starter`（MIT）二次开发——它自带统一 metadata helper、路由化 sitemap/robots、动态 OG 图（/api/og）、WebSite/SoftwareSourceCode/Article/BreadcrumbList JSON-LD、hreflang、预览环境 noindex、`check-seo.mjs` CI 自检。Next.js 16 + React 19 + TS 5 + Tailwind 4。
2. **架构分层**（依赖单向）：`app/`（路由与页面）→ `lib/tools/`（各工具的编排层：状态、交互、Worker 调度）→ `lib/image-core/`（纯函数图像算法库，零 DOM 依赖、零框架依赖）→ 浏览器 Canvas/Worker API。`lib/image-core` 同时作为独立 npm 包发布（GitHub 分发杠杆），故禁止反向 import 页面代码。
3. **处理位置**：全部图像处理在浏览器本地完成（Canvas + Web Worker），不上传服务器、不调用任何第三方 AI API、不存库。这是隐私卖点，也是零边际成本的保证。
4. **核心引擎接口（测试接缝）**：`lib/image-core` 暴露统一纯函数签名 `process(input: ImageData, options: ToolOptions): Promise<ImageData>`，每个工具一个纯函数模块（如 `whiteToTransparent(input, {tolerance})`、`compressToSize(encode, {targetBytes})`）。这是全站唯一的算法接缝，单元测试全部打在这层。
5. **性能**：单图 >4MP 或批量 >3 张时自动走 Web Worker；编码类操作使用 `OffscreenCanvas` + `createImageBitmap`。压缩到指定 KB（F10）采用质量参数二分 + 最大边长降采样兜底，保证收敛。
6. **页面结构约定**：每个工具一个路由 `/tools/[slug]`（SSG），页内三段式：工具操作区（首屏）→ how-to 步骤（含 FAQPage schema）→ 相关工具内链 + 明确标注的联盟位。教程内容用 MDX 数据文件驱动，复用 starter 的 Article schema。
7. **联盟层**：推广位组件化（`PromoCard`），数据来自配置文件（品牌、链接、披露文案、启停开关）；所有联盟链接加 `rel="sponsored"`；页面显著位置含"推广内容披露"。
8. **合规**：法务页（Privacy/Terms/Disclaimer/Contact/Cookie）沿用 starter 基座补全；站点不设 Cookie 指纹追踪，分析仅用无 Cookie 的聚合统计（如 Plausible 类），降低 GDPR/AdSense 同意负担。
9. **埋点**：四步漏斗事件（visit / tool_use / export_done / promo_click）走无 Cookie 自托管统计端点，事件 schema 固定为 `{tool, step, meta?}`。
10. **域名**：新注册，不复用 civlensai.com（历史锚文本与新意图错位）。站名 PicForge 为占位，建仓前定稿。

## 六、测试决策（Testing Decisions）

**测试原则**：只测外部行为（输入图像数据 → 断言输出图像数据/编码产物），不测实现细节（内部循环、私有状态）。图像算法的"正确"以像素断言和编码产物属性为准。

1. **算法层单元测试（主接缝：`lib/image-core` 纯函数）**——全站唯一算法接缝，覆盖：
   - F01 白底转透明：构造已知像素矩阵（纯白/米白/纯红/渐变边缘），断言容差内像素 alpha=0、容差外不变、边缘像素落在渐变区间；
   - F07/F08 边缘优化与 defringe：构造带白色锯齿边的圆，断言处理后边缘半透明像素不含白色色偏；
   - F09 合规占比：给定点阵化主体，断言 bounding box 与缩放比例计算精确（±1px）；
   - F10 压缩到指定 KB：断言产物字节数 ≤ 目标值且 ≥ 目标的 80%（不过度压缩）；
   - F05 EXIF：用带 Orientation 标签的测试图断言输出方向正确。
   - 每个 Worker 可并行函数同时跑同步路径与 Worker 路径断言结果一致。
2. **页面级 SEO 回归（复用 starter 的 `check-seo.mjs` + Playwright）**：每个 `/tools/[slug]` 页断言 title/description/canonical/JSON-LD/OG 图存在且非空——这是对 CivVue 死因的直接防线；sitemap 覆盖所有已发布工具路由，预览环境断言 noindex。
3. **E2E 冒烟（Playwright，用户环境已有内核）**：每工具一条主路径——上传样例图 → 默认参数操作 → 导出 → 断言下载产物类型与尺寸；另有截图对比用于边缘类算法（F07/F08）的目视回归。
4. **测试资产**：固定样例图集（白底 Logo、带 EXIF 竖图、大体积 PNG、电商商品图）作为 fixtures 入库，替代真实用户图。
5. **无先行测试可参照**（新仓库），以 NetFlip 的 tests 分层为风格先例：纯函数 Vitest + 页面 Playwright，两层即可，不建第三层。

## 七、范围外（Out of Scope）

- **任何云端 AI 能力**：智能抠图、AI 生成/扩图、云端转码一概不做（无 API key、无按次计费、无隐私上传）；多主体点选式分割、**单图自动分割分层**与分层编辑器（讨论中的三期方向）不在本期，将来单独立 PRD；
- **去水印（watermark removal）**：不做（2026-10-29 裁决）——主流用途涉及移除他人版权标识，与图库方/Adobe 政策冲突，广告与联盟审核风险高；正当的相近需求由 F17（用户涂抹擦除自己图中的杂物/路人）承接；
- **用户系统**：无注册、无登录、无云端历史/收藏；
- ~~PSD 导出~~（2026-10-29 裁决移出：F18 以"多图合成 PSD 分层导出"形态入二期，ag-psd 纯浏览器端实现；单图自动分割分层仍留三期）；
- **付费墙/订阅**：所有工具免费，变现仅靠联盟位；
- **AdSense**：不申请、不嵌入（吸取 CivVue 被拒教训，避免内容政策纠缠）；
- **移动 App / PWA 离线包**：本期仅响应式 Web；
- **多语言**：首版仅英文（目标市场为欧美搜索流量）；
- **非电商/开发者场景的重编辑器功能**（图层、画笔、文字排版）：坚决不做，保持单任务工具定位。

## 八、进一步备注（Further Notes）

1. **立项前置条件（第 0 周）**：挖词验证先行——用免费工具拉出目标关键词表（预计 50–100 个任务型词），确认至少 MVP 5 个工具的长尾搜索量真实存在，再建仓动工。挖词结果作为附录回填本 PRD。
2. **变现假设（需验证，非承诺）**：参照会话中的漏斗模型，30k 月访问 × 2% 推广点击 × 10% 转化 × $5–36 客单 → 数百美元/月量级；第 3 个月长尾出词、第 6 个月评估是否达到月访过万，未达标则止损降级为维护态。
3. **风险登记**：
   - 联盟计划对新站有审核门槛（需先有上线站点与真实流量）→ 应对：法务页/目录提交/开源 npm 包先行建立可信度；
   - 平台对批量 AI 内容降权 → 应对：内容仅工具页 + 教程，不做内容农场式铺量；
   - 开源 npm 包与站点引擎同源演进 → 应对：包版本独立发布，站点锁语义化版本。
4. **关联决策**：CivVue（civlensai.com）判死不迁移；其 AdSense 被拒教训（无 SSR metadata、无原创内容深度）已转化为本 PRD 的第 18–23 条用户故事与测试决策第 2 条。
5. **建仓后动作**：本 PRD 拆为 issue（to-issues，tracer-bullet 垂直切片：先跑通"白底转透明"一个工具的全链路——算法→页面→SEO→埋点，再横向复制到其余工具），并打 `ready-for-agent` 标签。

---

## 附录 A：site: 搜索法初筛结果与功能裁决（2026-10-20）

> 方法来源：SimilarWeb 需求验证法（免注册变体）。因 SimilarWeb 强制手机号注册，改用 `site:vercel.app` / `site:github.io` 搜索法扫描免费托管域图片工具站；流量精确核对（hypestat）待补。

### A.1 初筛候选清单（10 个）

| 候选站 | 托管域 | 功能面 | 关键观察 |
|---|---|---|---|
| Pixel Forge Stack | github.io | 20+ 工具：缩放/压缩/裁剪/转换/HEIC/ICO/favicon/水印/PDF | 最直接竞品；已为 "compress to 100 KB" 建独立 SEO 页 → **F10 页面策略被验证**；覆盖 ICO/favicon（与 F12 重合） |
| korbei/tools | github.io | 单页转换器（格式+缩放+压缩+Base64） | 轻量个人站，与 F03/F04 重合 |
| FreeConverto | github.io | 转换+压缩，含 HEIC/AVIF | 打 "HEIC to JPG" iPhone 痛点词 |
| Shrinkray | github.io | 批量压缩+AVIF | 主打隐私+批量（与 F06 重合） |
| QuickPixel | github.io | 压缩/缩放/转换三件套 | 基础款 |
| InstaCrop Pro | vercel.app | 裁剪+圆形头像+实时压缩 | "圆形透明头像"精准长尾（LinkedIn/app 头像） |
| FormatPixl | vercel.app | 四件套+平台预设 | 常规矩阵 |
| work-your-images | vercel.app | 13 种工具含 OCR/去物体/套壳 | 功能堆叠型单人站 |
| PhotoResizing | vercel.app | 缩放+**WebGPU 本地 AI 增强/抠图** | **纯浏览器 AI 已被验证可行**（佐证二期 ONNX 路线） |
| 匿名预检站 | vercel.app | 上传前合规预检（Instagram/Amazon 尺寸检查）→ 编辑承接 | **商业模式最接近本项目**：以"平台合规"为楔子，正是 F09 思路的已验证形态 |

### A.2 三条关键洞察

1. **赛道拥挤但竞品普遍"懒"**：候选几乎全部是单人、无自定义域名、无外链建设的免费托管站——符合"懒竞品"画像。无人做深度能力：defringe 白边去除、85% 合规占比校验、精确 KB 命中均无对手。
2. **"目标 KB 压缩"+"平台尺寸预设"被反复验证**：多家独立实现，且 Pixel Forge 为其建独立 SEO 页 → F10/F02 的搜索需求真实。
3. **预检（preflight）模式是增量发现**："检查合规 → 编辑承接"的漏斗比纯工具页更具内容差异化，AI 搜索引用友好。

### A.3 功能裁决（数据版，替换原推理版 MVP）

| 功能 | 裁决 | 数据依据 |
|---|---|---|
| F01 白底转透明 PNG | ✅ 入 MVP | 通用刚需，候选中无人做深（透明头像仅圆形特例） |
| F10 压缩到指定 KB | ✅ 入 MVP | Pixel Forge 独立 SEO 页验证；多家竞品实现 |
| F02 电商尺寸裁剪 | ✅ 入 MVP | 平台预设被多家验证；预检站证明"合规"叙事成立 |
| F08 白边去除 defringe | ✅ 入 MVP（差异化钩子） | **全部候选均无此能力**，电商差评集中区 |
| F09 合规占比校验 | ✅ 入 MVP，**形态升级为"平台预检+校验"**（Amazon/Instagram 等 preflight → 编辑承接） | 预检站验证该模式；是本项目最强内容差异化 |
| F12 ICO/Favicon | ⬇️ 降为一期（Pixel Forge 已覆盖，非首战） | 避免首战正面撞车，转向无人区 |
| F03–F07、F11 | 一期不变 | 及格线补全 |
| F13–F16 | 矩阵期不变 | — |

**MVP 定稿（数据版）：F01、F10、F02、F08、F09（预检形态）。**

### A.4 待补事项

- [ ] hypestat 流量核对（免登录）：重点 `pixel-forge-stack.github.io`、`photoresizing.vercel.app`；
- [ ] 关键词搜索量交叉验证（Ahrefs Free / Keyword Planner）：MVP 五工具对应词表；
- [ ] vercel.app 背景移除类目补扫（本轮搜索限额未覆盖）。

---

## 附录 B：二期功能正式规格（2026-10-29 裁决，待开发）

### B.1 F17 — Erase Object（擦除物体并填充）

- **路由 slug**：`/tools/erase-object`（冻结，落地后改 slug = 断 SEO 外链）
- **用户流程**：上传单图 → 画笔涂抹要擦除的区域（可调笔刷大小，可撤销）→ 填充 → 预览 → 导出 PNG/JPEG
- **算法接缝**（`lib/image-core/`，纯函数、ImageData 进出、零 DOM）：
  - `inpaintFill(input: ImageData, mask: MaskData, options: InpaintOptions): Promise<ImageData>`
  - 双档自动分流（编排层按遮罩像素数选择，阈值常量 `MAX_TELEA_MASK_PIXELS`）：
    - 小区域 → Telea FMM（`teleaInpaint`，毫秒级，支持实时预览）
    - 大区域 → 例证纹理合成（Criminisi/Efros-Leung 族，Worker 内跑，避开 PatchMatch 专利 US 8,861,869）
  - 遮罩类型 `MaskData { width, height, data: Uint8Array }`（0=保留，255=擦除），由编排层画笔 UI 生成
- **依赖**：无新 npm 依赖（Telea FMM 与例证合成均为自有纯函数实现，参照 inpaint.js 与 efros-and-leung-js 先例；不引入 jsfeat，接口自足）
- **测试策略**：
  - 单测（`tests/`，ImageData 进出）：① 平滑渐变背景上擦除矩形 → 断言填充区与周围色差在容差内；② 重复纹理（构造条纹图案）擦除 → 断言纹理周期性保留；③ 空遮罩 → 输出与输入逐像素相等（恒等）；④ 全遮罩 → 不崩溃且返回有效 ImageData
  - E2E（Playwright）：画笔涂抹固定坐标 → 填充 → 导出 → 下载魔数断言 + 像素采样断言
  - Telea 与例证合成双路径对同一小遮罩跑一致性断言（ Worker/同步路径一致，沿用 OH5 先例）
- **合规边界（写入 guide 与 FAQ）**：面向用户清理自己照片中的杂物；guide 明确不鼓励用于移除他人版权标识；不做任何"检测水印"辅助

### B.2 F18 — Layered PSD Export（多图合成 PSD 分层导出）【已上线 2026-10-29，`13235c1`】

- **路由 slug**：`/tools/psd-export`（已冻结上线）
- **实际实现**：多图上传（每图一层）→ 图层命名/排序/可见性 → ag-psd `writePsd`（浏览器端，大画布走 Worker）→ `.psd` 下载
- **算法接缝**：`buildPsd(layers: PsdLayerInput[], options): ArrayBuffer`（`lib/image-core/psdExport.ts`；ag-psd 仅被此文件引用）
- **测试**：单测 8 场景（writePsd→readPsd 往返/顺序/可见性/单层/空列表拒绝/偏移/TOOLS 注册/sitemap）+ E2E 主路径（`8BPS` 魔数断言）
- **规格备注（2026-10-29 B 方案裁定）**：用户原意"单图自动拆层"拆出为独立工具 F19（见 B.4），F18 保持多图合成形态

### B.4 F19 — Split Layers（单图拆层：主体/背景两层 PSD）

- **路由 slug**：`/tools/split-layers`（冻结）
- **用户流程**：上传 1 张图（JPG/PNG，纯色或近纯色背景效果最佳）→ 自动分割（背景层 + 主体层）→ 预览两层 → 导出两层 `.psd`
- **算法接缝**（`lib/image-core/`）：
  - `splitLayers(input: ImageData, options: SplitLayersOptions): { subject: PixelBuffer; background: PixelBuffer }`
  - 分割复用 F01 flood-fill 边界分割：从四边扫描背景色区域 → 背景层保留原像素（含被主体遮住的推断填充可选），主体层为抠出的前景（带 alpha）
- **依赖**：ag-psd（已装）；无其他新依赖
- **测试策略**：① 构造纯背景+矩形主体图 → 断言两层的像素归属正确；② 渐变背景（容差内）→ 断言背景识别完整；③ 复杂背景 → guide 明示效果边界；④ 输出经 ag-psd 回读断言两层结构
- **三期边界**：部件级细拆（连通域/语义分割）不做，留三期
