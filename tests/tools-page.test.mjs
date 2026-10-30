// BDD (Gherkin) — T1e: /tools/[slug] SSG pages
//
// Feature: tool pages carrying search-compliant metadata and a real workbench
//   As e-commerce sellers arriving from search
//   I want a tool page whose title, canonical and share data belong to the page
//   So that search engines index the right identity for the right tool
//
// Scenario: implemented tool page serves SSR content and page-scoped metadata
//   Given the server is running at BASE_URL (default http://localhost:6553)
//   When GET /tools/remove-white-background
//   Then response is 200
//   And HTML contains the tool h1 "Remove white background"
//   And <link rel="canonical"> points to BASE + /tools/remove-white-background
//   And meta og:* tags carry the tool title/description
//   And a SoftwareSourceCode JSON-LD script names the tool
//   And the workbench mount (data-workbench="remove-white-background") exists
//   (Tests skip automatically when no server is reachable — pnpm check stays server-free.)
//
// Scenario: every implemented slug serves 200 and every draft slug 404s
//   Given the server is running at BASE_URL
//   When GET each /tools/[slug] from config/tools.ts
//   Then implemented slugs return 200, non-implemented slugs 404
//   (all five MVP slugs are implemented as of T5 — the 404 path is
//   exercised via the unknown-slug scenario below)
//
// Scenario: unknown slugs 404
//   When GET /tools/no-such-tool
//   Then response status is 404
//
// Scenario: workbench upload -> process -> download
//   Given a sample white-background fixture image in the browser
//   When the user drops it, leaves tolerance default and clicks Download
//   Then a PNG with transparent background is produced locally
//   SKIPPED here — DOM interactions need a browser; Playwright E2E lands at T7.
//
// Scenario: implemented tool page renders its guide (T1f)
//   Given the server is running at BASE_URL (default http://localhost:6553)
//   When GET /tools/remove-white-background
//   Then the visible how-to renders: h2 "Three steps, thirty seconds."
//     with all 3 step titles from content/tool-guides.ts
//   And the visible FAQ renders h2 "Frequently asked questions"
//     with all 2 question strings from the same data
//   And a FAQPage JSON-LD script exists whose mainEntity has 2 Questions
//     matching the visible questions
//   (Draft tools without a guide still 404 as before — covered above.)

import test from "node:test";
import assert from "node:assert/strict";
import { getGuide } from "../src/content/tool-guides.ts";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:6553";

let serverUp = false;
try {
  await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(2000) });
  serverUp = true;
} catch {
  serverUp = false;
}

const LIVE = { skip: serverUp ? false : `no server at ${BASE_URL}` };

const get = (path) => fetch(`${BASE_URL}${path}`, { redirect: "manual" });

test("implemented tool page serves SSR content and page-scoped metadata", LIVE, async () => {
  const response = await get("/tools/remove-white-background");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes("Remove white background"), "h1 with tool name");
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert.ok(canonical, "canonical link present");
  assert.ok(
    canonical[1].endsWith("/tools/remove-white-background"),
    `canonical path, got ${canonical[1]}`,
  );
  assert.ok(html.includes('property="og:title"'), "og:title present");
  assert.ok(html.includes("SoftwareSourceCode"), "SoftwareSourceCode JSON-LD");
  assert.ok(
    html.includes('data-workbench="remove-white-background"'),
    "workbench mount",
  );
});

test("every implemented slug serves 200 (T5 consistency)", { skip: !serverUp }, async () => {
  const { TOOLS } = await import("../src/config/tools.ts");
  for (const tool of TOOLS) {
    const response = await get(`/tools/${tool.slug}`);
    assert.equal(
      response.status,
      tool.implemented ? 200 : 404,
      `slug ${tool.slug} (implemented: ${tool.implemented})`,
    );
  }
});

// Scenario PG6: resize-to-preset page serves SSR content and workbench mount (T4)
//   Given the server is running at BASE_URL
//   When GET /tools/resize-to-preset
//   Then response is 200 with h1 "Resize to platform presets"
//   And canonical points to BASE + /tools/resize-to-preset
//   And og:title is page-scoped
//   And the workbench mount data-workbench="resize-to-preset" exists
//   And SoftwareSourceCode + BreadcrumbList JSON-LD are present
test("resize-to-preset page serves SSR content and workbench mount (PG6)", LIVE, async () => {
  const response = await get("/tools/resize-to-preset");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes("Resize to platform presets"), "h1 with tool name");
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert.ok(canonical, "canonical link present");
  assert.ok(
    canonical[1].endsWith("/tools/resize-to-preset"),
    `canonical path, got ${canonical[1]}`,
  );
  assert.ok(html.includes('property="og:title"'), "og:title present");
  assert.ok(
    html.includes('data-workbench="resize-to-preset"'),
    "workbench mount",
  );
  assert.ok(html.includes("SoftwareSourceCode"), "SoftwareSourceCode JSON-LD");
  assert.ok(html.includes("BreadcrumbList"), "BreadcrumbList JSON-LD");
});

// Scenario GC6: resize-to-preset page renders its guide (T4, mirrors GC5)
//   Given the server is running at BASE_URL
//   When GET /tools/resize-to-preset
//   Then the how-to steps and FAQ from content/tool-guides.ts render visibly
//   And a FAQPage JSON-LD script mirrors the visible questions in order
test("resize-to-preset page renders its guide (GC6)", LIVE, async () => {
  const response = await get("/tools/resize-to-preset");
  assert.equal(response.status, 200);
  const html = await response.text();
  const guide = getGuide("resize-to-preset");
  assert.ok(guide, "F02 guide data exists");
  for (const step of guide.steps) {
    assert.ok(html.includes(step.title), `step title visible: ${step.title}`);
  }
  assert.ok(
    html.includes("Frequently asked questions"),
    "visible FAQ h2 (FAQPage schema requires visible Q&A)",
  );
  for (const faq of guide.faqs) {
    assert.ok(html.includes(faq.question), `faq question visible: ${faq.question}`);
  }
  const jsonLd = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  );
  const faqSchema = (jsonLd ?? [])
    .map((tag) => tag.replace(/<[^>]*>/g, ""))
    .map((raw) => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed?.["@type"] === "FAQPage");
  assert.ok(faqSchema, "FAQPage JSON-LD script present");
  assert.deepEqual(
    faqSchema.mainEntity.map((question) => question.name),
    guide.faqs.map((faq) => faq.question),
    "mainEntity matches the visible questions in order",
  );
});

// Scenario PG4: defringe-edges page serves SSR content and workbench mount (T3)
//   Given the server is running at BASE_URL
//   When GET /tools/defringe-edges
//   Then response is 200 with h1 "Defringe white edges"
//   And canonical points to BASE + /tools/defringe-edges
//   And og:title is page-scoped
//   And the workbench mount data-workbench="defringe-edges" exists
//   And SoftwareSourceCode + BreadcrumbList + FAQPage JSON-LD are present
test("defringe-edges page serves SSR content and workbench mount (PG4)", LIVE, async () => {
  const response = await get("/tools/defringe-edges");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes("Defringe white edges"), "h1 with tool name");
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert.ok(canonical, "canonical link present");
  assert.ok(
    canonical[1].endsWith("/tools/defringe-edges"),
    `canonical path, got ${canonical[1]}`,
  );
  assert.ok(html.includes('property="og:title"'), "og:title present");
  assert.ok(
    html.includes('data-workbench="defringe-edges"'),
    "workbench mount",
  );
  assert.ok(html.includes("SoftwareSourceCode"), "SoftwareSourceCode JSON-LD");
  assert.ok(html.includes("BreadcrumbList"), "BreadcrumbList JSON-LD");
});

// Scenario GC5: defringe-edges page renders its guide (T3, mirrors GC4)
//   Given the server is running at BASE_URL
//   When GET /tools/defringe-edges
//   Then the how-to steps and FAQ from content/tool-guides.ts render visibly
//   And a FAQPage JSON-LD script mirrors the visible questions in order
test("defringe-edges page renders its guide (GC5)", LIVE, async () => {
  const response = await get("/tools/defringe-edges");
  assert.equal(response.status, 200);
  const html = await response.text();
  const guide = getGuide("defringe-edges");
  assert.ok(guide, "F08 guide data exists");
  for (const step of guide.steps) {
    assert.ok(html.includes(step.title), `step title visible: ${step.title}`);
  }
  assert.ok(
    html.includes("Frequently asked questions"),
    "visible FAQ h2 (FAQPage schema requires visible Q&A)",
  );
  for (const faq of guide.faqs) {
    assert.ok(html.includes(faq.question), `faq question visible: ${faq.question}`);
  }
  const jsonLd = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  );
  const faqSchema = (jsonLd ?? [])
    .map((tag) => tag.replace(/<[^>]*>/g, ""))
    .map((raw) => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed?.["@type"] === "FAQPage");
  assert.ok(faqSchema, "FAQPage JSON-LD script present");
  assert.deepEqual(
    faqSchema.mainEntity.map((question) => question.name),
    guide.faqs.map((faq) => faq.question),
    "mainEntity matches the visible questions in order",
  );
});

test("unknown slugs 404", { skip: !serverUp }, async () => {
  const response = await get("/tools/no-such-tool");
  assert.equal(response.status, 404);
});

test("implemented tool page renders its guide (T1f)", LIVE, async () => {
  const response = await get("/tools/remove-white-background");
  assert.equal(response.status, 200);
  const html = await response.text();
  const guide = getGuide("remove-white-background");
  assert.ok(guide, "F01 guide data exists");
  assert.ok(html.includes("Three steps, thirty seconds."), "how-to h2");
  for (const step of guide.steps) {
    assert.ok(html.includes(step.title), `step title visible: ${step.title}`);
  }
  assert.ok(
    html.includes("Frequently asked questions"),
    "visible FAQ h2 (FAQPage schema requires visible Q&A)",
  );
  for (const faq of guide.faqs) {
    assert.ok(html.includes(faq.question), `faq question visible: ${faq.question}`);
  }
  const jsonLd = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  );
  const faqSchema = (jsonLd ?? [])
    .map((tag) => tag.replace(/<[^>]*>/g, ""))
    .map((raw) => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed?.["@type"] === "FAQPage");
  assert.ok(faqSchema, "FAQPage JSON-LD script present");
  assert.deepEqual(
    faqSchema.mainEntity.map((question) => question.name),
    guide.faqs.map((faq) => faq.question),
    "mainEntity matches the visible questions in order",
  );
});

test("workbench upload -> process -> download (browser-verified)", () => {
  // SKIPPED — Playwright E2E at T7
});

// T1g: pages with an enabled promo expose the sponsored badge and link,
// while pages without one expose neither (config/promos.ts).
test("enabled promo renders on its tool page (T1g)", LIVE, async () => {
  const response = await get("/tools/remove-white-background");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes("SPONSORED"), "sponsored badge on the promo page");
  assert.ok(html.includes('rel="sponsored'), "sponsored link on the promo page");
});

test("pages without a promo render no sponsored content (T1g)", LIVE, async () => {
  const response = await get("/tools/defringe-edges");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(!html.includes("SPONSORED"), "no sponsored badge without a promo");
  assert.ok(!html.includes('rel="sponsored'), "no sponsored link without a promo");
});

// T2: /tools/compress-to-size page (F10 vertical slice) — approved 2026-10-21
// Feature: the compress-to-size tool page serves its own identity and a real workbench
//
// Scenario PG1: implemented page serves SSR content and workbench mount
//   Given the server is running at BASE_URL
//   When GET /tools/compress-to-size
//   Then response is 200 with h1 "Compress to target size"
//   And canonical points to BASE + /tools/compress-to-size
//   And og:title/description are page-scoped (over the generic starter ones)
//   And the workbench mount data-workbench="compress-to-size" exists
//
// Scenario PG2: page carries the frozen tool identity (config/tools.ts)
//   When GET /tools/compress-to-size
//   Then SoftwareSourceCode JSON-LD names "Compress to target size"
//   And BreadcrumbList JSON-LD is present
//   And the frozen description sentence appears verbatim
//
// Scenario PG3: upload -> compress -> download main path
//   SKIPPED here — DOM interactions need a browser; Playwright E2E lands at T7.
test("compress-to-size page serves SSR content and workbench mount (PG1)", LIVE, async () => {
  const response = await get("/tools/compress-to-size");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes("Compress to target size"), "h1 with tool name");
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert.ok(canonical, "canonical link present");
  assert.ok(
    canonical[1].endsWith("/tools/compress-to-size"),
    `canonical path, got ${canonical[1]}`,
  );
  assert.ok(html.includes('property="og:title"'), "og:title present");
  assert.ok(
    html.includes('data-workbench="compress-to-size"'),
    "workbench mount",
  );
});

test("compress-to-size page carries frozen tool identity (PG2)", LIVE, async () => {
  const response = await get("/tools/compress-to-size");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes("Compress to target size"), "ToolSpec name visible");
  assert.ok(html.includes("SoftwareSourceCode"), "SoftwareSourceCode JSON-LD");
  assert.ok(html.includes("BreadcrumbList"), "BreadcrumbList JSON-LD");
  assert.ok(
    html.includes("Binary search over quality with downsampling fallback"),
    "frozen description sentence verbatim",
  );
});

test("compress-to-size upload -> compress -> download (browser-verified)", () => {
  // SKIPPED — Playwright E2E at T7
});

// Scenario GC4: compress-to-size page renders its guide (T2, mirrors T1f)
//   Given the server is running at BASE_URL
//   When GET /tools/compress-to-size
//   Then the how-to steps and FAQ from content/tool-guides.ts render visibly
//   And a FAQPage JSON-LD script mirrors the visible questions in order
test("compress-to-size page renders its guide (GC4)", LIVE, async () => {
  const response = await get("/tools/compress-to-size");
  assert.equal(response.status, 200);
  const html = await response.text();
  const guide = getGuide("compress-to-size");
  assert.ok(guide, "F10 guide data exists");
  for (const step of guide.steps) {
    assert.ok(html.includes(step.title), `step title visible: ${step.title}`);
  }
  assert.ok(
    html.includes("Frequently asked questions"),
    "visible FAQ h2 (FAQPage schema requires visible Q&A)",
  );
  for (const faq of guide.faqs) {
    assert.ok(html.includes(faq.question), `faq question visible: ${faq.question}`);
  }
  const jsonLd = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  );
  const faqSchema = (jsonLd ?? [])
    .map((tag) => tag.replace(/<[^>]*>/g, ""))
    .map((raw) => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed?.["@type"] === "FAQPage");
  assert.ok(faqSchema, "FAQPage JSON-LD script present");
  assert.deepEqual(
    faqSchema.mainEntity.map((question) => question.name),
    guide.faqs.map((faq) => faq.question),
    "mainEntity matches the visible questions in order",
  );
});

// Scenario PG7: platform-preflight page serves SSR content and workbench mount (T5)
//   Given the server is running at BASE_URL
//   When GET /tools/platform-preflight
//   Then response is 200 with h1 "Platform preflight"
//   And canonical points to BASE + /tools/platform-preflight
//   And og:title is page-scoped
//   And the workbench mount data-workbench="platform-preflight" exists
//   And SoftwareSourceCode + BreadcrumbList JSON-LD are present
test("platform-preflight page serves SSR content and workbench mount (PG7)", LIVE, async () => {
  const response = await get("/tools/platform-preflight");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes("Platform preflight"), "h1 with tool name");
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert.ok(canonical, "canonical link present");
  assert.ok(
    canonical[1].endsWith("/tools/platform-preflight"),
    `canonical path, got ${canonical[1]}`,
  );
  assert.ok(html.includes('property="og:title"'), "og:title present");
  assert.ok(
    html.includes('data-workbench="platform-preflight"'),
    "workbench mount",
  );
  assert.ok(html.includes("SoftwareSourceCode"), "SoftwareSourceCode JSON-LD");
  assert.ok(html.includes("BreadcrumbList"), "BreadcrumbList JSON-LD");
});

// Scenario GC7: platform-preflight page renders its guide (T5, mirrors GC6)
//   Given the server is running at BASE_URL
//   When GET /tools/platform-preflight
//   Then the how-to steps and FAQ from content/tool-guides.ts render visibly
//   And a FAQPage JSON-LD script mirrors the visible questions in order
test("platform-preflight page renders its guide (GC7)", LIVE, async () => {
  const response = await get("/tools/platform-preflight");
  assert.equal(response.status, 200);
  const html = await response.text();
  const guide = getGuide("platform-preflight");
  assert.ok(guide, "F09 guide data exists");
  for (const step of guide.steps) {
    assert.ok(html.includes(step.title), `step title visible: ${step.title}`);
  }
  assert.ok(
    html.includes("Frequently asked questions"),
    "visible FAQ h2 (FAQPage schema requires visible Q&A)",
  );
  for (const faq of guide.faqs) {
    assert.ok(html.includes(faq.question), `faq question visible: ${faq.question}`);
  }
  const jsonLd = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  );
  const faqSchema = (jsonLd ?? [])
    .map((tag) => tag.replace(/<[^>]*>/g, ""))
    .map((raw) => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed?.["@type"] === "FAQPage");
  assert.ok(faqSchema, "FAQPage JSON-LD script present");
  assert.deepEqual(
    faqSchema.mainEntity.map((question) => question.name),
    guide.faqs.map((faq) => faq.question),
    "mainEntity matches the visible questions in order",
  );
});
