// BDD (Gherkin) — F18 Layered PSD Export (multi-image → layered .psd)
//
// Feature: layered PSD export from multiple images
//   As an e-commerce seller or designer
//   I want to upload several images and export them as one layered PSD file
//   So that I get a Photoshop-ready document without opening Photoshop
//
// Scenario: two layers produce a valid PSD with matching structure
//   Given two layer inputs (name, pixel data) on a canvas sized to the largest layer
//   When buildPsd is called and the output is read back with ag-psd readPsd
//   Then the round-trip preserves width, height, layer count, layer names and visibility
//   And the file starts with the PSD magic bytes "8BPS"
//
// Scenario: layer order follows the input array
//   Given three layer inputs named "top", "middle" and "bottom"
//   When buildPsd is called and the output is read back
//   Then readPsd children names read top-down in the same order as the input
//
// Scenario: layer visibility is honoured
//   Given a layer input with visible: false among visible layers
//   When buildPsd is called and the output is read back
//   Then that layer's hidden flag is true and the others are false
//
// Scenario: single layer export stays valid
//   Given exactly one layer input
//   When buildPsd is called and the output is read back
//   Then the PSD has one child and a valid composite
//
// Scenario: empty layer list is rejected
//   Given zero layer inputs
//   When buildPsd is called
//   Then it rejects with a clear error (no empty PSD files)
//
// Scenario: offset layers keep their position
//   Given a layer input with offset {x: 10, y: 20} on a larger canvas
//   When buildPsd is called and the output is read back
//   Then that layer's top/left coordinates equal the offset
//
// Feature: tool registration and page presence
//   As a visitor searching for "export layers to psd"
//   I want a working /tools/psd-export page
//   So that I can land directly on the tool
//
// Scenario: psd-export is registered in the tools config
//   Given the TOOLS registry
//   When it is inspected
//   Then it contains slug "psd-export" with implemented: true
//
// Scenario: psd-export appears in the sitemap
//   Given the sitemap route is evaluated
//   When the URL list is generated
//   Then it contains /tools/psd-export
//
// Note: page-level metadata/JSON-LD/E2E follow the existing per-tool pattern
// (tools-page + E2E main path), covered after the UI lands.

import test from "node:test";
import assert from "node:assert/strict";
import { readPsd } from "ag-psd";
import {
  buildPsd,
  hasPsdMagic,
  PSD_MAGIC,
} from "../src/lib/image-core/psdExport.ts";

// Helpers -----------------------------------------------------------------

// 2x1 RGB-ish RGBA buffer: [r,g,b,a] per pixel.
const makePixels = (width, height, fill) => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = fill[0];
    data[i + 1] = fill[1];
    data[i + 2] = fill[2];
    data[i + 3] = fill[3] ?? 255;
  }
  return { width, height, data };
};

// Structure-only read: skip bitmaps so Node (no DOM canvas) suffices.
const readStructure = (buffer) =>
  readPsd(buffer, {
    skipLayerImageData: true,
    skipCompositeImageData: true,
    skipThumbnail: true,
  });

const layer = (name, visible, offset) => ({
  name,
  imageData: makePixels(2, 1, [255, 0, 0]),
  ...(visible === undefined ? {} : { visible }),
  ...(offset === undefined ? {} : { offset }),
});

// Scenario bodies -----------------------------------------------------------

test("two layers produce a valid PSD with matching structure", () => {
  const buffer = buildPsd([layer("red"), layer("blue")]);
  assert.ok(hasPsdMagic(buffer), "PSD magic bytes present");
  assert.equal(PSD_MAGIC, "8BPS");

  const psd = readStructure(buffer);
  assert.equal(psd.width, 2);
  assert.equal(psd.height, 1);
  assert.equal(psd.children.length, 2);
  assert.equal(psd.children[0].name, "red");
  assert.equal(psd.children[1].name, "blue");
});

test("layer order follows the input array", () => {
  const buffer = buildPsd([
    layer("top"),
    layer("middle"),
    layer("bottom"),
  ]);
  const psd = readStructure(buffer);
  assert.deepEqual(
    psd.children.map((c) => c.name),
    ["top", "middle", "bottom"],
  );
});

test("layer visibility is honoured", () => {
  const buffer = buildPsd([
    layer("visible-one", true),
    layer("hidden-one", false),
  ]);
  const psd = readStructure(buffer);
  assert.equal(psd.children[0].hidden, false);
  assert.equal(psd.children[1].hidden, true);
});

test("single layer export stays valid", () => {
  const buffer = buildPsd([layer("only")]);
  const psd = readStructure(buffer);
  assert.equal(psd.children.length, 1);
  assert.equal(psd.children[0].name, "only");
});

test("empty layer list is rejected", () => {
  assert.throws(() => buildPsd([]), /at least one layer/i);
});

test("offset layers keep their position", () => {
  const buffer = buildPsd([
    { ...layer("offset-layer"), offset: { x: 10, y: 20 } },
  ], { width: 20, height: 30 });
  const psd = readStructure(buffer);
  assert.equal(psd.children[0].left, 10);
  assert.equal(psd.children[0].top, 20);
});

test("psd-export is registered in the tools config", async () => {
  const { TOOLS } = await import("../src/config/tools.ts");
  const tool = TOOLS.find((t) => t.slug === "psd-export");
  assert.ok(tool, "psd-export in TOOLS");
  assert.equal(tool.implemented, true);
});

test("psd-export appears in the sitemap", async () => {
  process.env.NEXT_PUBLIC_URL ??= "https://imgsync.example";
  const { default: sitemap } = await import("../src/app/sitemap.ts");
  const urls = sitemap().map((entry) => new URL(entry.url).pathname);
  assert.ok(urls.includes("/tools/psd-export"));
});
