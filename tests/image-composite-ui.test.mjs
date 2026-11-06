// BDD (Gherkin) — F11 Image Composite: orchestration decisions + registration
//
// Feature: compose a product shot onto a supplier backdrop template
//   As the workbench
//   I want the composite orchestration to expose pure decisions
//   So that the UI wiring and the algorithm seam never drift apart
//
// (Canvas compositing itself runs in the browser — output bytes are covered
//  by Playwright E2E; these node tests pin the pure decision points.)
//
// Scenario: placement presets map to anchors on a known box
//   Given a 4x4 backdrop and a 2x2 foreground
//   When each of the nine placements is resolved
//   Then top-left resolves to anchor (0,0)
//   And center resolves to (1,1)
//   And bottom-right resolves to (2,2)
//   And edge placements clamp within the box for a 3x3 foreground
//
// Scenario: placement is exposed as a flat list for the select options
//   Given the placement registry
//   When it is inspected
//   Then it lists exactly the nine presets with their labels
//
// Scenario: background fit modes are exposed for the select options
//   Given the fit-mode registry
//   When it is inspected
//   Then it lists cover, contain and stretch
//
// Scenario: tool registration and page presence
//   As a visitor searching for "overlay image on background"
//   I want a working /tools/image-composite page
//   So that I can land directly on the tool
//
// Scenario: image-composite is registered in the tools config
//   Given the TOOLS registry
//   When it is inspected
//   Then it contains slug "image-composite" with implemented: true
//
// Scenario: image-composite appears in the sitemap
//   Given the sitemap route is evaluated
//   When the URL list is generated
//   Then it contains /tools/image-composite

import test from "node:test";
import assert from "node:assert/strict";
import {
  PLACEMENTS,
  FIT_MODES,
  resolvePlacementAnchor,
} from "../src/lib/tools/image-composite.ts";
import { TOOLS } from "../src/config/tools.ts";

// Tests -----------------------------------------------------------------------

test("placement presets map to anchors on a known box", async () => {
  assert.deepEqual(resolvePlacementAnchor("top-left", 4, 4, 2, 2), { x: 0, y: 0 });
  assert.deepEqual(resolvePlacementAnchor("center", 4, 4, 2, 2), { x: 1, y: 1 });
  assert.deepEqual(resolvePlacementAnchor("bottom-right", 4, 4, 2, 2), { x: 2, y: 2 });
  // Edge placements clamp inside the box for a 3x3 foreground.
  assert.deepEqual(resolvePlacementAnchor("top-right", 4, 4, 3, 3), { x: 1, y: 0 });
  assert.deepEqual(resolvePlacementAnchor("bottom-left", 4, 4, 3, 3), { x: 0, y: 1 });
});

test("placement is exposed as a flat list for the select options", async () => {
  const values = PLACEMENTS.map((entry) => entry.value);
  assert.equal(PLACEMENTS.length, 9);
  assert.ok(values.includes("top-left"));
  assert.ok(values.includes("center"));
  assert.ok(values.includes("bottom-right"));
  for (const entry of PLACEMENTS) assert.ok(entry.label.length > 0);
});

test("background fit modes are exposed for the select options", async () => {
  assert.deepEqual([...FIT_MODES], ["cover", "contain", "stretch"]);
});

test("image-composite is registered in the tools config", async () => {
  const tool = TOOLS.find((entry) => entry.slug === "image-composite");
  assert.ok(tool, "image-composite missing from TOOLS");
  assert.equal(tool.implemented, true);
});

test("image-composite appears in the sitemap", async () => {
  process.env.NEXT_PUBLIC_URL ??= "https://imgsync.example";
  const { default: sitemap } = await import("../src/app/sitemap.ts");
  const urls = sitemap().map((entry) => new URL(entry.url).pathname);
  assert.ok(
    urls.includes("/tools/image-composite"),
    "sitemap missing /tools/image-composite",
  );
});
