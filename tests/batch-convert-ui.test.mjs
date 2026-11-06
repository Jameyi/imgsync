// BDD (Gherkin) — F06 Batch Convert: orchestration decisions + registration
//
// Feature: convert many images in one pass and download a single zip
//   As the workbench
//   I want the batch orchestration to expose pure decisions
//   So that the UI wiring, naming and the algorithm seam never drift apart
//
// (Canvas encoding runs in the browser per file via the existing
//  format-convert pipeline — output bytes are covered by Playwright E2E;
//  these node tests pin the pure decision points.)
//
// Scenario: file count is capped
//   Given the batch limits
//   When a 30-file selection is checked
//   Then it is accepted
//   And a 31-file selection is rejected with a limit message
//
// Scenario: each result keeps a unique, correctly-named file
//   Given source files "a.png", "b.png" and "a.jpg" converted to webp
//   When output names are built
//   Then the names are "a.webp", "b.webp" and "a-1.webp" (collision suffixed)
//
// Scenario: the zip download name is dated and prefixed
//   Given a batch finished on any date
//   When the archive name is built
//   Then it starts with "imgsync-batch-" and ends with ".zip"
//
// Scenario: one failed file does not sink the batch
//   Given a 3-file batch where the second file fails to encode
//   When the batch result is summarized
//   Then 2 files succeeded and 1 is reported as failed
//
// Feature: tool registration and page presence
//   As a visitor searching for "batch convert images online"
//   I want a working /tools/batch-convert page
//   So that I can land directly on the tool
//
// Scenario: batch-convert is registered in the tools config
//   Given the TOOLS registry
//   When it is inspected
//   Then it contains slug "batch-convert" with implemented: true
//
// Scenario: batch-convert appears in the sitemap
//   Given the sitemap route is evaluated
//   When the URL list is generated
//   Then it contains /tools/batch-convert

import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_BATCH_FILES,
  isBatchSizeOk,
  buildBatchOutputNames,
  buildZipArchiveName,
  summarizeBatch,
} from "../src/lib/tools/batch-convert.ts";
import { TOOLS } from "../src/config/tools.ts";

// Tests -----------------------------------------------------------------------

test("file count is capped", async () => {
  assert.equal(MAX_BATCH_FILES, 30);
  assert.equal(isBatchSizeOk(30), true);
  assert.equal(isBatchSizeOk(31), false);
});

test("each result keeps a unique, correctly-named file", async () => {
  assert.deepEqual(
    buildBatchOutputNames(["a.png", "b.png", "a.jpg"], "webp"),
    ["a.webp", "b.webp", "a-1.webp"],
  );
});

test("the zip download name is dated and prefixed", async () => {
  const name = buildZipArchiveName(new Date("2026-11-06T12:00:00Z"));
  assert.ok(name.startsWith("imgsync-batch-"), `prefix missing in ${name}`);
  assert.ok(name.endsWith(".zip"), `suffix missing in ${name}`);
  assert.match(name, /^imgsync-batch-\d{8}\.zip$/);
});

test("one failed file does not sink the batch", async () => {
  const results = [
    { ok: true, name: "a.webp", data: new Uint8Array([1]) },
    { ok: false, name: "b.webp", error: "encode failed" },
    { ok: true, name: "c.webp", data: new Uint8Array([2]) },
  ];
  const summary = summarizeBatch(results);
  assert.equal(summary.succeeded.length, 2);
  assert.equal(summary.failed.length, 1);
  assert.equal(summary.failed[0].name, "b.webp");
  assert.equal(summary.failed[0].error, "encode failed");
});

test("batch-convert is registered in the tools config", async () => {
  const tool = TOOLS.find((entry) => entry.slug === "batch-convert");
  assert.ok(tool, "batch-convert missing from TOOLS");
  assert.equal(tool.implemented, true);
});

test("batch-convert appears in the sitemap", async () => {
  process.env.NEXT_PUBLIC_URL ??= "https://imgsync.example";
  const { default: sitemap } = await import("../src/app/sitemap.ts");
  const urls = sitemap().map((entry) => new URL(entry.url).pathname);
  assert.ok(
    urls.includes("/tools/batch-convert"),
    "sitemap missing /tools/batch-convert",
  );
});
