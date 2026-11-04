// BDD (Gherkin) — F17 Erase Object: brush mask + orchestration layer
//
// Feature: paint an erase mask with a round brush
//   As a user cleaning up a photo
//   I want to paint over an object with a round brush
//   So that exactly the pixels I touched get erased and filled
//
// Scenario: brush stamp marks a disc of mask pixels
//   Given an empty 20x20 mask
//   When stampBrush is called at (10,10) with radius 3
//   Then all pixels within distance 3 of (10,10) are 255
//   And pixels at distance greater than 3 remain 0
//
// Scenario: brush stamp at the image edge does not go out of bounds
//   Given an empty 20x20 mask
//   When stampBrush is called at (0,0) with radius 3
//   Then it does not crash and only in-bounds pixels are stamped
//
// Scenario: stamping returns a new mask and leaves the input untouched
//   Given a mask with one stamp already applied
//   When stampBrush is called again at another position
//   Then the previous stamp is unchanged in the returned mask
//   And the input mask object was not mutated
//
// Scenario: erase value can stamp back to keep (0) for undo-painting
//   Given a mask with a stamped disc
//   When stampBrush is called at the same centre with value 0
//   Then the disc area returns to 0
//
// Feature: orchestration dispatches erase jobs
//   As the tool page
//   I want inpainting to run correctly on any image size
//   So that small images stay fast and large images go to a Worker
//
// Scenario: empty mask passes the image through unchanged (orchestration parity)
//   Given a 4x4 image and an empty mask
//   When applyEraseObject is called
//   Then the result equals the input pixel-for-pixel
//
// Scenario: erased block is filled from surroundings via orchestration
//   Given a 16x16 gradient image with a garbage-filled 4x4 erased block
//   When applyEraseObject is called
//   Then filled pixels are within tolerance of the surrounding gradient
//
// Feature: tool registration and page presence
//   As a visitor searching for "remove object from photo"
//   I want a working /tools/erase-object page
//   So that I can land directly on the tool
//
// Scenario: erase-object is registered in the tools config
//   Given the TOOLS registry
//   When it is inspected
//   Then it contains slug "erase-object" with implemented: true
//
// Scenario: erase-object appears in the sitemap
//   Given the sitemap route is evaluated
//   When the URL list is generated
//   Then it contains /tools/erase-object

import test from "node:test";
import assert from "node:assert/strict";
import { stampBrush } from "../src/lib/image-core/brush.ts";
import { applyEraseObject } from "../src/lib/tools/erase-object.ts";

// Helpers -------------------------------------------------------------------

const makeMask = (width, height, fill = 0) => ({
  width,
  height,
  data: new Uint8Array(width * height).fill(fill),
});

const solidGradient = (width, height) => {
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

const setMaskRect = (mask, x0, y0, x1, y1, value = 255) => {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) mask.data[y * mask.width + x] = value;
  }
};

// Tests -----------------------------------------------------------------------

test("brush stamp marks a disc of mask pixels", () => {
  const mask = makeMask(20, 20);

  const stamped = stampBrush(mask, 10, 10, 3);

  // Centre and edge-of-disc pixels are 255.
  assert.equal(stamped.data[10 * 20 + 10], 255);
  assert.equal(stamped.data[10 * 20 + 13], 255); // exactly radius away
  assert.equal(stamped.data[(10 - 3) * 20 + 10], 255);
  // Just outside the disc stays 0.
  assert.equal(stamped.data[10 * 20 + 14], 0);
  assert.equal(stamped.data[(10 - 4) * 20 + 10], 0);
});

test("brush stamp at the image edge does not go out of bounds", () => {
  const mask = makeMask(20, 20);

  const stamped = stampBrush(mask, 0, 0, 3);

  assert.equal(stamped.data[0], 255);
  assert.equal(stamped.data[3], 255);
  assert.equal(stamped.data[3 * 20], 255);
  // Nothing stamped outside the canvas — can't read out of bounds anyway,
  // but the far corner must remain 0.
  assert.equal(stamped.data[19 * 20 + 19], 0);
});

test("stamping returns a new mask and leaves the input untouched", () => {
  const mask = makeMask(20, 20);
  const first = stampBrush(mask, 5, 5, 2);
  const snapshot = Uint8Array.from(first.data);

  const second = stampBrush(first, 15, 15, 2);

  // Previous stamp unchanged in the returned mask.
  for (let p = 0; p < snapshot.length; p++) {
    if (snapshot[p] === 255) assert.equal(second.data[p], 255);
  }
  // New stamp present.
  assert.equal(second.data[15 * 20 + 15], 255);
  // Input object was not mutated.
  assert.deepEqual(Uint8Array.from(first.data), snapshot);
});

test("erase value can stamp back to keep (0) for undo-painting", () => {
  const mask = makeMask(20, 20);
  const stamped = stampBrush(mask, 10, 10, 3);
  assert.equal(stamped.data[10 * 20 + 10], 255);

  const undone = stampBrush(stamped, 10, 10, 3, 0);

  assert.equal(undone.data[10 * 20 + 10], 0);
  assert.equal(undone.data[10 * 20 + 13], 0);
});

test("empty mask passes the image through unchanged (orchestration parity)", async () => {
  const image = solidGradient(4, 4);
  const mask = makeMask(4, 4);

  const out = await applyEraseObject({ source: image, mask });

  assert.deepEqual(out.data, image.data);
});

test("erased block is filled from surroundings via orchestration", async () => {
  const image = solidGradient(16, 16);
  for (let y = 6; y <= 9; y++) {
    for (let x = 6; x <= 9; x++) {
      const i = (y * 16 + x) * 4;
      image.data[i] = 255;
      image.data[i + 1] = 0;
      image.data[i + 2] = 255;
    }
  }
  const mask = makeMask(16, 16);
  setMaskRect(mask, 6, 6, 9, 9);

  const out = await applyEraseObject({ source: image, mask });

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
});

test("erase-object is registered in the tools config", async () => {
  const { TOOLS } = await import("../src/config/tools.ts");
  const tool = TOOLS.find((t) => t.slug === "erase-object");
  assert.ok(tool, "erase-object in TOOLS");
  assert.equal(tool.implemented, true);
});

test("erase-object appears in the sitemap", async () => {
  process.env.NEXT_PUBLIC_URL ??= "https://imgsync.example";
  const { default: sitemap } = await import("../src/app/sitemap.ts");
  const urls = sitemap().map((entry) => new URL(entry.url).pathname);
  assert.ok(urls.includes("/tools/erase-object"));
});
