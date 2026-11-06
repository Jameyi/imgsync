// BDD (Gherkin) — F05 Fix Orientation: orchestration decisions + registration
//
// Feature: straighten phone photos by their EXIF orientation
//   As a user uploading a phone photo
//   I want the tool to read the EXIF orientation and export an upright image
//   So that the photo is never sideways after upload
//
// (The EXIF parser and pixel rotation live in lib/image-core/exif.ts and are
//  fully covered by tests/exif.test.mjs — this file pins the orchestration
//  decisions the workbench makes around them.)
//
// Scenario: only JPEG inputs are eligible for EXIF correction
//   Given a file named "photo.jpg" with MIME image/jpeg
//   When eligibility is checked
//   Then it is eligible
//   And a file named "diagram.png" is not eligible
//
// Scenario: orientation 1 means no fix is needed
//   Given an eligible file whose EXIF orientation is 1 (or absent)
//   When the fix decision is resolved
//   Then the result says the photo needs no rotation
//
// Scenario: orientation 6 means pixels get rotated
//   Given an eligible file whose EXIF orientation is 6
//   When the fix decision is resolved
//   Then the result says rotation was applied with orientation 6
//
// Scenario: output file name appends the -fixed suffix
//   Given the source file name "IMG_0001.JPG"
//   When the output name is built
//   Then the result is "IMG_0001-fixed.jpg"
//
// Feature: tool registration and page presence
//   As a visitor searching for "fix exif orientation online"
//   I want a working /tools/fix-orientation page
//   So that I can land directly on the tool
//
// Scenario: fix-orientation is registered in the tools config
//   Given the TOOLS registry
//   When it is inspected
//   Then it contains slug "fix-orientation" with implemented: true
//
// Scenario: fix-orientation appears in the sitemap
//   Given the sitemap route is evaluated
//   When the URL list is generated
//   Then it contains /tools/fix-orientation

import test from "node:test";
import assert from "node:assert/strict";
import {
  isEligibleForExif,
  resolveFixDecision,
  buildFixedFileName,
} from "../src/lib/tools/fix-orientation.ts";
import { TOOLS } from "../src/config/tools.ts";

// Tests -----------------------------------------------------------------------

test("only JPEG inputs are eligible for EXIF correction", async () => {
  assert.equal(isEligibleForExif({ name: "photo.jpg", type: "image/jpeg" }), true);
  assert.equal(isEligibleForExif({ name: "scan.jpeg", type: "" }), true);
  assert.equal(isEligibleForExif({ name: "diagram.png", type: "image/png" }), false);
});

test("orientation 1 means no fix is needed", async () => {
  assert.deepEqual(resolveFixDecision(1), { action: "none" });
  assert.deepEqual(resolveFixDecision(null), { action: "none" });
});

test("orientation 6 means pixels get rotated", async () => {
  assert.deepEqual(resolveFixDecision(6), { action: "rotate", orientation: 6 });
  assert.deepEqual(resolveFixDecision(8), { action: "rotate", orientation: 8 });
});

test("output file name appends the -fixed suffix", async () => {
  assert.equal(buildFixedFileName("IMG_0001.JPG"), "IMG_0001-fixed.jpg");
  assert.equal(buildFixedFileName("noext"), "noext-fixed.jpg");
});

test("fix-orientation is registered in the tools config", async () => {
  const tool = TOOLS.find((entry) => entry.slug === "fix-orientation");
  assert.ok(tool, "fix-orientation missing from TOOLS");
  assert.equal(tool.implemented, true);
});

test("fix-orientation appears in the sitemap", async () => {
  process.env.NEXT_PUBLIC_URL ??= "https://imgsync.example";
  const { default: sitemap } = await import("../src/app/sitemap.ts");
  const urls = sitemap().map((entry) => new URL(entry.url).pathname);
  assert.ok(
    urls.includes("/tools/fix-orientation"),
    "sitemap missing /tools/fix-orientation",
  );
});
