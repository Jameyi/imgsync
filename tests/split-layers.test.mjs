// BDD (Gherkin) — F19 Split Layers (single image → subject/background two-layer PSD)
//
// Feature: split one image into subject and background layers
//   As an e-commerce seller with a plain-background product photo
//   I want the subject and the background split into two PSD layers
//   So that I can edit or reposition them separately in Photoshop
//
// Scenario: plain background splits into two correct layers
//   Given a 4x4 image with a flat blue background and a red 2x2 subject block
//   When splitLayers is called with default tolerance
//   Then the subject layer has opaque pixels only where the subject was
//   And the background layer keeps the original blue pixels
//
// Scenario: gradient background within tolerance is fully captured
//   Given an image whose background is a subtle gradient around one dominant color
//   When splitLayers is called with a tolerance covering the gradient
//   Then every background pixel lands on the background layer (none on the subject)
//
// Scenario: subject pixels carry alpha on the subject layer
//   Given the split result
//   When the subject layer is inspected
//   Then background positions are fully transparent (alpha 0)
//   And subject positions are fully opaque (alpha 255)
//
// Scenario: output PSD round-trips with two named layers
//   Given a split result
//   When buildPsd is called with [subject, background] and read back
//   Then the PSD has exactly two children named "Subject" and "Background"
//
// Scenario: both layers preserve source dimensions
//   Given a 6x5 source image
//   When splitLayers is called
//   Then subject and background layers both have width 6 and height 5
//
// Feature: tool registration and page presence
//   As a visitor searching for "split image into layers"
//   I want a working /tools/split-layers page
//   So that I can land directly on the tool
//
// Scenario: split-layers is registered in the tools config
//   Given the TOOLS registry
//   When it is inspected
//   Then it contains slug "split-layers" with implemented: true
//
// Scenario: split-layers appears in the sitemap
//   Given the sitemap route is evaluated
//   When the URL list is generated
//   Then it contains /tools/split-layers

import test from "node:test";
import assert from "node:assert/strict";
import { readPsd } from "ag-psd";
import { splitLayers } from "../src/lib/image-core/split-layers.ts";
import { buildPsd } from "../src/lib/image-core/psdExport.ts";

// Helpers -------------------------------------------------------------------

// Flat-color RGBA buffer.
const solid = (width, height, [r, g, b]) => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
  return { width, height, data };
};

// 4x4 blue background with a red 2x2 subject at (1,1).
const makeSubjectImage = () => {
  const image = solid(4, 4, [0, 0, 255]);
  for (let y = 1; y <= 2; y++) {
    for (let x = 1; x <= 2; x++) {
      const i = (y * 4 + x) * 4;
      image.data[i] = 255;
      image.data[i + 1] = 0;
      image.data[i + 2] = 0;
    }
  }
  return image;
};

const alphaAt = (buffer, x, y) => buffer.data[(y * buffer.width + x) * 4 + 3];

test("plain background splits into two correct layers", () => {
  const image = makeSubjectImage();
  const { subject, background } = splitLayers(image);

  // Subject layer: opaque at the red block, transparent at blue corners.
  assert.equal(alphaAt(subject, 1, 1), 255);
  assert.equal(alphaAt(subject, 2, 2), 255);
  assert.equal(alphaAt(subject, 0, 0), 0);
  assert.equal(alphaAt(subject, 3, 3), 0);
  // Subject color preserved.
  const i = (1 * 4 + 1) * 4;
  assert.equal(subject.data[i], 255); // r
  assert.equal(subject.data[i + 2], 0); // b

  // Background layer keeps the original blue everywhere.
  assert.equal(alphaAt(background, 0, 0), 255);
  assert.equal(background.data[2], 255); // blue channel at (0,0)
});

test("gradient background within tolerance is fully captured", () => {
  // 3x3 image: gray gradient 200→216, center pixel pure red = subject.
  const image = solid(3, 3, [205, 205, 205]);
  for (let p = 0; p < 9; p++) {
    const i = p * 4;
    const shade = 200 + p * 2;
    image.data[i] = shade;
    image.data[i + 1] = shade;
    image.data[i + 2] = shade;
  }
  const center = (1 * 3 + 1) * 4;
  image.data[center] = 255;
  image.data[center + 1] = 0;
  image.data[center + 2] = 0;

  const { subject } = splitLayers(image, { tolerance: 30 });
  assert.equal(alphaAt(subject, 0, 0), 0, "gradient bg not on subject layer");
  assert.equal(alphaAt(subject, 2, 2), 0, "gradient bg not on subject layer");
  assert.equal(alphaAt(subject, 1, 1), 255, "subject detected");
});

test("subject pixels carry alpha on the subject layer", () => {
  const image = makeSubjectImage();
  const { subject } = splitLayers(image);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const inSubject = x >= 1 && x <= 2 && y >= 1 && y <= 2;
      const alpha = alphaAt(subject, x, y);
      if (inSubject) assert.equal(alpha, 255);
      else assert.equal(alpha, 0);
    }
  }
});

test("output PSD round-trips with two named layers", () => {
  const image = makeSubjectImage();
  const { subject, background } = splitLayers(image);
  const buffer = buildPsd([
    { name: "Subject", imageData: subject },
    { name: "Background", imageData: background },
  ]);
  const psd = readPsd(buffer, {
    skipLayerImageData: true,
    skipCompositeImageData: true,
    skipThumbnail: true,
  });
  assert.equal(psd.children.length, 2);
  assert.equal(psd.children[0].name, "Subject");
  assert.equal(psd.children[1].name, "Background");
});

test("both layers preserve source dimensions", () => {
  const image = solid(6, 5, [10, 200, 10]);
  const { subject, background } = splitLayers(image);
  assert.equal(subject.width, 6);
  assert.equal(subject.height, 5);
  assert.equal(background.width, 6);
  assert.equal(background.height, 5);
});

test("split-layers is registered in the tools config", async () => {
  const { TOOLS } = await import("../src/config/tools.ts");
  const tool = TOOLS.find((t) => t.slug === "split-layers");
  assert.ok(tool, "split-layers in TOOLS");
  assert.equal(tool.implemented, true);
});

test("split-layers appears in the sitemap", async () => {
  process.env.NEXT_PUBLIC_URL ??= "https://imgsync.example";
  const { default: sitemap } = await import("../src/app/sitemap.ts");
  const urls = sitemap().map((entry) => new URL(entry.url).pathname);
  assert.ok(urls.includes("/tools/split-layers"));
});
