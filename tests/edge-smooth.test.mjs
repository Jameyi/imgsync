// BDD (Gherkin) — F07 Smooth Edges: alpha-channel edge smoothing (PRD F07)
//
// Feature: soften jagged transparent edges on a cutout PNG
//   As an e-commerce seller with a cutout that has stair-stepped edges
//   I want the alpha channel along transparency boundaries to become a gradient
//   So that the cutout looks antialiased on any backdrop
//
// (This is the complement of F08 defringe: defringe removes coloured fringe
//  halos, this tool softens hard alpha staircases. RGB channels are never
//  touched — only alpha along the boundary.)
//
// Scenario: a binary staircase edge becomes a gradient
//   Given an 8x8 image, left half alpha 255, right half alpha 0 (hard edge at x=4)
//   When smoothAlphaEdges is called with 1 pass
//   Then the boundary column pair (3,4) takes intermediate alpha values
//   And the far columns (x=0..1 and x=6..7) keep alpha 255 and 0
//
// Scenario: interior pixels are never touched
//   Given a 8x8 image with a hard edge and a fully opaque interior block far from the edge
//   When smoothAlphaEdges is called
//   Then every pixel farther than the smoothing reach from any boundary keeps its exact alpha
//
// Scenario: RGB channels are byte-identical after smoothing
//   Given any input image with a hard alpha edge
//   When smoothAlphaEdges is called
//   Then every pixel's R, G and B bytes equal the input's
//
// Scenario: an image without transparency is an identity transform
//   Given a fully opaque image (alpha 255 everywhere)
//   When smoothAlphaEdges is called
//   Then the output equals the input pixel-for-pixel
//
// Scenario: two passes smooth more than one
//   Given an 8x8 image with a hard edge
//   When smoothAlphaEdges is called with 1 pass and separately with 2 passes
//   Then the 2-pass output has more intermediate-alpha columns than the 1-pass output
//   (a wider transition band = smoother; total variation is conserved by box filtering)
//
// Scenario: empty passes option defaults to a single pass
//   Given an 8x8 image with a hard edge
//   When smoothAlphaEdges is called with no options
//   Then the output equals the 1-pass output

import test from "node:test";
import assert from "node:assert/strict";
import { smoothAlphaEdges } from "../src/lib/image-core/edge-smooth.ts";
import {
  isEligibleForSmooth,
  STRENGTH_LEVELS,
  buildSmoothFileName,
} from "../src/lib/tools/smooth-edges.ts";
import { TOOLS } from "../src/config/tools.ts";

// Helpers ---------------------------------------------------------------------

const hardEdgeImage = (width = 8, height = 8) => {
  // Left half fully opaque red, right half fully transparent (alpha 0),
  // RGB present everywhere so the RGB-unchanged assertion has signal.
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const j = i * 4;
    data[j] = 200;
    data[j + 1] = 30;
    data[j + 2] = 30;
    data[j + 3] = i % width < width / 2 ? 255 : 0;
  }
  return { width, height, data };
};

const alphaAt = (img, x, y) => img.data[(y * img.width + x) * 4 + 3];

const countIntermediateColumns = (img) => {
  const seen = new Set();
  for (let x = 0; x < img.width; x++) {
    const a = alphaAt(img, x, 0);
    if (a > 0 && a < 255) seen.add(x);
  }
  return seen.size;
};

// Tests -----------------------------------------------------------------------

test("a binary staircase edge becomes a gradient", async () => {
  const image = hardEdgeImage();
  const out = smoothAlphaEdges(image, { passes: 1 });
  assert.equal(out.width, 8);
  assert.equal(out.height, 8);
  assert.equal(alphaAt(out, 3, 0), 170, "boundary column 3 takes the upper middle value");
  assert.equal(alphaAt(out, 4, 0), 85, "boundary column 4 takes the lower middle value");
  assert.ok(alphaAt(out, 4, 0) < alphaAt(out, 3, 0), "gradient is monotone across the edge");
  assert.ok(alphaAt(out, 3, 0) < 255, "boundary column is no longer fully opaque");
});

test("interior pixels are never touched", async () => {
  const image = hardEdgeImage();
  const out = smoothAlphaEdges(image, { passes: 1 });
  for (let y = 0; y < 8; y++) {
    for (const x of [0, 1]) assert.equal(alphaAt(out, x, y), 255, `opaque interior (${x},${y})`);
    for (const x of [6, 7]) assert.equal(alphaAt(out, x, y), 0, `transparent interior (${x},${y})`);
  }
});

test("RGB channels are byte-identical after smoothing", async () => {
  const image = hardEdgeImage();
  const out = smoothAlphaEdges(image, { passes: 2 });
  for (let i = 0; i < image.data.length; i += 4) {
    assert.equal(out.data[i], image.data[i], `R at pixel ${i / 4}`);
    assert.equal(out.data[i + 1], image.data[i + 1], `G at pixel ${i / 4}`);
    assert.equal(out.data[i + 2], image.data[i + 2], `B at pixel ${i / 4}`);
  }
});

test("an image without transparency is an identity transform", async () => {
  const image = hardEdgeImage();
  for (let i = 3; i < image.data.length; i += 4) image.data[i] = 255;
  const out = smoothAlphaEdges(image, { passes: 2 });
  assert.deepEqual(out.data, image.data);
});

test("two passes smooth more than one", async () => {
  const image = hardEdgeImage();
  const one = smoothAlphaEdges(image, { passes: 1 });
  const two = smoothAlphaEdges(image, { passes: 2 });
  const oneCount = countIntermediateColumns(one);
  const twoCount = countIntermediateColumns(two);
  assert.equal(oneCount, 2, "one pass touches the 2 boundary columns");
  assert.ok(twoCount > oneCount, `two passes widen the band (${twoCount} columns)`);
});

test("empty passes option defaults to a single pass", async () => {
  const image = hardEdgeImage();
  const defaulted = smoothAlphaEdges(image);
  const explicit = smoothAlphaEdges(image, { passes: 1 });
  assert.deepEqual(defaulted.data, explicit.data);
});

// ——— smooth edges: orchestration decisions + tool registration (F07 pin) ———

test("only PNG-like inputs are eligible", async () => {
  assert.equal(isEligibleForSmooth({ name: "cutout.png", type: "image/png" }), true);
  assert.equal(isEligibleForSmooth({ name: "cutout", type: "image/png" }), true);
  assert.equal(isEligibleForSmooth({ name: "photo.jpg", type: "image/jpeg" }), false);
});

test("strength levels map to box-filter passes", async () => {
  assert.deepEqual(
    STRENGTH_LEVELS.map((level) => level.value),
    ["light", "standard", "strong"],
  );
  assert.deepEqual(
    STRENGTH_LEVELS.map((level) => level.passes),
    [1, 2, 3],
  );
});

test("output file name appends the -smooth suffix and keeps PNG", async () => {
  assert.equal(buildSmoothFileName("cutout.png"), "cutout-smooth.png");
  assert.equal(buildSmoothFileName("noext"), "noext-smooth.png");
});

test("smooth-edges is registered in the tools config", async () => {
  const tool = TOOLS.find((entry) => entry.slug === "smooth-edges");
  assert.ok(tool, "smooth-edges missing from TOOLS");
  assert.equal(tool.implemented, true);
});

test("smooth-edges appears in the sitemap", async () => {
  process.env.NEXT_PUBLIC_URL ??= "https://imgsync.example";
  const { default: sitemap } = await import("../src/app/sitemap.ts");
  const urls = sitemap().map((entry) => new URL(entry.url).pathname);
  assert.ok(
    urls.includes("/tools/smooth-edges"),
    "sitemap missing /tools/smooth-edges",
  );
});
