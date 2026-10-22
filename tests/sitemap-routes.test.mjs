// BDD (Gherkin) — T7b: sitemap coverage (PRD user story 19)
// (behaviour sheet approved as part of the T7 sheet, bodies per sheet)
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

// Feature: sitemap covers every publishable route and honours noindex
//
// Scenario: indexable build lists home, all implemented tools and content pages
//   Given a build with NEXT_PUBLIC_URL set (indexable)
//   When the sitemap is generated
//   Then it contains "/" plus every implemented /tools/[slug]
//   And it contains the content pages /about and /docs
//   And every entry carries an absolute URL on the configured origin
//
// Scenario: non-indexable build emits an empty urlset
//   Given a build without NEXT_PUBLIC_URL (preview/dev)
//   When the sitemap is generated
//   Then the route array is empty (noindex discipline)
//
// Each scenario runs in a child process: config.ts evaluates indexable at
// import time, so the two environments must not share a module registry.

const SITEMAP_URL = new URL("../src/app/sitemap.ts", import.meta.url).href;

const runSitemap = (env) => {
  const script = `const mod = await import(${JSON.stringify(SITEMAP_URL)});
process.stdout.write(JSON.stringify(mod.default()));`;
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", script],
    { env: { ...process.env, ...env }, encoding: "utf8" },
  );
  assert.equal(result.status, 0, `sitemap eval failed: ${result.stderr}`);
  return JSON.parse(result.stdout);
};

const TOOL_SLUGS = [
  "remove-white-background",
  "compress-to-size",
  "resize-to-preset",
  "defringe-edges",
  "platform-preflight",
];

const CONTENT_PATHS = ["/about", "/docs"];

test("indexable build lists home, all implemented tools and content pages", () => {
  const routes = runSitemap({ NEXT_PUBLIC_URL: "https://imgsync.example" });
  const urls = routes.map((entry) => new URL(entry.url).pathname);
  assert.ok(urls.includes("/"), "home page in sitemap");
  for (const slug of TOOL_SLUGS) {
    assert.ok(urls.includes(`/tools/${slug}`), `tool route /tools/${slug}`);
  }
  for (const path of CONTENT_PATHS) {
    assert.ok(urls.includes(path), `content page ${path}`);
  }
  for (const entry of routes) {
    assert.ok(
      entry.url.startsWith("https://imgsync.example/"),
      `absolute URL on the configured origin: ${entry.url}`,
    );
  }
});

test("non-indexable build emits an empty urlset (preview noindex)", () => {
  // no NEXT_PUBLIC_URL → falls back to localhost → not indexable
  const routes = runSitemap({ NEXT_PUBLIC_URL: "" });
  assert.deepEqual(routes, [], "no URLs when not indexable");
});
