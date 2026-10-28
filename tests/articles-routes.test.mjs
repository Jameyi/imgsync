// BDD (Gherkin) — articles routes (guides)
//
// Feature: guides are server-rendered and indexable
//   As a seller looking for marketplace image rules
//   I want each guide served as a static page with its own metadata
//   So that search engines can index it and I can land directly on it
//
// Scenario: the guides index lists every published article
//   Given the articles content collection
//   When the articles index route is rendered
//   Then it contains a link to /articles/<slug> for every article in the collection
//
// Scenario: each article detail route is statically generated
//   Given the articles content collection
//   When generateStaticParams runs for /articles/[slug]
//   Then it returns exactly one param set per article slug
//
// Scenario: an unknown article slug is a real 404
//   Given a slug that is not in the articles collection
//   When the detail route is requested with dynamicParams disabled
//   Then the route resolves to notFound
//
// Feature: article metadata and structured data
//   As a site owner
//   I want canonical URLs and Article JSON-LD on every guide
//   So that Google indexes the preferred URL and AI engines can cite the guide
//
// Scenario: an article page carries article-type metadata
//   Given a published article
//   When generateMetadata runs for its slug
//   Then openGraph.type is "article"
//   And openGraph.publishedTime equals the article date
//   And the canonical URL points at https://<base>/articles/<slug>
//
// Scenario: an article page emits Article and BreadcrumbList JSON-LD
//   Given a published article
//   When the detail page is rendered
//   Then the page contains a script tag with @type "Article"
//   And the page contains a script tag with @type "BreadcrumbList"
//   And the breadcrumb trail is Home → Guides → the article title
//
// Feature: guides are discoverable
//   As a site owner
//   I want guides present in the sitemap and reachable from the homepage nav
//   So that crawlers find the collection without external links
//
// Scenario: the sitemap includes the guides index and every article
//   Given the sitemap route is evaluated
//   When the URL list is generated
//   Then it contains /articles
//   And it contains /articles/<slug> for every article slug
//
// Scenario: guides are reachable from site navigation
//   Given the site header or footer navigation
//   When it is rendered
//   Then it contains a link to /articles
//
// Note: page modules (.tsx with JSX) cannot be imported directly under
// node --test, so route-level behavior is asserted against the module
// source; data-level behavior (articles.ts, sitemap.ts) imports directly.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { articles } from "../src/content/articles.ts";
process.env.NEXT_PUBLIC_URL ??= "https://imgsync.example";
const { default: sitemap } = await import("../src/app/sitemap.ts");

const read = (rel) =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const INDEX_SOURCE = read("../src/app/articles/page.tsx");
const DETAIL_SOURCE = read("../src/app/articles/[slug]/page.tsx");

// --- Scenario bodies ------------------------------------------------------

test("the guides index lists every published article", () => {
  // The index maps over the imported collection and links by slug, so every
  // article in the collection gets a card automatically.
  assert.match(INDEX_SOURCE, /from "@\/content\/articles"/);
  assert.match(INDEX_SOURCE, /articles\.map/);
  assert.match(INDEX_SOURCE, /href=\{`\/articles\/\$\{article\.slug\}`\}/);
});

test("each article detail route is statically generated", () => {
  assert.match(
    DETAIL_SOURCE,
    /export function generateStaticParams\(\)\s*\{\s*return articles\.map\(\(\{ slug \}\) => \(\{ slug \}\)\);\s*\}/,
  );
  // dynamicParams disabled → unknown slugs cannot render at runtime
  assert.match(DETAIL_SOURCE, /export const dynamicParams = false;/);
});

test("an unknown article slug is a real 404", () => {
  // With dynamicParams disabled, Next.js 404s any slug outside
  // generateStaticParams; the page body also calls notFound() as a guard.
  assert.match(DETAIL_SOURCE, /if \(!article\) notFound\(\);/);
  assert.match(DETAIL_SOURCE, /export const dynamicParams = false;/);
});

test("an article page carries article-type metadata", () => {
  const ogBlock = DETAIL_SOURCE.match(
    /openGraph: \{\s*\.\.\.metadata\.openGraph,\s*type: "article" as const,\s*publishedTime: article\.date,\s*modifiedTime: article\.date,/,
  );
  assert.ok(ogBlock, "openGraph.type article with published/modified time");
  assert.match(
    DETAIL_SOURCE,
    /pageMetadata\(\s*article\.title,\s*`\/articles\/\$\{slug\}`,\s*article\.summary,/,
  );
});

test("an article page emits Article and BreadcrumbList JSON-LD", () => {
  assert.match(DETAIL_SOURCE, /"@type": "Article"/);
  // BreadcrumbList is emitted by lib/seo's breadcrumbs() helper; the page
  // must call it with the Home → Guides → article title trail.
  assert.match(DETAIL_SOURCE, /breadcrumbs\(\[/);
  assert.match(DETAIL_SOURCE, /\{ name: "Home", path: "\/" \},/);
  assert.match(DETAIL_SOURCE, /\{ name: "Guides", path: "\/articles" \},/);
  assert.match(DETAIL_SOURCE, /\{ name: article\.title, path \},/);
});

test("the sitemap includes the guides index and every article", () => {
  const urls = sitemap().map((entry) => new URL(entry.url).pathname);
  assert.ok(urls.includes("/articles"), "sitemap has /articles");
  for (const article of articles) {
    assert.ok(
      urls.includes(`/articles/${article.slug}`),
      `sitemap has /articles/${article.slug}`,
    );
  }
});

test("guides are reachable from site navigation", () => {
  const candidates = [
    "../src/components/Header.tsx",
    "../src/components/Footer.tsx",
    "../src/app/layout.tsx",
  ];
  const found = candidates.map(read).some((source) =>
    source.includes('"/articles"'),
  );
  assert.ok(found, "header/footer/layout links to /articles");
});
