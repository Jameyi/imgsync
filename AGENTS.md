# ImgSync 项目 AI 唯一入口（AGENTS.md）

> 本文件为项目唯一 AI 指引，已合并原 AGENT.md 与 starter 沿用规则，任何任务开始前必读本文件。
> 读取顺序按下方 Document Priority 执行；Do NOT try to read everything.

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.
Tradeoff: These guidelines bias toward caution over speed. For trivial tasks, use judgment.
1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.
Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.
2. Simplicity First
Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.
3. Surgical Changes
Touch only what you must. Clean up only your own mess.
When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.
When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.
The test: Every changed line should trace directly to the user's request.
4. Goal-Driven Execution
Define success criteria. Loop until verified.
Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"
For multi-step tasks, state a brief plan:
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Document Priority

When working on a task, follow this priority:

1. TASK.md (current goal and scope)
2. ACCEPTANCE.md (what defines success)
3. docs/CODING_RULES.md (**任何编码任务开工前必读**——模块划分/依赖方向/逐模块实现/命名约束)
4. docs/COPY_GUIDELINES.md (**任何涉及用户可见文案的改动必读**——词汇黑名单/错误三段式/承诺规则；与 CODING_RULES 同级铁律)
5. API.md / UI_SPEC.md (implementation details)
6. CONTEXT.md (domain understanding)
7. ARCHITECTURE.md (only if needed)

Do NOT try to read everything.
Focus only on documents relevant to the task.

## Project-Specific Debugging Rules

### Next.js (pnpm) 启动失败排查流程

当遇到 pnpm dev 无法启动、http://localhost:6553 无法访问时：
禁止：
- 直接修改代码
- 猜测复杂原因
- 一次修改多个文件

必须按照以下顺序排查：

### Level 1: 环境和启动入口
首先确认：
1. 工作目录是否为本仓库根目录
2. Node 版本（要求 22.x）与 pnpm 版本（packageManager 固定 11.24.0）
3. 依赖是否安装完整：`pnpm install` 无报错
4. 端口 6553 是否被占用

### Level 2: 应用加载
检查：
- next.config.ts 是否存在且语法正确
- src/app 下 layout/page 是否存在
- .env.local 是否就位、NEXT_PUBLIC_* 配置是否填写
验证：`pnpm build` 是否能通过（能过 = 配置层基本无问题）

### Level 3: 错误定位
必须查看完整 traceback。
不要只根据最后一行错误判断。
优先定位：
1. 终端输出中的第一处异常
2. 文件路径
3. 行号
4. 浏览器 DevTools console/network 中的首个报错

### Level 4: 配置问题
检查：
- .env.local
- next.config.ts
- tsconfig.json
- Tailwind / postcss 配置

### Level 5: 深层问题
只有前面确认无误后，才考虑：
- Next.js / React 版本兼容
- 依赖版本对齐（Next、eslint-config-next、@next/third-parties、pnpm-lock）
- Windows 特有问题（路径大小写、CRLF）

本项目为纯前端浏览器端应用：无后端服务、无数据库。图像处理问题优先定位 `lib/image-core` 纯函数层（依赖方向见 PRD）。

## 修改原则
排查阶段：
只允许：
- 查看文件
- 查看日志
- 执行诊断命令

定位原因后：
每次只修改一个问题。
修改前必须说明：
1. 当前假设
2. 证据
3. 修改方案
4. 验证方式

## BDD测试编写规范
- 在编写正式测试代码之前，必须先遵循Behaviour-Driven Development的实践，使用Gherkin schema，写一个只包含Given-When-Then模式的行为注释的和测试函数名的空测试文件。并使用工具AskUserQuestion向用户确认是否继续。禁止在完成行为注释之前，编写任何测试代码。
- Gherkin schema的测试注释写法参考本仓库 tests/ 下任一测试文件（首个测试建立后回填具体路径）。

## Execution Constraints (Hard Rules)

These rules override all other guidelines. They are mandatory.

### Scope Control

- Before making changes, you MUST list the files you will modify.
- You may modify at most 3 files per iteration.
- Do not change unrelated files, even if improvements are obvious.

### Verification Required

Work is NOT complete unless ALL of the following pass:

- typecheck passes
- build passes
- tests pass (if present)

If no tests exist:
- You MUST define clear acceptance criteria before coding.

### Failure Handling (Critical)

If a task fails twice:

1. STOP making further code changes
2. Summarize:
   - what was attempted
   - why it failed
3. Propose a simpler alternative
4. Wait for user confirmation

Do NOT continue blindly.

### No Fake Completion

You are forbidden from saying:
- "Done"
- "Fixed"
- "Completed"

Unless:
- acceptance criteria are explicitly satisfied
- verification steps have passed

### Minimal Iteration Loop

Each iteration must follow:

1. Clarify goal
2. Define verification
3. Make minimal change
4. Verify

Do not batch large changes.

---

## Naming Conventions

### Critical Naming Rules

1. **MUST** use standard terminology from [docs/TERMINOLOGY.md](docs/TERMINOLOGY.md)
2. **MUST** follow naming conventions from [docs/NAMING_CONVENTIONS.md](docs/NAMING_CONVENTIONS.md)
3. **MUST NOT** create new non-standard terms
4. **MUST** use consistent case conventions (snake_case, camelCase, PascalCase, etc.)

### Port Configuration

- **ImgSync 本地开发端口：6553**（固定在 package.json 的 dev 脚本 `next dev -p 6553`，访问 http://localhost:6553）
- 本项目为纯前端浏览器端应用：无后端服务、无数据库、无 Supabase，只用这一个端口
- 上一项目遗留端口 8848 与 starter 默认 3000 均弃用，勿使用

### Local Environment Startup (本地部署与调试)

本项目需先在本地跑通再开发。任何编码任务开工前，AI MUST：

1. 安装依赖：
   ```bash
   pnpm install
   ```

2. 准备环境变量：
   拷贝 `.env.example` → `.env.local`，按 starter README 填写 `NEXT_PUBLIC_SITE_NAME` 等字段

3. 启动开发环境（**由用户在终端自行执行**，见 CODING_RULES.md §9 服务启动约定）：
   ```bash
   pnpm dev
   ```

4. 访问 http://localhost:6553，确认首页正常渲染后，再进行代码改动。

If environment cannot start cleanly, report to user instead of attempting manual fixes.

收尾验证一律跑 `pnpm check`（= lint + typecheck + test + build）；SEO 相关改动另跑生产模式 `pnpm build && pnpm start` 后执行 `pnpm test:seo`。

### Changing Existing Names

If you need to rename an existing code element:
1. Document the old name and new name
2. Update all references (imports, usages, tests)
3. Update API contracts if applicable
4. Update this naming convention document

---

# Debug Investigation Protocol

When fixing any bug, the agent MUST follow a bottom-up debugging strategy.

The agent must NOT directly modify implementation until the investigation phase is completed.

## Debugging Priority Order

Always investigate from simplest and lowest-risk causes to complex causes.

---

## Level 0: Environment Verification

First verify:

- Is the correct project running?
- Is the correct branch/workspace being modified?
- Is the correct URL being tested?
- Is the latest code loaded?

Check:

- package.json
- running command
- port
- browser URL

---

## Level 1: File Loading Problems

Before changing code logic, verify:

- Is the required file imported?
- Is the component actually rendered?
- Is the CSS/asset/API actually loaded?

Examples:
- CSS issue: Check globals.css import / CSS module import / stylesheet loading
- Component issue: Check component usage / route mapping
- API issue: Check endpoint existence / network request

---

## Level 2: Configuration Problems

Check:

- framework configuration
- build configuration
- environment variables
- Tailwind configuration
- TypeScript configuration
- routing configuration

---

## Level 3: Data Flow Problems

Check:

- props
- state
- API response
- database response
- transformation logic

---

## Level 4: Implementation Problems

Only after previous levels are verified:

Modify:

- React components
- business logic
- CSS
- algorithms

---

## Level 5: Refactoring

Refactoring is forbidden during bug fixing.

Only refactor after:

- bug is fixed
- tests pass
- user approves

---

# Required Debug Report

Before making changes, provide:

1. Symptom description
2. Possible causes ranked by probability
3. Checks performed
4. Root cause
5. Minimal fix

Do not modify code before identifying root cause.

These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

# 附录：Starter 沿用规则（原 wangrunlin/seo-nextjs-starter 的 AGENTS.md，未改动一并继承）

本项目基于 wangrunlin/seo-nextjs-starter（MIT）二次开发，以下为其 agent 指引原文，仍然生效：

- This is a public Next.js SEO starter. Use English for public UI, code documentation, and Conventional Commit messages, matching repository history. Provide Chinese translations for user review when requested.
- Preserve the MIT license, working examples, and existing public URLs. Keep demo content clearly identified; do not claim rankings, adoption, or performance scores without evidence.
- Inspect installed Next.js documentation before relying on unfamiliar version-specific APIs. Keep Next, eslint-config-next, and @next/third-parties aligned.
- Use Node.js 22.x and pnpm 11.24.0. Keep the lockfile current. Run `pnpm check`; for SEO changes also run a production server and `pnpm test:seo`.
- Maintain per-page canonical/OG data, sitemap routes, preview noindex, document language alternates, SSR/SSG content, and actual 404 status codes together.
- Never copy the maintainer's domain, analytics ID, or credentials into defaults for template adopters.
- Keep changes focused and retain unrelated user work. Do not push, release, or deploy without user authorization.
