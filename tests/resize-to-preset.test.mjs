// BDD (Gherkin) — T4: lib/image-core/resize-to-preset.ts
// (behaviour sheet approved 2026-10-22, bodies per sheet)
import test from "node:test";
import assert from "node:assert/strict";
import { resizeToPreset } from "../src/lib/image-core/resize-to-preset.ts";

// Frozen contract (SESSION 2026-10-22, approved):
//   API: resizeToPreset(input: PixelBuffer,
//                       options: ResizeToPresetOptions): PixelBuffer
//   Options: { width, height, background? = [255,255,255] }  (contain)
//   Behaviour: scale = min(width/in.w, height/in.h) — up or down to fill
//   the preset as much as possible (contain). Destination dims =
//   round(in.w*scale) × round(in.h*scale), centred on the canvas;
//   remaining area = background, alpha 255.
//   Resampling = bilinear; sampling is alpha-weighted so transparent-black
//   neighbours do not darken edges (no halo).
//   Purity: no input mutation, fresh output, deterministic.
//
// Feature: platform preset resizing for marketplace images (F02)
//
// - T1: smaller image is centred on the larger canvas with background fill
// - T2: larger image scales down to fit inside the preset (both dims ≤ target)
// - T3: aspect preserved — contain never distorts (scale = min of ratios)
// - T4: bilinear sampling reproduces a solid colour region exactly
// - T5: background fill is opaque background RGB even under a transparent source
// - T6: purity — input untouched, deterministic, fresh output, dims = preset

const makeBuf = (w, h) => ({
  width: w,
  height: h,
  data: new Uint8ClampedArray(w * h * 4),
});

const put = (buf, x, y, [r, g, b, a]) => {
  const i = (y * buf.width + x) * 4;
  buf.data[i] = r;
  buf.data[i + 1] = g;
  buf.data[i + 2] = b;
  buf.data[i + 3] = a;
};

const get = (buf, x, y) => {
  const i = (y * buf.width + x) * 4;
  return [buf.data[i], buf.data[i + 1], buf.data[i + 2], buf.data[i + 3]];
};

const RED = [255, 0, 0];

test("T1 smaller image is centred on the larger canvas with background fill", () => {
  // 2×2 opaque red into a 6×6 canvas → scale = 3 → 6×6 fills everything;
  // use 2×1 into 6×6 instead: scale = 3 → 6×3 centred vertically
  const buf = makeBuf(2, 1);
  put(buf, 0, 0, [...RED, 255]);
  put(buf, 1, 0, [...RED, 255]);
  const out = resizeToPreset(buf, { width: 6, height: 6 });
  assert.equal(out.width, 6);
  assert.equal(out.height, 6);
  // centre band rows 1..4? 6×3 centred → rows 1..3 inclusive of 3 rows: rows 1,2,3
  for (const x of [0, 3, 5]) {
    assert.deepEqual(get(out, x, 2), [...RED, 255], `row 2 at x=${x} is red`);
  }
  // top and bottom bands are background
  for (const y of [0, 4, 5]) {
    assert.deepEqual(get(out, 2, y), [255, 255, 255, 255], `row ${y} is white`);
  }
});

test("T2 larger image scales down to fit inside the preset", () => {
  // 10×10 red into 5×5 → scale 0.5 → 5×5 fully red
  const buf = makeBuf(10, 10);
  for (let x = 0; x < 10; x++)
    for (let y = 0; y < 10; y++) put(buf, x, y, [...RED, 255]);
  const out = resizeToPreset(buf, { width: 5, height: 5 });
  assert.equal(out.width, 5);
  assert.equal(out.height, 5);
  assert.deepEqual(get(out, 2, 2), [...RED, 255]);
  assert.deepEqual(get(out, 0, 0), [...RED, 255]);
});

test("T3 contain never distorts — scale is min of ratios", () => {
  // 4×2 into 8×8 → scaleX 2, scaleY 4 → scale 2 → 8×4 centred
  const buf = makeBuf(4, 2);
  for (let x = 0; x < 4; x++)
    for (let y = 0; y < 2; y++) put(buf, x, y, [...RED, 255]);
  const out = resizeToPreset(buf, { width: 8, height: 8 });
  assert.equal(out.width, 8);
  assert.equal(out.height, 8);
  // content rows 2..5, background rows 0..1 and 6..7
  assert.deepEqual(get(out, 4, 3), [...RED, 255]);
  assert.deepEqual(get(out, 4, 0), [255, 255, 255, 255]);
  assert.deepEqual(get(out, 4, 7), [255, 255, 255, 255]);
  // content never exceeds 4 rows: row 1 must be background
  assert.deepEqual(get(out, 4, 1), [255, 255, 255, 255]);
});

test("T4 bilinear sampling reproduces a solid colour region exactly", () => {
  // uniform colour in → uniform colour out at any scale
  const buf = makeBuf(7, 5);
  for (let x = 0; x < 7; x++)
    for (let y = 0; y < 5; y++) put(buf, x, y, [30, 144, 255, 255]);
  const out = resizeToPreset(buf, { width: 13, height: 9 });
  assert.deepEqual(get(out, 6, 4), [30, 144, 255, 255]);
  assert.deepEqual(get(out, 0, 0), [30, 144, 255, 255]);
});

test("T5 background fill is opaque background RGB under transparent source", () => {
  // fully transparent 2×2 into 4×4 with custom background
  const buf = makeBuf(2, 2);
  for (let x = 0; x < 2; x++)
    for (let y = 0; y < 2; y++) put(buf, x, y, [0, 0, 0, 0]);
  const out = resizeToPreset(buf, { width: 4, height: 4, background: [16, 32, 64] });
  assert.deepEqual(get(out, 0, 0), [16, 32, 64, 255]);
  assert.deepEqual(get(out, 3, 3), [16, 32, 64, 255]);
});

test("T6 purity — input untouched, deterministic, preset dims", () => {
  const buf = makeBuf(3, 2);
  put(buf, 0, 0, [...RED, 255]);
  put(buf, 1, 1, [0, 255, 0, 128]);
  const before = Uint8ClampedArray.from(buf.data);
  const out1 = resizeToPreset(buf, { width: 6, height: 4 });
  const out2 = resizeToPreset(buf, { width: 6, height: 4 });
  assert.deepEqual(buf.data, before, "input must not be mutated");
  assert.notEqual(out1, buf);
  assert.notEqual(out1.data, buf.data);
  assert.deepEqual(out1.data, out2.data, "deterministic");
  assert.equal(out1.width, 6);
  assert.equal(out1.height, 4);
});
