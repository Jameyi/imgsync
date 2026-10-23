# CODING_RULES.md — AI 编码总规则（Architecture First）

> **任何编码任务开工前必读**（AGENTS.md Document Priority 第 3 位）。
> 本文件约束 AI 与人类协作者在本仓库的编码行为。违反任一禁止项 = 停止写代码，重新设计。

---

## 0. 回答输出格式（每次编码回答必须按序输出）

```
1. 架构 / 模块   （首次任务输出全量模块划分；后续任务输出受影响模块及所在层）
2. 当前任务       （一句话：本次改哪个模块的什么契约）
3. 代码实现       （只动当前任务声明的模块）
4. 测试说明       （输入 / 预期输出，见 §4）
```

---

## 1. 禁止行为（重要）

- ❌ 不允许直接开始写代码——先输出模块划分与接口契约
- ❌ 不允许在没有模块划分的情况下实现功能
- ❌ 不允许创建高耦合代码（跨模块直接调用内部实现）
- ❌ 不允许随意修改已有模块职责（改职责 = 先重设计，见 §6）
- ❌ 不允许"临时写一下"的代码（临时 = 设计失败的信号，见 §3 触发条件）

## 2. 系统模块划分（纯前端浏览器应用适配版）

> 本项目为纯前端浏览器端应用（见 AGENTS.md / docs/PRD.md）：无后端服务、无数据库、无 Supabase。
> 不适用 controller/service/repository 四层；对应分层以**目录约定**落位，依赖方向不变。

```
系统模块（按目录落位）：
- app/（page.tsx, tools/[slug]/…）  → 前端 UI 层（路由、页面、SSG/SEO 元数据）
- components/                      → 展示组件层（纯展示与交互，不含图像算法）
- lib/tools/                       → 编排层（各工具的状态、交互、Worker 调度）
- lib/image-core/                  → 算法层（纯函数图像算法库：零 DOM 依赖、零框架依赖）
- lib/（seo.ts、site-url.mjs）      → SEO / 站点元信息辅助
- config/、content/                → 配置与内容数据（费率式静态数据、MDX 教程内容）——只被上层读
```

**ImgSync 业务模块清单**（image-core 按工具拆分，一个工具一个纯函数文件）：

| 模块 | 职责（一句话） |
|---|---|
| `lib/image-core/` | 负责全部图像算法纯函数（白底转透明、压缩到指定 KB、边缘优化等），零 DOM / 零框架依赖，同时作为独立 npm 包发布 |
| `lib/tools/` | 负责单个工具页的编排（状态管理、Worker 调度、调用 image-core） |
| `lib/seo.ts` | 负责各页面 canonical / OG / JSON-LD 元数据的统一生成 |
| `app/api/og/` | 负责动态 OG 图生成（唯一的 route 层） |

**一句话测试**：任何模块若不能用一句话说清职责 → 设计失败，必须重拆后再动手。

## 3. 依赖方向（重点，违反即返工）

```
app/（页面） + components/
      ↓ 只能调用
lib/tools/（编排）
      ↓ 只能调用
lib/image-core/（纯函数算法层）
      ↓ 只能调用
浏览器 Canvas / Web Worker / OffscreenCanvas API
```

**禁止反向依赖与跨层：**
- ❌ `lib/image-core` import 页面/组件/`lib/tools` 代码（它是独立 npm 包，必须保持零反向依赖）
- ❌ `lib/image-core` 里碰 DOM、`window`、`document`（DOM 解码/编码只发生在编排层或 Worker 边界）
- ❌ 组件里写图像算法（算法只能落在 image-core，第二处出现相同计算 → 提取进 image-core）
- ❌ `lib/tools` 绕过 image-core 直接内联像素操作
- ✅ 全站唯一算法接缝：`process(input: ImageData, options: ToolOptions): Promise<ImageData>` 及各工具纯函数（如 `whiteToTransparent(input, {tolerance})`、`compressToSize(encode, {targetBytes})`），单元测试全部打在这层

**停止写代码重新设计的触发条件（任一出现即停）：**
- 修改一个功能影响多个模块
- 出现重复逻辑（第二处出现相同像素计算 → 提取到 image-core 唯一归属模块）
- 模块职责变模糊
- 想写"临时"代码

## 4. 任务拆分与逐模块实现

**拆分要求：**
- 每个任务必须可独立完成、可独立验证
- 每个任务只涉及**一个**模块（跨模块 = 先定义接口，再按模块拆任务）

**逐模块实现规则：**
- ✅ 一次只实现一个模块；严格按已定义接口写代码；不访问其他模块内部实现
- ✅ 剥离出可自动测试的逻辑（重要：全部图像算法必须可脱离 DOM/Canvas/HTTP 单测——ImageData 进、ImageData 出）
- ❌ 在组件/编排层内联像素循环；在 image-core 里操作 DOM

**每完成一个模块，必须输出：**
```
测试方式：
- 输入：（具体入参样例，如构造的已知像素矩阵 ImageData）
- 预期输出：（具体断言值，如容差内像素 alpha=0、编码产物 ≤ targetBytes）
```
单元测试落在 `tests/`（`pnpm test` 执行；图像算法的"正确"以像素断言和编码产物属性为准，不测内部循环等实现细节）。

**BDD 前置（AGENTS.md 铁律）**：编写正式测试代码前，必须先按 Gherkin Given-When-Then 写只含行为注释和测试函数名的空测试文件，并经用户确认后才可写测试体。

## 5. 命名约束（防止改名漂移）

**目录/文件：** 目录 kebab-case（`lib/image-core/`、`lib/tools/`）；image-core 文件按工具/算法命名，编排文件按工具 slug 命名。

**函数/变量：**
| 层 | 命名模式 | 例 |
|---|---|---|
| image-core 纯函数 | 动词/名词 + 算法语义，无 DOM 词 | `whiteToTransparent`, `compressToSize`, `defringeEdges` |
| tools 编排函数 | 动词开头，含交互语义 | `runInWorker`, `loadImageFromFiles` |
| 类型/接口 | PascalCase；选项类型 = 工具名 + Options | `ToolOptions`, `CompressOptions` |
| 布尔 | is/has/can/should 前缀 | `isLargeImage`, `shouldUseWorker` |
| 常量 | SCREAMING_SNAKE_CASE | `MAX_SINGLE_THREAD_PIXELS` |

**冻结规则：**
- 接口函数名一旦被其他模块 import，即为**冻结名**——重命名属于改接口，走 §6 流程
- 工具路由 slug 以 PRD 工具清单为准（`/tools/[slug]`），落地后改 slug = 断 SEO 外链，须先重设计
- 已有中文注释与既有命名风格保持一致，不顺手改名

## 6. 修改代码的流程（用户要求修改时）

必须按序执行：
1. **判断影响范围**——列出本次修改涉及的模块与下游调用方（用依赖图/引用查找验证，不凭感觉）
2. **只修改一个模块**——影响面超出一个模块时，停下来向用户报告影响清单，按模块拆分修改顺序
3. **不破坏接口**——函数签名/返回结构不变；新增能力用新函数，不改旧函数语义
4. **必须改接口时 → 先重设计**：输出新旧契约对比 + 影响的调用方清单 + 迁移顺序，经确认后才动代码

## 7. 编码原则（始终遵守）

1. **高内聚低耦合**——模块只做一件事
2. **依赖接口，不依赖实现**——调用方只 import 类型与函数签名，不关心内部
3. **少用继承，多用组合**
4. **尽量使用纯函数**——避免全局变量；image-core 全部为纯函数，可变状态收敛在编排层组件作用域内
5. **不允许隐藏副作用**——副作用（DOM 读写、Canvas 编码、Worker 创建、文件下载）只允许出现在 `lib/tools/` 编排层与页面事件边界；`lib/image-core` 内零副作用、零 IO

## 8. 技能调度协议（每次编码/修复时的技能调用规则）

**用户显式指定时：**

| 用户说 | 动作 |
|---|---|
| "ponytail"（= Matt Pocock 技能集，用户拼写习惯，同 mottoco=matt pocock） | 先用 `ask-matt` 路由定位具体技能；若用户指名的技能名不在可用列表，不瞎猜，按最接近的可用技能回退并向用户说明。**组合约定：ponytail 默认与 superpowers 的 SDD 技能（规格确认 → to-issues 拆任务 → implement）结合，以最小代码实现** |
| "SDD" / "superpowers" | 规格驱动开发：规格确认（PRD/TASK/ACCEPTANCE）→ 大块工作先用 `to-issues` 拆任务 → `implement` 按规格最小实现 → 测试说明收尾 |
| 其他点名技能 | `use_skill` 精确加载，绝不虚构技能名 |

**用户未指定时——按历史行为自动调用：**

| 任务类型 | 默认技能/流程 |
|---|---|
| 新功能开发（规格已冻结） | `implement`（SDD 式最小实现）→ 每模块输出测试方式 |
| 大块多任务工作（跨多模块/多文件） | `to-issues` 先拆任务，再逐个实现 |
| UI/布局类需求 | `prototype` 先出骨架看布局，判定后再吸收进正式代码 |
| bug 修复（"不工作"/报错/性能） | `diagnosing-bugs`：先复现诊断，再修 |
| 用户要求 TDD / 测试先行 | `tdd` |
| 方案或 PRD 未收口 | `grilling` 拷问收口后再动手 |

**铁律优先级**：无论调用哪个技能，§1–§7 的约束（模块划分先行、依赖方向、最小代码、命名冻结）都在技能流程之上——技能改变工作方式，不放宽本文件约束。

**外部技能路径**：见 docs/CONTEXT.md 外部 Skill 路径登记表（ponytail / superpowers / codegraph / ui-ux-pro-max / frontend-design / playwright 等）。

## 9. 诊断前置协议（bug 修复强制首要步骤）

**触发条件**：用户反映的状况与预期不符，需要修复或测试时。

**强制首要操作步骤——查看源代码之前，必须先复现并收集运行时证据（Ponytail 诊断流程）：**

需收集以下信息（逐项收集，能取到几项取几项）：

| # | 信息 | 获取方式 |
|---|---|---|
| 1 | 浏览器控制台日志 | Playwright（`page.on('console')` / `page.on('pageerror')`）或用户提供 |
| 2 | 网络请求记录 | Playwright（`page.on('request'/'response')`）或浏览器 DevTools Network 面板 |
| 3 | 接口返回数据 | 本项目基本无接口；OG 图等 route 用 curl 直打（`BASE_URL` 默认 6553，见 AGENTS.md 端口约定） |
| 4 | 页面报错信息 | Next.js 错误覆盖层（dev overlay）/ 服务端终端日志（用户终端里跑的 `pnpm dev` 输出） |
| 5 | 问题截图 | Playwright `page.screenshot()`，或请用户提供截图 |

执行顺序：

```
用户报告"与预期不符"
   ↓
1. 先执行 **Ponytail 诊断工具**（Playwright/复现手段收集上述 5 项信息，复现优先，逐项收集）
   ↓
2. 用收集到的信息定位问题（控制台/网络/渲染/报错/截图交叉验证）
   ↓
3. **仅当 Ponytail 诊断无法定位问题时**，才允许下一步排查源代码
   ↓
4. 定位后按 §6 修改流程处理（影响范围→单模块→不破接口→改接口先重设计）
```

**禁止**：跳过第 1 步直接读代码猜原因；未收集运行时证据就改代码。

**补充**：Playwright 及浏览器内核路径见 docs/CONTEXT.md（默认 `C:\Users\jamey\AppData\Local\ms-playwright`，firefox/webkit 需设 `PLAYWRIGHT_BROWSERS_PATH=D:\node_global\playwrightBrowser`）；本项目排查优先级另受 AGENTS.md「Next.js (pnpm) 启动失败排查流程」与「Debug Investigation Protocol」约束，与本节叠加执行。

**服务启动约定（2026-10-21 用户裁定）**：需要启动服务（`pnpm dev`、`pnpm start` 等）时，AI 只输出让用户执行的指令，不自行启动服务，以免拖慢节奏；验证取数不影响此约定（curl/HTTP 直打给用户可复制的命令或用 Playwright 短连接探测）。
