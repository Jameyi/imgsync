# 测试策略 V1.0（Testing Strategy）

- 版本: v1.0
- 日期: 2026-10-20
- 依据: `docs/PRD.md`（§7 测试与验收标准）、`docs/CODING_RULES.md`、AGENTS.md（BDD 测试编写规范、`pnpm check` 收尾验证）
- 项目形态: **纯前端浏览器端应用**——无后端服务、无数据库、无支付/认证，图像处理全部在浏览器本地（Canvas + Web Worker）完成
- 目标: 用可重复的验收标准验证图像算法正确性、工具链可用性与 SEO 完整性

> 注：本文件改写自另一项目（NetFlip）的安全测试方案。NetFlip 的渗透测试矩阵（webhook 验签、RLS 越权、支付篡改、限流爆破）不适用于本项目——ImgSync 不上传用户图像、不调用第三方 API、不存库，**不存在服务端攻击面**。与安全相关的残留项收敛为 §5「隐私与配置安全」。

---

## 1. 分层测试矩阵

| 层 | 工具 | 作用 | 触发时机 |
|---|---|---|---|
| 静态检查 | `pnpm lint` + `tsc --noEmit` | 类型与规范检查 | 每次提交 / `pnpm check` |
| 算法单元测试 | Vitest | `lib/image-core` 纯函数：ImageData 进 → 像素/编码产物断言出 | 每次提交 / `pnpm check` |
| BDD 行为测试 | Gherkin 注释 + Vitest | 先写 Given-When-Then 空测试并经用户确认，再写测试体（AGENTS.md 铁律） | 每个新测试文件之前 |
| SEO 自检 | `pnpm test:seo`（check-seo.mjs） | canonical/OG/sitemap/JSON-LD/hreflang/404 | SEO 相关改动 + 生产模式 `pnpm build && pnpm start` 后 |
| 浏览器 E2E | Playwright（路径见 docs/CONTEXT.md） | 工具页真实交互：选图 → 处理 → 下载产物 | 功能收口 / 诊断复现 |
| 构建验证 | `pnpm build` | 配置层完整性 | `pnpm check` 收尾必跑 |

**收尾铁律**：一律跑 `pnpm check`（= lint + typecheck + test + build）；SEO 改动另跑生产模式 + `pnpm test:seo`。

---

## 2. 算法层单元测试（主接缝：`lib/image-core` 纯函数）

全站唯一算法接缝（PRD §7）：`process(input: ImageData, options) → Promise<ImageData>`。**只测外部行为（输入图像数据 → 断言输出图像数据/编码产物），不测实现细节。**

| 用例类别 | 输入构造 | 预期断言 |
|---|---|---|
| F01 白底转透明 | 已知像素矩阵（纯白/米白/纯红/渐变边缘） | 容差内 alpha=0；容差外不变；边缘像素落在渐变区间 |
| F07/F08 边缘优化与 defringe | 带白色锯齿边的圆 | 边缘半透明像素不含白色色偏 |
| F09 合规占比 | 点阵化主体 | bounding box 与缩放比例精确（±1px） |
| F10 压缩到指定 KB | 固定图像 + encode 回调 | 产物 ≤ targetBytes；质量二分收敛；超出时最大边长降采样兜底 |
| Worker 分界 | 单图 >4MP、批量 >3 张 | 编排层（lib/tools）判定走 Worker——mock 断言调度，不在 image-core 测 |

**测试方式输出格式**（每完成一个模块必须给出，见 CODING_RULES §4）：

```
测试方式：
- 输入：4×4 ImageData，前 8 像素 (255,255,255,255)，后 8 像素 (200,50,50,255)，tolerance=10
- 预期输出：前 8 像素 alpha=0 且 RGB 不变；后 8 像素整体不变
```

---

## 3. 浏览器 E2E（Playwright）

| 用例 | 步骤 | 期望 |
|---|---|---|
| E1 工具页加载 | 访问 `/tools/[slug]`（dev 端口 6553） | 操作区首屏可见，无 console error |
| E2 完整处理流 | 注入测试图片文件 → 触发处理 → 捕获下载产物 | 产物存在且属性符合预期（尺寸/字节） |
| E3 Worker 路径 | 上传 >4MP 图 | 处理在 Worker 中完成（主线程不阻塞） |
| E4 诊断取证 | `page.on('console'/'pageerror'/'request')` + `page.screenshot()` | 按 CODING_RULES §9 收集运行时证据后再定位 |

环境：默认浏览器内核 `C:\Users\jamey\AppData\Local\ms-playwright`；firefox/webkit 需设 `PLAYWRIGHT_BROWSERS_PATH=D:\node_global\playwrightBrowser`。

---

## 4. SEO / 内容完整性验收

- [ ] 每个工具页有独立 canonical + OG 数据
- [ ] sitemap / robots 路由可用；预览环境 noindex
- [ ] how-to 步骤含 FAQPage schema；文档页有语言 alternates（en/zh）
- [ ] 404 页返回真实 404 状态码
- [ ] 联盟位组件含 `rel="sponsored"` 与"推广内容披露"（PRD §实现决策 7）

---

## 5. 隐私与配置安全（本项目残余"安全面"）

| # | 检查 | 验收 | 方式 |
|---|---|---|---|
| S1 | 图像不出浏览器 | 无任何网络请求携带图像数据 | E2E 抓 `page.on('request')` 断言无图像上传 |
| S2 | 无第三方 AI/追踪调用 | 仅自有域名请求 | 同上 |
| S3 | 密钥不进客户端 bundle | 仅 `NEXT_PUBLIC_*` 进入产物 | `pnpm build` 产物 grep |
| S4 | 依赖漏洞 | `pnpm audit` 无 high/critical | 依赖变更时 |

---

## 6. AI 修复流程（拿到失败报告后）

```
失败报告（测试红 / 用户反馈不符 / SEO 检查失败）
   ↓
1. 复现并收集运行时证据（CODING_RULES §9 诊断前置协议，Playwright 优先）
2. 定位：file:line + 复现路径
3. 修复（遵循 CODING_RULES §6：影响范围 → 单模块 → 不破接口）
4. 验证：失败用例从红变绿
5. 回归：pnpm check（+ SEO 改动时 pnpm build && pnpm start && pnpm test:seo）
```

**规则**：
- 代码修复必须带回归测试（BDD：先写行为注释并确认，再写失败测试）
- 同一问题修两次仍失败 → 按 AGENTS.md Failure Handling 停止，报告并给出更简方案
- 无法修复的（如上游依赖 bug）记录为已知风险，说明缓解措施
