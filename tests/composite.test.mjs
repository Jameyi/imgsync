// BDD (Gherkin) — F11 Image Composite: pixel resampling + foreground placement
//
// Feature: overlay a foreground image onto a background image
//   As an e-commerce seller with a backdrop template from a supplier
//   I want to place my product image onto it with alignment presets
//   So that I get a composed listing photo without an editor
//
// Scenario: contain resample fits inside the box and keeps aspect (PRD F11)
//   Given a 2x2 image scaled into a 4x2 box with mode "contain"
//   When resizeInto is called
//   Then the output is 4x2
//   And the content occupies the central 2x2 region
//
// Scenario: cover resample fills the box and crops the overflow
//   Given a 2x4 image scaled into a 2x2 box with mode "cover"
//   When resizeInto is called
//   Then the output is 2x2
//   And the visible rows are the vertically centered slice of the source
//
// Scenario: stretch resample maps every source column across the box
//   Given a 2x2 image scaled into a 4x4 box with mode "stretch"
//   When resizeInto is called
//   Then the output is 4x4
//   And output column pairs (0,1) and (2,3) repeat source columns 0 and 1
//
// Scenario: identical box is an identity resample
//   Given a 3x2 image and a 3x2 box with mode "cover"
//   When resizeInto is called
//   Then the output equals the input pixel-for-pixel
//
// Scenario: foreground lands at the requested placement
//   Given a 2x2 solid-red foreground and a 4x4 solid-blue backdrop
//   When compositeOnBackdrop is called with placement "top-left"
//   Then the output is 4x4
//   And the top-left 2x2 block is red
//   And the rest of the output is blue
//
// Scenario: placement bottom-right and center position the block accordingly
//   Given the same 2x2 red foreground and 4x4 blue backdrop
//   When compositeOnBackdrop is called with "bottom-right"
//   Then the bottom-right 2x2 block is red
//   And with placement "center" the block sits at offset (1,1)
//
// Scenario: scale 100 keeps foreground size; scale 50 halves it
//   Given a 2x2 red foreground on a 4x4 blue backdrop
//   When compositeOnBackdrop is called with scalePercent 100
//   Then the placed block is 2x2
//   And with scalePercent 50 the placed block is 1x1 at the placement anchor
//
// Scenario: foreground alpha blends over the backdrop
//   Given a 2x2 foreground that is half transparent (alpha 0) and half solid red
//   When compositeOnBackdrop is called on a solid blue backdrop
//   Then the transparent half shows the backdrop unchanged
//
// Scenario: oversized foreground is cropped to the backdrop bounds
//   Given a 4x4 red foreground on a 2x2 blue backdrop
//   When compositeOnBackdrop is called with placement "center"
//   Then it does not crash
//   And the output stays 2x2 and blue-adjacent edges show red where the crop lands

import test from "node:test";
import assert from "node:assert/strict";
import {
  resizeInto,
  compositeOnBackdrop,
} from "../src/lib/image-core/composite.ts";

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

const distinct = (width, height) => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    const j = p * 4;
    data[j] = p * 40;
    data[j + 1] = 255 - p * 40;
    data[j + 2] = p * 10;
    data[j + 3] = 255;
  }
  return { width, height, data };
};

const pixelAt = (img, x, y) => {
  const i = (y * img.width + x) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
};

// Tests -----------------------------------------------------------------------

test("contain resample fits inside the box and keeps aspect", async () => {
  const source = distinct(2, 2);
  const out = resizeInto(source, 4, 2, "contain");
  assert.equal(out.width, 4);
  assert.equal(out.height, 2);
  // Content occupies the central 2x2 (columns 1-2); padding stays transparent.
  for (let y = 0; y < 2; y++) {
    assert.equal(pixelAt(out, 0, y)[3], 0, `left padding (${0},${y}) transparent`);
    assert.equal(pixelAt(out, 3, y)[3], 0, `right padding (${3},${y}) transparent`);
    assert.deepEqual(pixelAt(out, 1, y), pixelAt(source, 0, y));
    assert.deepEqual(pixelAt(out, 2, y), pixelAt(source, 1, y));
  }
});

test("cover resample fills the box and crops the overflow", async () => {
  const source = distinct(2, 4);
  const out = resizeInto(source, 2, 2, "cover");
  assert.equal(out.width, 2);
  assert.equal(out.height, 2);
  // Vertically centered slice: output row y shows source row y+1.
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < 2; x++) {
      assert.deepEqual(pixelAt(out, x, y), pixelAt(source, x, y + 1));
    }
  }
});

test("stretch resample maps every source column across the box", async () => {
  const source = distinct(2, 2);
  const out = resizeInto(source, 4, 4, "stretch");
  assert.equal(out.width, 4);
  assert.equal(out.height, 4);
  // Nearest neighbor: out(x,y) samples src(floor(x/2), floor(y/2)) — column
  // pairs (0,1) and (2,3) repeat source columns 0 and 1, rows likewise.
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      assert.deepEqual(
        pixelAt(out, x, y),
        pixelAt(source, Math.floor(x / 2), Math.floor(y / 2)),
        `out(${x},${y})`,
      );
    }
  }
});

test("identical box is an identity resample", async () => {
  const source = distinct(3, 2);
  const out = resizeInto(source, 3, 2, "cover");
  assert.deepEqual(out.data, source.data);
});

test("foreground lands at the requested placement", async () => {
  const fg = solid(2, 2, 255, 0, 0);
  const bg = solid(4, 4, 0, 0, 255);
  const out = compositeOnBackdrop(fg, bg, { placement: "top-left" });
  assert.equal(out.width, 4);
  assert.equal(out.height, 4);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const expected = x < 2 && y < 2 ? [255, 0, 0, 255] : [0, 0, 255, 255];
      assert.deepEqual(pixelAt(out, x, y), expected, `(${x},${y})`);
    }
  }
});

test("placement bottom-right and center position the block accordingly", async () => {
  const fg = solid(2, 2, 255, 0, 0);
  const bg = solid(4, 4, 0, 0, 255);
  const br = compositeOnBackdrop(fg, bg, { placement: "bottom-right" });
  assert.deepEqual(pixelAt(br, 2, 2), [255, 0, 0, 255]);
  assert.deepEqual(pixelAt(br, 0, 0), [0, 0, 255, 255]);
  const center = compositeOnBackdrop(fg, bg, { placement: "center" });
  assert.deepEqual(pixelAt(center, 1, 1), [255, 0, 0, 255]);
  assert.deepEqual(pixelAt(center, 0, 0), [0, 0, 255, 255]);
  assert.deepEqual(pixelAt(center, 3, 3), [0, 0, 255, 255]);
});

test("scale 100 keeps foreground size; scale 50 halves it", async () => {
  const fg = solid(2, 2, 255, 0, 0);
  const bg = solid(4, 4, 0, 0, 255);
  const full = compositeOnBackdrop(fg, bg, { placement: "top-left", scalePercent: 100 });
  assert.deepEqual(pixelAt(full, 1, 1), [255, 0, 0, 255]);
  assert.deepEqual(pixelAt(full, 2, 2), [0, 0, 255, 255]);
  const half = compositeOnBackdrop(fg, bg, { placement: "top-left", scalePercent: 50 });
  assert.deepEqual(pixelAt(half, 0, 0), [255, 0, 0, 255]);
  assert.deepEqual(pixelAt(half, 1, 1), [0, 0, 255, 255]);
});

test("foreground alpha blends over the backdrop", async () => {
  // Foreground: left column fully transparent, right column solid red.
  const fg = solid(2, 2, 255, 0, 0);
  for (let y = 0; y < 2; y++) fg.data[(y * 2) * 4 + 3] = 0;
  const bg = solid(2, 2, 0, 0, 255);
  const out = compositeOnBackdrop(fg, bg, { placement: "top-left" });
  assert.deepEqual(pixelAt(out, 0, 0), [0, 0, 255, 255], "transparent half shows backdrop");
  assert.deepEqual(pixelAt(out, 1, 1), [255, 0, 0, 255], "opaque half covers backdrop");
});

test("oversized foreground is cropped to the backdrop bounds", async () => {
  const fg = solid(4, 4, 255, 0, 0);
  const bg = solid(2, 2, 0, 0, 255);
  const out = compositeOnBackdrop(fg, bg, { placement: "center" });
  assert.equal(out.width, 2);
  assert.equal(out.height, 2);
  // Centered offset (-1,-1): the visible slice of the foreground is all red.
  assert.deepEqual(pixelAt(out, 0, 0), [255, 0, 0, 255]);
  assert.deepEqual(pixelAt(out, 1, 1), [255, 0, 0, 255]);
});
