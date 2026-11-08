// BDD (Gherkin) — F16 Device Mockup: frameDevice pure pipeline (PRD F16)
//
// Feature: wrap a screenshot in a device shell
//   As a developer or designer showcasing an app or site
//   I want my screenshot framed in a phone or tablet shell
//   So that the mockup looks produced, not pasted
//
// (The shell is pure geometry — no asset files: a rounded-rect shell ring,
//  the screen clipped to its radius inside it, on a padded canvas. Pure
//  functions, PixelBuffer in, PixelBuffer out, zero DOM.)
//
// Scenario: shell, screen and padding form concentric rings
//   Given a 4x4 red image, bezel 1 black, padding 1 and screenRadius 0
//   When frameDevice is called
//   Then the output is 8x8
//   And the screen block (2,2)-(5,5) shows the image
//   And the bezel ring pixels like (1,1) and (6,6) are black
//   And the outer padding ring is fully transparent
//
// Scenario: clipped screen corners reveal the shell
//   Given the same image with screenRadius 2
//   When frameDevice is called
//   Then the screen's corner pixels show the bezel color, not the image
//   And the screen's inner pixels keep the image colors
//
// Scenario: the shell's own corners are rounded
//   Given screenRadius 2 and bezel 1 (outer radius 3)
//   When frameDevice is called
//   Then the outermost shell corner pixel is transparent
//   And a pixel one step inside the shell corner is bezel-colored
//
// Scenario: background fills the padding ring
//   Given the base setup with background white
//   When frameDevice is called
//   Then the padding ring is white
//   And the bezel and screen are unchanged
//
// Scenario: zero bezel degrades to a clipped screen on the canvas
//   Given bezel 0, padding 1 and screenRadius 2
//   When frameDevice is called
//   Then the output is 6x6 with the clipped image at (1,1)-(4,4)
//   And no bezel-colored ring exists
//
// Scenario: dimensions follow the formula under any options
//   Given a 5x3 image and any combination of bezel, padding and radii
//   When frameDevice is called
//   Then the output is (width + 2*bezel + 2*padding) x (height + 2*bezel + 2*padding)

import test from "node:test";
import assert from "node:assert/strict";
import { frameDevice } from "../src/lib/image-core/device-frame.ts";

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

const BLACK = { r: 10, g: 10, b: 10 };
const WHITE = { r: 255, g: 255, b: 255 };

// Tests -----------------------------------------------------------------------

test("shell, screen and padding form concentric rings", async () => {
  const image = solid(4, 4, 200, 30, 30);
  const out = frameDevice(image, {
    bezelWidth: 1,
    bezelColor: BLACK,
    screenRadius: 0,
    padding: 1,
  });
  assert.equal(out.width, 8);
  assert.equal(out.height, 8);
  assert.deepEqual(pixelAt(out, 2, 2), [200, 30, 30, 255], "screen top-left");
  assert.deepEqual(pixelAt(out, 5, 5), [200, 30, 30, 255], "screen bottom-right");
  assert.deepEqual(pixelAt(out, 1, 1), [10, 10, 10, 255], "bezel ring");
  assert.deepEqual(pixelAt(out, 6, 6), [10, 10, 10, 255], "bezel ring");
  assert.deepEqual(pixelAt(out, 0, 0), [0, 0, 0, 0], "padding ring transparent");
  assert.deepEqual(pixelAt(out, 7, 7), [0, 0, 0, 0], "padding ring transparent");
});

test("clipped screen corners reveal the shell", async () => {
  const image = solid(4, 4, 200, 30, 30);
  const out = frameDevice(image, {
    bezelWidth: 1,
    bezelColor: BLACK,
    screenRadius: 2,
    padding: 1,
  });
  assert.deepEqual(pixelAt(out, 2, 2), [10, 10, 10, 255], "screen corner shows shell");
  assert.deepEqual(pixelAt(out, 3, 3), [200, 30, 30, 255], "screen inner keeps image");
  assert.deepEqual(pixelAt(out, 4, 4), [200, 30, 30, 255], "screen inner keeps image");
});

test("the shell's own corners are rounded", async () => {
  const image = solid(4, 4, 200, 30, 30);
  const out = frameDevice(image, {
    bezelWidth: 1,
    bezelColor: BLACK,
    screenRadius: 2,
    padding: 1,
  });
  assert.deepEqual(pixelAt(out, 1, 1), [0, 0, 0, 0], "outermost shell corner transparent");
  assert.deepEqual(pixelAt(out, 2, 2), [10, 10, 10, 255], "one step inside the shell corner");
});

test("background fills the padding ring", async () => {
  const image = solid(4, 4, 200, 30, 30);
  const out = frameDevice(image, {
    bezelWidth: 1,
    bezelColor: BLACK,
    screenRadius: 0,
    padding: 1,
    background: WHITE,
  });
  assert.deepEqual(pixelAt(out, 0, 0), [255, 255, 255, 255], "padding ring white");
  assert.deepEqual(pixelAt(out, 1, 1), [10, 10, 10, 255], "bezel unchanged");
  assert.deepEqual(pixelAt(out, 2, 2), [200, 30, 30, 255], "screen unchanged");
});

test("zero bezel degrades to a clipped screen on the canvas", async () => {
  const image = solid(4, 4, 200, 30, 30);
  const out = frameDevice(image, {
    bezelWidth: 0,
    screenRadius: 2,
    padding: 1,
  });
  assert.equal(out.width, 6);
  assert.equal(out.height, 6);
  assert.deepEqual(pixelAt(out, 1, 1), [0, 0, 0, 0], "clipped screen corner, no shell beneath");
  assert.deepEqual(pixelAt(out, 2, 2), [200, 30, 30, 255], "screen inner");
  assert.deepEqual(pixelAt(out, 0, 0), [0, 0, 0, 0], "padding transparent");
});

test("dimensions follow the formula under any options", async () => {
  const image = solid(5, 3, 200, 30, 30);
  for (const options of [
    { bezelWidth: 0, padding: 0 },
    { bezelWidth: 2, padding: 1 },
    { bezelWidth: 1, padding: 0, screenRadius: 3 },
  ]) {
    const out = frameDevice(image, options);
    const expectW = 5 + 2 * (options.bezelWidth ?? 0) + 2 * (options.padding ?? 0);
    const expectH = 3 + 2 * (options.bezelWidth ?? 0) + 2 * (options.padding ?? 0);
    assert.equal(out.width, expectW, `width for ${JSON.stringify(options)}`);
    assert.equal(out.height, expectH, `height for ${JSON.stringify(options)}`);
  }
});
