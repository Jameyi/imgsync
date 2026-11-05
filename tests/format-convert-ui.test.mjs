// BDD (Gherkin) — F04 Format Convert: orchestration layer + tool registration
//
// Feature: convert an image between JPEG, PNG and WebP in the browser
//   As a seller or creator with a platform-restricted upload
//   I want to convert a local image to another format and see the size change
//   So that the upload passes without installing an editor
//
// (Format encoding itself runs on canvas in the browser — its output magic
//  numbers are covered by Playwright E2E; these node tests pin the
//  orchestration decisions that are pure and cheap to assert.)
//
// Feature: orchestration format registry
//   As the workbench
//   I want a single source of truth for supported target formats
//   So that the select options, MIME types and extensions never drift apart
//
// Scenario: each format maps to its MIME type and file extension
//   Given the format registry
//   When "jpeg" is looked up
//   Then the MIME type is "image/jpeg" and the extension is ".jpg"
//   And "png" maps to "image/png" with ".png"
//   And "webp" maps to "image/webp" with ".webp"
//
// Scenario: an unknown format is rejected
//   Given the format registry
//   When "gif" is looked up
//   Then the result is null
//
// Scenario: quality applies only to lossy formats
//   Given the format registry
//   When the registry is inspected
//   Then "jpeg" and "webp" are marked lossy
//   And "png" is not marked lossy
//
// Scenario: output file name swaps the extension
//   Given the source file name "photo.JPG"
//   When the output name is built for format "png"
//   Then the result is "photo.png"
//
// Feature: tool registration and page presence
//   As a visitor searching for "convert png to jpg"
//   I want a working /tools/format-convert page
//   So that I can land directly on the tool
//
// Scenario: format-convert is registered in the tools config
//   Given the TOOLS registry
//   When it is inspected
//   Then it contains slug "format-convert" with implemented: true
//
// Scenario: format-convert appears in the sitemap
//   Given the sitemap route is evaluated
//   When the URL list is generated
//   Then it contains /tools/format-convert

import test from "node:test";
import assert from "node:assert/strict";
import {
  FORMATS,
  lookupFormat,
  buildOutputFileName,
} from "../src/lib/tools/format-convert.ts";
import { TOOLS } from "../src/config/tools.ts";

// Tests -----------------------------------------------------------------------

test("each format maps to its MIME type and file extension", async () => {
  assert.equal(lookupFormat("jpeg")?.mime, "image/jpeg");
  assert.equal(lookupFormat("jpeg")?.ext, ".jpg");
  assert.equal(lookupFormat("png")?.mime, "image/png");
  assert.equal(lookupFormat("png")?.ext, ".png");
  assert.equal(lookupFormat("webp")?.mime, "image/webp");
  assert.equal(lookupFormat("webp")?.ext, ".webp");
});

test("an unknown format is rejected", async () => {
  assert.equal(lookupFormat("gif"), null);
  assert.equal(lookupFormat(""), null);
});

test("quality applies only to lossy formats", async () => {
  assert.equal(lookupFormat("jpeg")?.lossy, true);
  assert.equal(lookupFormat("webp")?.lossy, true);
  assert.equal(lookupFormat("png")?.lossy, false);
  // Registry exposes exactly the three supported formats.
  assert.deepEqual(Object.keys(FORMATS).sort(), ["jpeg", "png", "webp"]);
});

test("output file name swaps the extension", async () => {
  assert.equal(buildOutputFileName("photo.JPG", "png"), "photo.png");
  assert.equal(buildOutputFileName("scan.png", "jpeg"), "scan.jpg");
  assert.equal(buildOutputFileName("noext", "webp"), "noext.webp");
});

test("format-convert is registered in the tools config", async () => {
  const tool = TOOLS.find((entry) => entry.slug === "format-convert");
  assert.ok(tool, "format-convert missing from TOOLS");
  assert.equal(tool.implemented, true);
});

test("format-convert appears in the sitemap", async () => {
  process.env.NEXT_PUBLIC_URL ??= "https://imgsync.example";
  const { default: sitemap } = await import("../src/app/sitemap.ts");
  const urls = sitemap().map((entry) => new URL(entry.url).pathname);
  assert.ok(
    urls.includes("/tools/format-convert"),
    "sitemap missing /tools/format-convert",
  );
});
