// BDD (Gherkin) — robots policy and demo-route indexing
//
// Feature: robots.txt states who may read the site
//   As a site owner publishing free product-image tooling
//   I want search and citation crawlers allowed while training crawlers blocked
//   So that answer engines can cite my pages without my content becoming training data
//
// Scenario: citation crawlers are allowed
//   Given the robots route is evaluated
//   When the rule groups are generated
//   Then OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot and Google-Extended are allowed
//   And the wildcard group allows "/"
//
// Scenario: training crawlers are blocked
//   Given the robots route is evaluated
//   When the rule groups are generated
//   Then GPTBot, anthropic-ai, Bytespider, CCBot and meta-externalagent are disallowed
//
// Feature: starter demo routes stay out of the index
//   As a site owner
//   I want the leftover starter example pages excluded from indexing
//   So that thin demo content does not compete with the real tool pages
//
// Scenario: a demo route carries noindex
//   Given the shared page metadata helper
//   When metadata is generated for a path under /examples
//   Then robots.index is false
//
// Scenario: a public route stays indexable
//   Given the shared page metadata helper
//   When metadata is generated for /tools or /privacy-policy
//   Then robots.index follows the site-wide indexable flag

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import robots from "../src/app/robots.ts";

const CITATION_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
];

const TRAINING_CRAWLERS = [
  "GPTBot",
  "anthropic-ai",
  "Bytespider",
  "CCBot",
  "meta-externalagent",
];

const groupFor = (rules, agent) =>
  rules.find(
    (rule) => String(rule.userAgent).toLowerCase() === agent.toLowerCase(),
  );

test("citation crawlers are allowed", () => {
  const { rules } = robots();
  for (const agent of CITATION_CRAWLERS) {
    const group = groupFor(rules, agent);
    assert.ok(group, `rule group for ${agent}`);
    assert.equal(group.allow, "/", `${agent} allowed`);
    assert.equal(group.disallow, undefined, `${agent} not disallowed`);
  }
  const wildcard = groupFor(rules, "*");
  assert.ok(wildcard, "wildcard rule group");
  assert.equal(wildcard.allow, "/", 'wildcard allows "/"');
});

test("training crawlers are blocked", () => {
  const { rules } = robots();
  for (const agent of TRAINING_CRAWLERS) {
    const group = groupFor(rules, agent);
    assert.ok(group, `rule group for ${agent}`);
    assert.equal(group.disallow, "/", `${agent} disallowed`);
    assert.equal(group.allow, undefined, `${agent} not allowed`);
  }
});

const METADATA_URL = new URL("../src/lib/seo.ts", import.meta.url).href;

const runRobotsMetadata = (path) => {
  const script = `const mod = await import(${JSON.stringify(METADATA_URL)});
process.stdout.write(JSON.stringify(mod.pageMetadata("T", ${JSON.stringify(path)}, "d").robots));`;
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "--eval", script],
    {
      env: { ...process.env, NEXT_PUBLIC_URL: "https://imgsync.example" },
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, `metadata eval failed: ${result.stderr}`);
  return JSON.parse(result.stdout);
};

test("a demo route carries noindex", () => {
  assert.equal(runRobotsMetadata("/examples").index, false);
  assert.equal(runRobotsMetadata("/examples/articles/canonical-urls").index, false);
});

test("a public route stays indexable", () => {
  assert.equal(runRobotsMetadata("/tools").index, true);
  assert.equal(runRobotsMetadata("/privacy-policy").index, true);
});
