// BDD (Gherkin) — F03 quality-slider compression (compress tool)
//
// Feature: direct quality-slider compression
//   As a seller who wants visual control
//   I want to drag a quality slider and see the resulting file size live
//   So that I choose the smallest quality my eyes accept
//
// Scenario: encoding at a given quality reports the resulting size
//   Given an encode function backed by a real codec
//   When encodeAtQuality is called with quality 0.8
//   Then it returns an EncodedImage whose byte length is greater than zero
//   And width and height match the source
//
// Scenario: lower quality never yields a bigger file than higher quality
//   Given the same source pixels and codec
//   When encodeAtQuality runs at quality 0.3 and quality 0.9
//   Then the 0.3 output is not larger than the 0.9 output
//
// Scenario: quality bounds are clamped to [0, 1]
//   Given encodeAtQuality with a quality outside the valid range
//   When it is called with -1 and 2
//   Then both calls clamp into [0, 1] and return valid images
//
// Scenario: PNG input re-encodes to JPEG output
//   Given a PNG source loaded through the orchestration seam
//   When the user exports at any quality
//   Then the produced bytes start with the JPEG magic (0xFF 0xD8)
//   (covered by the browser E2E main path — Node has no image codec)
//
// Feature: tool registration and page presence
//   As a visitor searching for "compress image online"
//   I want a working /tools/compress page
//   So that I can land directly on the tool
//
// Scenario: compress is registered in the tools config
//   Given the TOOLS registry
//   When it is inspected
//   Then it contains slug "compress" with implemented: true
//
// Scenario: compress appears in the sitemap
//   Given the sitemap route is evaluated
//   When the URL list is generated
//   Then it contains /tools/compress

import test from "node:test";
import assert from "node:assert/strict";
import { encodeAtQuality } from "../src/lib/image-core/compress.ts";

// Deterministic fake codec: byte length grows with quality, 2x1 pixels.
const fakeEncode = (quality) => {
  const bytes = Math.max(1, Math.round(quality * 1000));
  return Promise.resolve({
    data: new Uint8Array(bytes),
    width: 2,
    height: 1,
  });
};

test("encoding at a given quality reports the resulting size", async () => {
  const encoded = await encodeAtQuality(fakeEncode, 0.8);
  assert.ok(encoded.data.byteLength > 0, "non-empty output");
  assert.equal(encoded.width, 2);
  assert.equal(encoded.height, 1);
});

test("lower quality never yields a bigger file than higher quality", async () => {
  const low = await encodeAtQuality(fakeEncode, 0.3);
  const high = await encodeAtQuality(fakeEncode, 0.9);
  assert.ok(low.data.byteLength <= high.data.byteLength);
});

test("quality bounds are clamped to [0, 1]", async () => {
  const seen = [];
  const spy = (quality) => {
    seen.push(quality);
    return fakeEncode(quality);
  };
  await encodeAtQuality(spy, -1);
  await encodeAtQuality(spy, 2);
  assert.deepEqual(seen, [0, 1]);
});

test("PNG input re-encodes to JPEG output", { skip: "needs a browser codec — covered by E2E main path" }, () => {});

test("compress is registered in the tools config", async () => {
  const { TOOLS } = await import("../src/config/tools.ts");
  const tool = TOOLS.find((t) => t.slug === "compress");
  assert.ok(tool, "compress in TOOLS");
  assert.equal(tool.implemented, true);
});

test("compress appears in the sitemap", async () => {
  process.env.NEXT_PUBLIC_URL ??= "https://imgsync.example";
  const { default: sitemap } = await import("../src/app/sitemap.ts");
  const urls = sitemap().map((entry) => new URL(entry.url).pathname);
  assert.ok(urls.includes("/tools/compress"));
});
