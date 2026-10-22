// BDD (Gherkin) — T6: real homepage (src/app/page.tsx)
// (behaviour sheet approved 2026-10-22, bodies per sheet)
import test from "node:test";
import assert from "node:assert/strict";
import { TOOLS } from "../src/config/tools.ts";

// Feature: homepage sells the real toolkit
//   As a visitor arriving from search or the sitemap
//   I want the homepage to show the five live tools and the privacy promise
//   So that I can reach a working tool in one click and trust it before I do
//
// Scenario: MVP tools drive the homepage grid from the frozen registry
//   Given the rendered "/" page
//   When the HTML is inspected
//   Then all five implemented tool names from config/tools.ts appear
//   And each tool name links to its /tools/[slug] route
//   And no PHASE-2/LATER tool (e.g. "Favicon kit") is promised
//
// Scenario: hero carries the positioning and the privacy line
//   When the HTML is inspected
//   Then the h1 contains the positioning headline
//   And the privacy line "never leave" (local processing promise) appears
//
// Scenario: homepage keeps site-level JSON-LD and canonical
//   When the HTML is inspected
//   Then a WebSite JSON-LD script is present
//   And <link rel="canonical"> points to the site root

const BASE_URL = process.env.BASE_URL ?? "http://localhost:6553";

let serverUp = false;
try {
  await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(2000) });
  serverUp = true;
} catch {
  serverUp = false;
}

const LIVE = { skip: serverUp ? false : `no server at ${BASE_URL}` };

test("MVP tools drive the homepage grid from the frozen registry", LIVE, async () => {
  const html = await (await fetch(`${BASE_URL}/`)).text();
  for (const tool of TOOLS.filter((t) => t.implemented)) {
    assert.ok(html.includes(tool.name), `tool name visible: ${tool.name}`);
    assert.ok(
      html.includes(`href="/tools/${tool.slug}"`),
      `tool links to its route: /tools/${tool.slug}`,
    );
  }
  assert.ok(!html.includes("Favicon kit"), "no unshipped tool is promised");
});

test("hero carries the positioning and the privacy line", LIVE, async () => {
  const html = await (await fetch(`${BASE_URL}/`)).text();
  assert.ok(html.includes("pass inspection"), "positioning headline");
  assert.ok(/never leave/i.test(html), "local-processing promise line");
});

test("homepage keeps site-level JSON-LD and canonical", LIVE, async () => {
  const html = await (await fetch(`${BASE_URL}/`)).text();
  assert.ok(html.includes('"WebSite"'), "WebSite JSON-LD present");
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert.ok(canonical, "canonical link present");
  assert.ok(/\/?$/.test(canonical[1]), "canonical points at the site root");
});
