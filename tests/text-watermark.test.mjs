// BDD (Gherkin) — F14 Text Watermark: orchestration decisions + registration
//
// Feature: stamp a text watermark over an image
//   As the workbench
//   I want the watermark orchestration to expose pure decisions
//   So that the UI wiring and the algorithm seam never drift apart
//
// (Canvas text rasterization and pixel blending are covered elsewhere: the
//  blend seam by tests/watermark.test.mjs, the rendered output by Playwright
//  E2E — this file pins the pure decisions around them.)
//
// Scenario: empty text produces no stamp spec
//   Given the stamp inputs
//   When the spec is built with empty or whitespace-only text
//   Then it resolves to null
//   And non-empty text resolves to { text, fontSize, color } with the color parsed
//
// Scenario: an invalid watermark color resolves to null
//   Given the stamp inputs with color "#zzzzzz"
//   When the spec is built
//   Then it resolves to null
//
// Scenario: blend options pass opacity through and clamp it
//   Given opacity 0.5
//   When the blend options are built
//   Then opacity 0.5 reaches the seam untouched
//   And opacity 1.5 is clamped to 1
//   And opacity -1 is clamped to 0
//
// Scenario: tile origins sit on a fixed grid regardless of text width
//   Given a 100x80 image, a 30x20 stamp and gap 10
//   When the tile origins are resolved
//   Then every origin x is a multiple of 30 + 10
//   And every origin y is a multiple of 20 + 10
//   And no origin lets the stamp overflow the image
//
// Scenario: output file name appends the -watermarked suffix and keeps PNG
//   Given the source file name "photo.png"
//   When the output name is built
//   Then the result is "photo-watermarked.png"
//
// Scenario: text-watermark is registered in the tools config
//   Given the TOOLS registry
//   When it is inspected
//   Then it contains slug "text-watermark" with implemented: true
//
// Scenario: text-watermark appears in the sitemap
//   Given the sitemap route is evaluated
//   When the URL list is generated
//   Then it contains /tools/text-watermark

import test from "node:test";
import assert from "node:assert/strict";
import {
  buildStampSpec,
  buildBlendOptions,
  tileOrigins,
  buildWatermarkedFileName,
} from "../src/lib/tools/text-watermark.ts";
import { TOOLS } from "../src/config/tools.ts";

// Tests -----------------------------------------------------------------------

test("empty text produces no stamp spec", async () => {
  assert.equal(buildStampSpec({ text: "", fontSize: 24, colorHex: "#ffffff" }), null);
  assert.equal(buildStampSpec({ text: "   ", fontSize: 24, colorHex: "#ffffff" }), null);
  assert.deepEqual(
    buildStampSpec({ text: "© Jane", fontSize: 24, colorHex: "#ffffff" }),
    { text: "© Jane", fontSize: 24, color: { r: 255, g: 255, b: 255 } },
  );
});

test("an invalid watermark color resolves to null", async () => {
  assert.equal(buildStampSpec({ text: "© Jane", fontSize: 24, colorHex: "#zzzzzz" }), null);
});

test("blend options pass opacity through and clamp it", async () => {
  assert.equal(
    buildBlendOptions({ placement: "tile", opacity: 0.5, gap: 10, angle: -30 }).opacity,
    0.5,
  );
  assert.equal(
    buildBlendOptions({ placement: "tile", opacity: 1.5, gap: 10, angle: -30 }).opacity,
    1,
  );
  assert.equal(
    buildBlendOptions({ placement: "tile", opacity: -1, gap: 10, angle: -30 }).opacity,
    0,
  );
  assert.deepEqual(
    buildBlendOptions({ placement: "center", opacity: 0.8, gap: 0, angle: 0 }),
    { placement: "center", opacity: 0.8, gap: 0, angle: 0 },
  );
});

test("tile origins sit on a fixed grid regardless of text width", async () => {
  const origins = tileOrigins(100, 80, 30, 20, 10);
  assert.ok(origins.length > 0, "grid has origins");
  for (const { x, y } of origins) {
    assert.equal(x % (30 + 10), 0, `origin x ${x} multiple of step 40`);
    assert.equal(y % (20 + 10), 0, `origin y ${y} multiple of step 30`);
    assert.ok(x + 30 <= 100, `stamp fits horizontally at x ${x}`);
    assert.ok(y + 20 <= 80, `stamp fits vertically at y ${y}`);
  }
});

test("output file name appends the -watermarked suffix and keeps PNG", async () => {
  assert.equal(buildWatermarkedFileName("photo.png"), "photo-watermarked.png");
  assert.equal(buildWatermarkedFileName("noext"), "noext-watermarked.png");
});

test("text-watermark is registered in the tools config", async () => {
  const tool = TOOLS.find((entry) => entry.slug === "text-watermark");
  assert.ok(tool, "text-watermark missing from TOOLS");
  assert.equal(tool.implemented, true);
});

test("text-watermark appears in the sitemap", async () => {
  process.env.NEXT_PUBLIC_URL ??= "https://imgsync.example";
  const { default: sitemap } = await import("../src/app/sitemap.ts");
  const urls = sitemap().map((entry) => new URL(entry.url).pathname);
  assert.ok(
    urls.includes("/tools/text-watermark"),
    "sitemap missing /tools/text-watermark",
  );
});
