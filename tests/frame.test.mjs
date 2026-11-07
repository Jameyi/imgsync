// BDD (Gherkin) — F13 Rounded Corners: frameImage pure pipeline (PRD F13)
//
// Feature: round corners, add borders and drop shadows on an image
//   As a content creator preparing social or listing images
//   I want rounded corners, a border and a soft shadow on one canvas
//   So that the image looks framed without an editor
//
// (One pipeline: pad the canvas, drop a blurred-silhouette shadow, paste the
//  corner-clipped image, then stroke the border ring. Pure functions,
//  PixelBuffer in, PixelBuffer out, zero DOM.)
//
// Scenario: radius clips the four corners to transparent
//   Given a 4x4 fully opaque red image and radius 2
//   When frameImage is called
//   Then the output is 4x4
//   And the four corner pixels (0,0), (3,0), (0,3), (3,3) have alpha 0
//   And the center pixels (1,1) and (2,2) keep alpha 255
//
// Scenario: zero options is an identity transform
//   Given a 3x2 image and radius 0, no border, no shadow, padding 0
//   When frameImage is called
//   Then the output equals the input pixel-for-pixel
//
// Scenario: padding grows the canvas and centers the image
//   Given a 2x2 image and padding 1
//   When frameImage is called with no shadow and no background
//   Then the output is 4x4
//   And the image occupies the block (1,1)-(2,2)
//   And the surrounding ring is fully transparent
//
// Scenario: border strokes the outermost ring
//   Given a 4x4 opaque image and borderWidth 1 with red border color
//   When frameImage is called
//   Then every pixel on the outermost ring is red
//   And the inner 2x2 pixels are unchanged
//
// Scenario: shadow paints the blurred silhouette behind the image
//   Given a 2x2 opaque image, padding 2, shadow red with blur 0 and offset (2,1)
//   When frameImage is called
//   Then the output is 6x6
//   And shadow-covered pixels outside the image area show the shadow color
//   And image pixels are painted over the shadow
//
// Scenario: shadow blur spreads alpha beyond the silhouette
//   Given the same setup but blur 1
//   When frameImage is called
//   Then a pixel adjacent to the crisp shadow area has alpha between 0 and 255
//
// Scenario: background fills transparent canvas areas
//   Given a 2x2 image with one transparent pixel and background white
//   When frameImage is called
//   Then that pixel shows white
//   And with background null it stays fully transparent
//
// Scenario: border respects corner clipping
//   Given a 4x4 image with radius 2 and borderWidth 1
//   When frameImage is called
//   Then the clipped corners remain transparent (border does not paint them)

import test from "node:test";
import assert from "node:assert/strict";
import { frameImage } from "../src/lib/image-core/frame.ts";
import {
  SHADOW_PRESETS,
  hexToRgb,
  buildFramedFileName,
} from "../src/lib/tools/rounded-corners.ts";
import { TOOLS } from "../src/config/tools.ts";

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

const RED = { r: 255, g: 0, b: 0 };
const WHITE = { r: 255, g: 255, b: 255 };
const BLUE = { r: 0, g: 0, b: 255 };

// Tests -----------------------------------------------------------------------

test("radius clips the four corners to transparent", async () => {
  const image = solid(4, 4, 200, 30, 30);
  const out = frameImage(image, { radius: 2 });
  assert.equal(out.width, 4);
  assert.equal(out.height, 4);
  for (const [x, y] of [[0, 0], [3, 0], [0, 3], [3, 3]]) {
    assert.equal(pixelAt(out, x, y)[3], 0, `corner (${x},${y}) clipped`);
  }
  assert.equal(pixelAt(out, 1, 1)[3], 255, "inner pixel kept");
  assert.equal(pixelAt(out, 2, 2)[3], 255, "inner pixel kept");
});

test("zero options is an identity transform", async () => {
  const image = solid(3, 2, 10, 20, 30);
  const out = frameImage(image, {});
  assert.deepEqual(out.data, image.data);
});

test("padding grows the canvas and centers the image", async () => {
  const image = solid(2, 2, 0, 200, 0);
  const out = frameImage(image, { padding: 1 });
  assert.equal(out.width, 4);
  assert.equal(out.height, 4);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const inImage = x >= 1 && x <= 2 && y >= 1 && y <= 2;
      assert.deepEqual(
        pixelAt(out, x, y),
        inImage ? [0, 200, 0, 255] : [0, 0, 0, 0],
        `(${x},${y})`,
      );
    }
  }
});

test("border strokes the outermost ring", async () => {
  const image = solid(4, 4, 0, 0, 200);
  const out = frameImage(image, { borderWidth: 1, borderColor: RED });
  for (let x = 0; x < 4; x++) {
    assert.deepEqual(pixelAt(out, x, 0), [255, 0, 0, 255], `top (${x},0)`);
    assert.deepEqual(pixelAt(out, x, 3), [255, 0, 0, 255], `bottom (${x},3)`);
  }
  assert.deepEqual(pixelAt(out, 1, 1), [0, 0, 200, 255], "inner untouched");
  assert.deepEqual(pixelAt(out, 2, 2), [0, 0, 200, 255], "inner untouched");
});

test("shadow paints the blurred silhouette behind the image", async () => {
  const image = solid(2, 2, 0, 0, 255); // blue image
  const out = frameImage(image, {
    padding: 2,
    shadow: { color: RED, blurPasses: 0, offsetX: 2, offsetY: 1 },
  });
  assert.equal(out.width, 6);
  assert.equal(out.height, 6);
  // Shadow silhouette offset by (2,1) from the image block (2,2)-(3,3)
  // lands on (4,3)-(5,4) — outside the image area, so it stays visible.
  assert.deepEqual(pixelAt(out, 4, 3), [255, 0, 0, 255], "shadow top-left");
  assert.deepEqual(pixelAt(out, 5, 4), [255, 0, 0, 255], "shadow bottom-right");
  assert.deepEqual(pixelAt(out, 2, 2), [0, 0, 255, 255], "image painted over shadow");
  assert.deepEqual(pixelAt(out, 0, 0), [0, 0, 0, 0], "uncovered corner stays transparent");
});

test("shadow blur spreads alpha beyond the silhouette", async () => {
  const image = solid(2, 2, 0, 0, 255);
  const out = frameImage(image, {
    padding: 2,
    shadow: { color: RED, blurPasses: 1, offsetX: 2, offsetY: 1 },
  });
  const a = pixelAt(out, 3, 4)[3];
  assert.ok(a > 0 && a < 255, `blurred shadow edge alpha ${a} is intermediate`);
});

test("background fills transparent canvas areas", async () => {
  // 2x2 image with one transparent pixel.
  const image = solid(2, 2, 255, 0, 0);
  image.data[3] = 0; // (0,0) transparent
  const withBg = frameImage(image, { background: WHITE });
  assert.deepEqual(pixelAt(withBg, 0, 0), [255, 255, 255, 255]);
  assert.deepEqual(pixelAt(withBg, 1, 1), [255, 0, 0, 255]);
  const withoutBg = frameImage(image, { background: null });
  assert.deepEqual(pixelAt(withoutBg, 0, 0), [0, 0, 0, 0]);
});

test("border respects corner clipping", async () => {
  const image = solid(4, 4, 0, 0, 200);
  const out = frameImage(image, { radius: 2, borderWidth: 1, borderColor: RED });
  for (const [x, y] of [[0, 0], [3, 0], [0, 3], [3, 3]]) {
    assert.equal(pixelAt(out, x, y)[3], 0, `clipped corner (${x},${y}) stays transparent`);
  }
  assert.deepEqual(pixelAt(out, 1, 0), [255, 0, 0, 255], "inside-corner border pixel painted");
  assert.deepEqual(pixelAt(out, 2, 0), [255, 0, 0, 255], "edge border pixel painted");
});

// ——— rounded corners: orchestration decisions + tool registration (F13 pin) ———

test("shadow presets map to blur passes", async () => {
  assert.deepEqual(
    SHADOW_PRESETS.map((preset) => preset.value),
    ["none", "soft", "strong"],
  );
  assert.deepEqual(
    SHADOW_PRESETS.map((preset) => preset.blurPasses),
    [0, 1, 3],
  );
});

test("hex color input resolves to the seam's RGB objects", async () => {
  assert.deepEqual(hexToRgb("#ff8800"), { r: 255, g: 136, b: 0 });
  assert.deepEqual(hexToRgb("ff8800"), { r: 255, g: 136, b: 0 });
  assert.deepEqual(hexToRgb("#fff"), { r: 255, g: 255, b: 255 });
  assert.equal(hexToRgb("#ff88"), null);
  assert.equal(hexToRgb("#zzzzzz"), null);
});

test("output file name appends the -framed suffix and keeps PNG", async () => {
  assert.equal(buildFramedFileName("shot.png"), "shot-framed.png");
  assert.equal(buildFramedFileName("noext"), "noext-framed.png");
});

test("rounded-corners is registered in the tools config", async () => {
  const tool = TOOLS.find((entry) => entry.slug === "rounded-corners");
  assert.ok(tool, "rounded-corners missing from TOOLS");
  assert.equal(tool.implemented, true);
});

test("rounded-corners appears in the sitemap", async () => {
  process.env.NEXT_PUBLIC_URL ??= "https://imgsync.example";
  const { default: sitemap } = await import("../src/app/sitemap.ts");
  const urls = sitemap().map((entry) => new URL(entry.url).pathname);
  assert.ok(
    urls.includes("/tools/rounded-corners"),
    "sitemap missing /tools/rounded-corners",
  );
});
