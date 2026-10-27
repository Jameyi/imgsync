## Quickstart

ImgSync is five single-task image tools for e-commerce listings. Every tool runs in your browser: the file is decoded, processed and encoded locally, and nothing is uploaded.

To finish a task:

1. Open the tool you need from [the tool list](/tools).
2. Drop an image on the upload area — PNG, JPEG or WebP. The defringe tool takes PNG or WebP, because it works on transparency.
3. Adjust the one value that matters, then download the result.

There is no account, no queue and no watermark. Closing the tab discards everything, because nothing is stored anywhere.

## The five tools

| Tool | What it does | Output | Notes |
| --- | --- | --- | --- |
| [Remove white background](/tools/remove-white-background) | Makes a white or near-white backdrop transparent | PNG with alpha | Flood fill starts at the border, so white inside the product survives |
| [Defringe edges](/tools/defringe-edges) | Strips the white tint baked into cutout edges | PNG with alpha | Run it right after any background removal |
| [Compress to size](/tools/compress-to-size) | Hits a target file size in KB | JPEG | Searches for the best quality that fits; floor is 5 KB |
| [Resize to preset](/tools/resize-to-preset) | Fits an image to a platform canvas | PNG | Amazon 2000×2000, Shopify 2048×2048, Instagram 1080×1080, OG 1200×630, plus a free crop |
| [Platform preflight](/tools/platform-preflight) | Checks an image against marketplace rules | Pass/fail report | Subject-to-canvas ratio, minimum dimensions, file size |

Every tool page carries its own how-to steps and FAQ, and those answers are published as FAQPage structured data.

## How processing works

- **Decode** happens in the browser. The image is turned into pixels once, then handed to the algorithm as an RGBA buffer.
- **Algorithms are pure functions** in `src/lib/image-core/`. They take pixels in and return pixels out — no DOM, no network, no hidden state. That is why they can be unit-tested pixel by pixel.
- **Heavy frames move to a Web Worker.** Images at or above 4 megapixels (4,000,000 pixels) are processed off the main thread, so the page stays responsive while the work runs.
- **Encoding uses Canvas / OffscreenCanvas.** The result is turned into a Blob, previewed, and handed to you as a download. The file never leaves the page.

## Privacy

- Your images are never uploaded. There is no server-side image processing, no storage and no account tied to a file.
- The browser's local storage only remembers whether you chose the light or dark theme.
- No advertising cookies and no cross-site identifiers are used. If aggregate page metrics are enabled, they carry no file contents.
- Outbound links to partner or affiliate sites are governed by those sites' own privacy policies. Nothing about your file is forwarded.

## SEO and indexing

- Every page ships its own title, description, canonical URL and a page-specific share image (1200×630, rendered by `/api/og`).
- Structured data matches what you see: WebSite and SoftwareSourceCode site-wide, BreadcrumbList on nested pages, FAQPage next to the visible FAQ, Article on journal pages.
- `sitemap.xml` lists the public routes. `robots.txt` allows crawling so crawlers can read page-level directives, and preview builds emit `noindex` with an empty sitemap.
- Crawler policy: search and citation crawlers are allowed (OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended), while training and scraper crawlers are blocked (GPTBot, anthropic-ai, Bytespider, CCBot, meta-externalagent).
- `llms.txt` summarises the site for answer engines, and the tool pages are written so an engine can quote them with attribution.

## Self-hosting

The engine is open source under the MIT license. Clone the repository, then run it locally:

```bash
git clone https://github.com/Jameyi/imgsync.git
cd imgsync
pnpm install
cp .env.example .env.local
pnpm dev
```

The dev server runs on `http://localhost:6553`. `NEXT_PUBLIC_URL` must be a full origin such as `https://imgsync.civlensai.com` — it is inlined at build time and drives canonical URLs, the sitemap and the share images.

Checks before you ship:

```bash
pnpm check      # lint + typecheck + unit tests + production build
pnpm test:seo   # HTTP checks against a running production server
```

`pnpm test:seo` accepts `SEO_CHECK_URL` so you can point it at a deployed site.

## Limits to know

- Marketplace rules change without notice. The presets and preflight thresholds reflect published requirements at the time of writing — always re-check before publishing.
- Compression is lossy. If a target size cannot be reached, you get the closest result and an honest note rather than a silently trashed image.
- Background removal is colour-tolerance based and starts from the border. Complex backdrops still need manual work.
- Defringing only recolours semi-transparent pixels that touch full transparency. Opaque areas, alpha values and dimensions stay untouched.
- There is no AI segmentation, no layered editor and no PSD export. Each tool does one job and stops.
- Batch processing is not live yet — one file per run for now.

## Support

Bug reports and feature requests go to the issue tracker: [Jameyi/imgsync](https://github.com/Jameyi/imgsync/issues). Include the tool you used, your browser, and what you expected versus what you got.

The next planned steps are batch processing, more platform presets, and PNG/WebP compression targets.
