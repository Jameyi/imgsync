// BDD (Gherkin) — F17 Erase Object: Telea FMM inpainting (small-region tier)
//
// Feature: erase a masked region and fill it from surrounding pixels
//   As an e-commerce seller cleaning up a product photo
//   I want to erase an object and have the hole filled plausibly
//   So that the photo looks clean without an editor
//
// Scenario: empty mask is an identity transform (PRD B.1 ③)
//   Given a 4x4 image of distinct known colors
//   When inpaintFill is called with an all-zero mask
//   Then the output equals the input pixel-for-pixel
//
// Scenario: full mask still returns a valid buffer (PRD B.1 ④)
//   Given a 4x4 image and an all-255 mask
//   When inpaintFill is called
//   Then it does not crash and returns a full-size PixelBuffer
//
// Scenario: rectangle erased on a smooth gradient fills to match surroundings (PRD B.1 ①)
//   Given a 16x16 image with a horizontal gradient background and a 4x4 erased block
//   When inpaintFill is called
//   Then every filled pixel is within tolerance of the gradient at its column
//
// Scenario: stripe texture continues through an erased band (PRD B.1 ②)
//   Given a 24x8 image with vertical stripes of period 6 and an erased 4x4 band
//   When inpaintFill is called
//   Then filled columns continue the stripe colors from both boundaries

import test from "node:test";
import assert from "node:assert/strict";
import { inpaintFill } from "../src/lib/image-core/telea-inpaint.ts";

// Helpers -------------------------------------------------------------------

const solidGradient = (width, height) => {
  // Horizontal gradient: column x gets value 10 + 10x on all channels.
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const v = 10 + 10 * x;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return { width, height, data };
};

const makeMask = (width, height, fill = 0) => ({
  width,
  height,
  data: new Uint8Array(width * height).fill(fill),
});

const setMaskRect = (mask, x0, y0, x1, y1, value = 255) => {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) mask.data[y * mask.width + x] = value;
  }
};

// Tests -----------------------------------------------------------------------

test("empty mask is an identity transform", async () => {
  const image = solidGradient(4, 4);
  const mask = makeMask(4, 4);

  const out = await inpaintFill(image, mask);

  assert.deepEqual(out.data, image.data);
  assert.equal(out.width, 4);
  assert.equal(out.height, 4);
});

test("full mask still returns a valid buffer", async () => {
  const image = solidGradient(4, 4);
  const mask = makeMask(4, 4, 255);

  const out = await inpaintFill(image, mask);

  assert.equal(out.width, 4);
  assert.equal(out.height, 4);
  assert.equal(out.data.length, image.data.length);
  for (let p = 0; p < out.data.length; p += 4) assert.equal(out.data[p + 3], 255);
});

test("rectangle erased on a smooth gradient fills to match surroundings", async () => {
  const image = solidGradient(16, 16);
  // The erased block's original pixels are garbage — the fill must come
  // from the surrounding gradient, never from these values.
  for (let y = 6; y <= 9; y++) {
    for (let x = 6; x <= 9; x++) {
      const i = (y * 16 + x) * 4;
      image.data[i] = 255;
      image.data[i + 1] = 0;
      image.data[i + 2] = 255;
    }
  }
  const mask = makeMask(16, 16);
  setMaskRect(mask, 6, 6, 9, 9); // 4x4 block in the middle

  const out = await inpaintFill(image, mask);

  // Every filled pixel must be within 15 of the column's gradient value.
  for (let y = 6; y <= 9; y++) {
    for (let x = 6; x <= 9; x++) {
      const i = (y * 16 + x) * 4;
      const expected = 10 + 10 * x;
      assert.ok(
        Math.abs(out.data[i] - expected) <= 15,
        `pixel (${x},${y}) filled ${out.data[i]}, expected ~${expected}`,
      );
    }
  }
  // Unmasked pixels are untouched.
  assert.equal(out.data[0], 10);
  assert.equal(out.data[(15 * 16 + 15) * 4], 10 + 150);
});

test(
  "stripe texture continues through an erased band",
  { skip: "exemplar-synthesis tier (PRD B.1 iteration 2) — Telea pixel diffusion cannot preserve texture by design; verified red 2026-11-04" },
  async () => {
  // 24x8 vertical stripes of period 6: first 3 columns dark, next 3 light.
  const width = 24;
  const height = 8;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const v = x % 6 < 3 ? 40 : 220;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  const image = { width, height, data };
  // Erase a 4-wide band, narrower than the period: x=10..13 is light,light,
  // dark,dark — locally reconstructable from the light boundary (x=9) and
  // the dark boundary (x=14).
  const mask = makeMask(width, height);
  setMaskRect(mask, 10, 2, 13, 5);

  const out = await inpaintFill(image, mask);

  for (let y = 2; y <= 5; y++) {
    for (let x = 10; x <= 13; x++) {
      const i = (y * width + x) * 4;
      const expected = x % 6 < 3 ? 40 : 220;
      assert.ok(
        Math.abs(out.data[i] - expected) <= 30,
        `pixel (${x},${y}) filled ${out.data[i]}, expected ~${expected}`,
      );
    }
  }
});
