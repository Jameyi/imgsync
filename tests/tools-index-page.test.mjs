// BDD (Gherkin) — /tools hub page
//
// Feature: the /tools hub page is a real landing page for the toolkit
//   As a visitor arriving from search or from the top nav
//   I want one page that lists every tool and explains what each one does
//   So that I can pick the operation my listing needs without guessing URLs
//
// Scenario: the hub page serves content and links every implemented tool
//   Given the server is running at BASE_URL (default http://localhost:6553)
//   When GET /tools
//   Then response is 200
//   And HTML contains the h1 "Five tools, one job each."
//   And it links to every implemented /tools/[slug] from config/tools.ts
//   And <link rel="canonical"> points to BASE + /tools
//   And a BreadcrumbList JSON-LD script names Home and Tools
//   (Tests skip automatically when no server is reachable — pnpm check stays server-free.)
//
// Scenario: the hub page is listed in the sitemap
//   Given an indexable build
//   When the sitemap is generated
//   Then it contains /tools
//   And it contains every implemented /tools/[slug]

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:6553";

let serverUp = false;
try {
  await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(2000) });
  serverUp = true;
} catch {
  serverUp = false;
}

const LIVE = { skip: serverUp ? false : `no server at ${BASE_URL}` };

test("the hub page serves content and links every implemented tool", LIVE, async () => {
  const response = await fetch(`${BASE_URL}/tools`, { redirect: "manual" });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(
    html.includes("Five tools, one job each."),
    "h1 with the hub positioning",
  );
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert.ok(canonical, "canonical link present");
  assert.ok(canonical[1].endsWith("/tools"), `canonical path, got ${canonical[1]}`);
  const { TOOLS } = await import("../src/config/tools.ts");
  for (const tool of TOOLS.filter((entry) => entry.implemented)) {
    assert.ok(
      html.includes(`href="/tools/${tool.slug}"`),
      `links to /tools/${tool.slug}`,
    );
  }
  const breadcrumb = [...html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  )]
    .map((match) => JSON.parse(match[1]))
    .find((data) => data["@type"] === "BreadcrumbList");
  assert.ok(breadcrumb, "BreadcrumbList JSON-LD present");
  const names = breadcrumb.itemListElement.map((item) => item.name);
  assert.ok(names.includes("Home"), "breadcrumb names Home");
  assert.ok(names.includes("Tools"), "breadcrumb names Tools");
});

const SITEMAP_URL = new URL("../src/app/sitemap.ts", import.meta.url).href;

test("the hub page is listed in the sitemap", async () => {
  const script = `const mod = await import(${JSON.stringify(SITEMAP_URL)});
process.stdout.write(JSON.stringify(mod.default()));`;
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", script],
    {
      env: { ...process.env, NEXT_PUBLIC_URL: "https://imgsync.example" },
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, `sitemap eval failed: ${result.stderr}`);
  const paths = JSON.parse(result.stdout).map((entry) => new URL(entry.url).pathname);
  assert.ok(paths.includes("/tools"), "/tools in sitemap");
  const { TOOLS } = await import("../src/config/tools.ts");
  for (const tool of TOOLS.filter((entry) => entry.implemented)) {
    assert.ok(paths.includes(`/tools/${tool.slug}`), `tool route /tools/${tool.slug}`);
  }
});
