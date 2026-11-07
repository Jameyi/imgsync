// BDD (Gherkin) — F14 Text Watermark: blendWatermark pure pipeline (PRD F14)
//
// Feature: stamp a text watermark over an image
//   As a photographer or seller protecting product photos
//   I want a text mark placed once or tiled across the image
//   So that my photos carry my mark without an editor
//
// (Text rasterization happens in the orchestration layer via canvas
//  fillText — this seam receives the pre-rendered stamp bitmap and handles
//  placement, tiling, rotation and opacity blending. Pure functions,
//  PixelBuffer in, PixelBuffer out, zero DOM.)
//
// Scenario: single center placement stamps the middle
//   Given a 4x4 solid blue image and a 2x2 opaque red stamp
//   When blendWatermark is called with placement "center" and opacity 1
//   Then the output is 4x4
//   And the center pixels (1,1) and (2,2) are red
//   And the corner pixels stay blue
//
// Scenario: opacity 0.5 blends halfway
//   Given the same image and stamp with opacity 0.5
//   When blendWatermark is called with placement "center"
//   Then the covered pixels are red and blue mixed equally (128, 0, 128)
//
// Scenario: a fully transparent stamp is an identity transform
//   Given a 4x4 solid blue image and a 2x2 stamp with alpha 0 everywhere
//   When blendWatermark is called with any placement and opacity 1
//   Then the output equals the input pixel-for-pixel
//
// Scenario: an oversized stamp is clipped to the image bounds
//   Given a 2x2 blue image and a 4x4 red stamp with placement "top-left"
//   When blendWatermark is called
//   Then it does not crash
//   And the output stays 2x2 and fully red within the stamp's overlap
//
// Scenario: tiling repeats the stamp on a fixed grid
//   Given a 6x6 solid blue image, a 2x2 opaque red stamp, gap 1 and angle 0
//   When blendWatermark is called with placement "tile"
//   Then stamps appear at grid origins (0,0), (3,0), (0,3) and (3,3)
//   And the gap cell (2,2) stays blue
//
// Scenario: tiling rotation preserves coverage
//   Given the same setup
//   When blendWatermark is called with angle 0 and separately with angle 90
//   Then both outputs change the same number of pixels
//
// Scenario: dimensions are preserved under any options
//   Given a 5x3 image and any combination of placement, opacity and angle
//   When blendWatermark is called
//   Then the output is 5x3 for every case

import test from "node:test";
import assert from "node:assert/strict";
import { blendWatermark } from "../src/lib/image-core/watermark.ts";

// Helpers ---------------------------------------------------------------------

const solid = (width, height, r, g, b, a = 255) => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const j = i * 4;
    data[j] = r;
    data[j + 1] = g;
    data[j + 2] = b;
    data[j + 3] = a;
  }
  return { width, height, data };
};

const pixelAt = (img, x, y) => {
  const i = (y * img.width + x) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
};

const changedCount = (before, after) => {
  let count = 0;
  for (let i = 0; i < before.data.length; i += 4) {
    if (
      before.data[i] !== after.data[i] ||
      before.data[i + 1] !== after.data[i + 1] ||
      before.data[i + 2] !== after.data[i + 2]
    ) {
      count++;
    }
  }
  return count;
};

// Tests -----------------------------------------------------------------------

test("single center placement stamps the middle", async () => {
  const image = solid(4, 4, 0, 0, 255);
  const stamp = solid(2, 2, 255, 0, 0);
  const out = blendWatermark(image, stamp, { placement: "center", opacity: 1 });
  assert.equal(out.width, 4);
  assert.equal(out.height, 4);
  assert.deepEqual(pixelAt(out, 1, 1), [255, 0, 0, 255], "center covered");
  assert.deepEqual(pixelAt(out, 2, 2), [255, 0, 0, 255], "center covered");
  assert.deepEqual(pixelAt(out, 0, 0), [0, 0, 255, 255], "corner untouched");
  assert.deepEqual(pixelAt(out, 3, 3), [0, 0, 255, 255], "corner untouched");
});

test("opacity 0.5 blends halfway", async () => {
  const image = solid(4, 4, 0, 0, 255);
  const stamp = solid(2, 2, 255, 0, 0);
  const out = blendWatermark(image, stamp, { placement: "center", opacity: 0.5 });
  assert.deepEqual(pixelAt(out, 1, 1), [128, 0, 128, 255], "half red, half blue");
  assert.deepEqual(pixelAt(out, 0, 0), [0, 0, 255, 255], "uncovered untouched");
});

test("a fully transparent stamp is an identity transform", async () => {
  const image = solid(4, 4, 0, 0, 255);
  const stamp = solid(2, 2, 255, 0, 0, 0); // alpha 0 everywhere
  const out = blendWatermark(image, stamp, { placement: "center", opacity: 1 });
  assert.deepEqual(out.data, image.data);
});

test("an oversized stamp is clipped to the image bounds", async () => {
  const image = solid(2, 2, 0, 0, 255);
  const stamp = solid(4, 4, 255, 0, 0);
  const out = blendWatermark(image, stamp, { placement: "top-left", opacity: 1 });
  assert.equal(out.width, 2);
  assert.equal(out.height, 2);
  assert.deepEqual(pixelAt(out, 0, 0), [255, 0, 0, 255]);
  assert.deepEqual(pixelAt(out, 1, 1), [255, 0, 0, 255]);
});

test("tiling repeats the stamp on a fixed grid", async () => {
  const image = solid(6, 6, 0, 0, 255);
  const stamp = solid(2, 2, 255, 0, 0);
  const out = blendWatermark(image, stamp, {
    placement: "tile",
    opacity: 1,
    gap: 1,
    angle: 0,
  });
  // Grid origins {0,3}² with step = stamp(2) + gap(1).
  assert.deepEqual(pixelAt(out, 0, 0), [255, 0, 0, 255], "tile at (0,0)");
  assert.deepEqual(pixelAt(out, 3, 3), [255, 0, 0, 255], "tile at (3,3)");
  assert.deepEqual(pixelAt(out, 4, 3), [255, 0, 0, 255], "tile interior");
  assert.deepEqual(pixelAt(out, 2, 2), [0, 0, 255, 255], "gap cell stays blue");
  assert.deepEqual(pixelAt(out, 2, 0), [0, 0, 255, 255], "gap column stays blue");
  assert.deepEqual(pixelAt(out, 5, 5), [0, 0, 255, 255], "trailing area stays blue");
});

test("tiling rotation preserves coverage", async () => {
  const image = solid(6, 6, 0, 0, 255);
  const stamp = solid(2, 2, 255, 0, 0);
  const angle0 = blendWatermark(image, stamp, {
    placement: "tile",
    opacity: 1,
    gap: 1,
    angle: 0,
  });
  const angle90 = blendWatermark(image, stamp, {
    placement: "tile",
    opacity: 1,
    gap: 1,
    angle: 90,
  });
  assert.equal(changedCount(image, angle0), changedCount(image, angle90));
  assert.ok(changedCount(image, angle0) > 0, "tiling changed something");
});

test("dimensions are preserved under any options", async () => {
  const image = solid(5, 3, 0, 0, 255);
  const stamp = solid(2, 2, 255, 0, 0);
  for (const options of [
    { placement: "center" },
    { placement: "tile", gap: 2, angle: 45 },
    { placement: "bottom-right", opacity: 0.3 },
  ]) {
    const out = blendWatermark(image, stamp, options);
    assert.equal(out.width, 5, `width for ${JSON.stringify(options)}`);
    assert.equal(out.height, 3, `height for ${JSON.stringify(options)}`);
  }
});
