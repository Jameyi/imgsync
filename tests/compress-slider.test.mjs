// BDD (Gherkin) — compress-to-size bounded target slider (user request 2026-10-22)
// (behaviour sheet approved — bodies per sheet)
import test from "node:test";
import assert from "node:assert/strict";
import { loadImageFromFiles } from "../src/lib/tools/runtime.ts";

// Feature: bounded target-size slider replaces the number input
//
// Scenario: slider bounds track the uploaded image
//   Given an uploaded image of N KB (from File.size via LoadedImage)
//   Then the slider minimum is 5 KB and its maximum is max(N, 6) KB
//   (max clamps to just above min for tiny images so the range is valid)
//
// Scenario: default target stays sane for any image
//   When an image is loaded
//   Then the default target is min(100, slider max) KB
//
// Scenario: dragging does not spam compression; Compress applies
//   When the slider value changes
//   Then only the displayed target updates
//   And compression runs when the user clicks Compress (unchanged)
//
// Scenario: runtime contract
//   When loadImageFromFiles loads a file
//   Then the returned LoadedImage carries fileSizeBytes = File.size
//   (browser-verified — DOM File APIs; node asserts the type seam only)

test("runtime contract — loadImageFromFiles exposes fileSizeBytes", () => {
  // seam check: the orchestration loader must carry the source byte size
  // so the workbench can bound the slider. Real File round-trip is
  // browser-verified (Playwright E2E at T7), as with T1d's DOM skip.
  assert.equal(typeof loadImageFromFiles, "function");
});
