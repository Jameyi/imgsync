// BDD (Gherkin) — T3: lib/image-core/defringe-edges.ts
// (behaviour sheet approved 2026-10-21, bodies per sheet)
import test from "node:test";
import assert from "node:assert/strict";
import { defringeEdges } from "../src/lib/image-core/defringe-edges.ts";

// Frozen contract (SESSION 2026-10-21, approved):
//   API: defringeEdges(input: PixelBuffer): PixelBuffer   (no options — minimal)
//   Target set = pixels with 0 < alpha < 255 that are 8-neighbour adjacent
//   to a fully transparent (alpha = 0) pixel.
//   Treatment = white unmix: observed = fg*α + white*(1-α)  ⇒
//               fg = (observed - 255*(1-α)) / α, clamped to 0..255.
//   Everything else: RGB and alpha passthrough. Purity: no input mutation,
//   fresh output buffer, deterministic.
//
// Feature: white halo removal from cutout edges (F08)
//
// - T1: fully transparent pixels pass through untouched (alpha 0, RGB unchanged)
// - T2: opaque interior pixels pass through untouched (alpha 255, RGB unchanged)
// - T3: a semi-transparent edge pixel that is a white blend
//       (observed = fg*a + 255*(1-a)) unmixes back to the fg RGB (±2)
// - T4: unmix overshoot (dark pixel at tiny alpha → negative) clamps to
//       0..255, never NaN or wrapped
// - T5: a semi-transparent pixel NOT adjacent to any fully transparent pixel
//       is left untouched (edge band only, no global recolor)
// - T6: purity — input untouched, deterministic, fresh output, dims preserved

const W = (w, h) => ({
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
  return [
    buf.data[i],
    buf.data[i + 1],
    buf.data[i + 2],
    buf.data[i + 3],
  ];
};

const BLACK = [0, 0, 0];
const RED = [255, 0, 0];

test("T1 fully transparent pixels pass through untouched", () => {
  const buf = W(4, 2);
  put(buf, 0, 0, [...RED, 255]);
  put(buf, 1, 0, [...RED, 255]);
  put(buf, 2, 0, [1, 2, 3, 0]);
  put(buf, 3, 0, [1, 2, 3, 0]);
  put(buf, 0, 1, [9, 8, 7, 0]);
  put(buf, 1, 1, [9, 8, 7, 0]);
  put(buf, 2, 1, [...RED, 255]);
  put(buf, 3, 1, [...RED, 255]);
  const out = defringeEdges(buf);
  assert.deepEqual(get(out, 2, 0), [1, 2, 3, 0]);
  assert.deepEqual(get(out, 3, 0), [1, 2, 3, 0]);
  assert.deepEqual(get(out, 0, 1), [9, 8, 7, 0]);
});

test("T2 opaque interior pixels pass through untouched", () => {
  const buf = W(3, 1);
  put(buf, 0, 0, [...BLACK, 0]);
  put(buf, 1, 0, [...RED, 255]);
  put(buf, 2, 0, [...RED, 255]);
  const out = defringeEdges(buf);
  assert.deepEqual(get(out, 1, 0), [...RED, 255]);
  assert.deepEqual(get(out, 2, 0), [...RED, 255]);
});

test("T3 white-blend edge pixel unmixes back to exact foreground RGB", () => {
  const buf = W(5, 1);
  // row: transparent bg | white-blend semi edge | opaque black interior…
  put(buf, 0, 0, [255, 255, 255, 0]);
  put(buf, 1, 0, [128, 128, 128, 128]); // ≈ fg black @ α≈0.5 over white
  put(buf, 2, 0, [...BLACK, 255]);
  put(buf, 3, 0, [...BLACK, 255]);
  put(buf, 4, 0, [...BLACK, 255]);
  const out = defringeEdges(buf);
  const [r, g, b, a] = get(out, 1, 0);
  assert.ok(Math.abs(r - 0) <= 2, `r = ${r}`);
  assert.ok(Math.abs(g - 0) <= 2, `g = ${g}`);
  assert.ok(Math.abs(b - 0) <= 2, `b = ${b}`);
  assert.equal(a, 128, "alpha passthrough");
  // opaque neighbours untouched
  assert.deepEqual(get(out, 2, 0), [...BLACK, 255]);
});

test("T4 unmix overshoot clamps to 0..255, never NaN", () => {
  const buf = W(3, 1);
  put(buf, 0, 0, [255, 255, 255, 0]);
  // darker than the white floor at tiny alpha ⇒ unmix goes negative
  put(buf, 1, 0, [100, 100, 100, 50]);
  put(buf, 2, 0, [...BLACK, 255]);
  const out = defringeEdges(buf);
  const [r, g, b, a] = get(out, 1, 0);
  assert.ok(Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b));
  assert.equal(a, 50, "alpha passthrough");
  for (const c of [r, g, b]) {
    assert.ok(c >= 0 && c <= 255, `channel ${c} in range`);
    assert.equal(c, 0, "negative unmix clamps to 0");
  }
});

test("T5 semi-transparent pixel far from transparency is untouched", () => {
  const buf = W(5, 1);
  put(buf, 0, 0, [...RED, 255]);
  put(buf, 1, 0, [...RED, 255]);
  put(buf, 2, 0, [250, 250, 250, 128]); // white-tinted semi, no α0 neighbour
  put(buf, 3, 0, [...RED, 255]);
  put(buf, 4, 0, [...RED, 255]);
  const out = defringeEdges(buf);
  assert.deepEqual(get(out, 2, 0), [250, 250, 250, 128]);
});

test("T6 purity — input untouched, deterministic, fresh output", () => {
  const buf = W(4, 2);
  put(buf, 0, 0, [255, 255, 255, 0]);
  put(buf, 1, 0, [128, 128, 128, 128]);
  put(buf, 2, 0, [...BLACK, 255]);
  put(buf, 3, 0, [...RED, 255]);
  put(buf, 0, 1, [...RED, 255]);
  put(buf, 1, 1, [...RED, 255]);
  put(buf, 2, 1, [255, 255, 255, 0]);
  put(buf, 3, 1, [...RED, 255]);
  const before = Uint8ClampedArray.from(buf.data);
  const out1 = defringeEdges(buf);
  const out2 = defringeEdges(buf);
  assert.deepEqual(buf.data, before, "input must not be mutated");
  assert.notEqual(out1, buf);
  assert.notEqual(out1.data, buf.data);
  assert.deepEqual(out1.data, out2.data, "deterministic");
  assert.equal(out1.width, 4);
  assert.equal(out1.height, 2);
});
