# ImgSync

Free, browser-based image tools. Every file is processed locally in your browser with Canvas and Web Worker APIs — no uploads, no accounts, no tracking.

> ImgSync is built on [wangrunlin/seo-nextjs-starter](https://github.com/wangrunlin/seo-nextjs-starter) (MIT) as its site skeleton; the image engine and product itself are ImgSync's own.

## Features (planned, see docs/PRD.md)

- **Local-only processing** — images never leave your device; the site has no backend and no database.
- **Pure-function image engine** — `lib/image-core` exposes a unified `process(input: ImageData, options)` seam, published as a standalone npm package.
- **Tool-per-route pages** — SSG routes under `/tools/[slug]` with how-to steps, FAQ schema, and related-tool links.
- **SEO foundations** — per-page canonical/OG metadata, routed sitemap/robots, dynamic OG images, JSON-LD, and hreflang inherited from the starter.

## Getting started

Use Node.js 22.x and pnpm 11.24.0.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:6553`.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server on port 6553 |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm test` | Unit tests (node:test) |
| `pnpm test:seo` | HTTP SEO checks against a production server |
| `pnpm check` | lint + typecheck + test + build |

## Project docs

- [docs/PRD.md](docs/PRD.md) — product requirements and tool list
- [docs/CODING_RULES.md](docs/CODING_RULES.md) — module boundaries and dependency rules
- [docs/Testing_Strategy.md](docs/Testing_Strategy.md) — test matrix and acceptance checks

## License

[MIT](LICENSE). Based on the SEO Next.js Starter; the original copyright notice is preserved as required by the license.
