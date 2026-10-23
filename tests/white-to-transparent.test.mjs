// BDD (Gherkin) — T1: lib/image-core/white-to-transparent.ts
// (behaviour sheet approved 2026-10-21, headers below)
import test from "node:test";
import assert from "node:assert/strict";
import { whiteToTransparent } from "../src/lib/image-core/white-to-transparent.ts";

// Frozen contract (SESSION 2026-10-21, grilling Q1–Q9):
//   API: whiteToTransparent(input: PixelBuffer, { tolerance?: 0.15 }): PixelBuffer
//   flood-fill segmentation (4-neighbour BFS, interior whites kept)
//   B = median of 2px border; edge band = fg with 8-neighbour bg
//   local F = max-distance fg in 3×3 neighbourhood minus centre
//   α = d(C,B)/d(F,B); tolerance only in segmentation; RGB passthrough, alpha only.
//
// Feature: white background removal for e-commerce product shots
//
// - T1: solid-white backdrop loses alpha entirely (border-connected flood-fill),
//       inner red square keeps alpha 255
// - T2: off-white warm backdrop (d(C,B)=0 ≤ tolerance) loses alpha too
// - T3: grey ring pixel C where d(C,B)=d(F,B)/2 back-solves to α≈127,
//       RGB untouched
// - T4: white panel enclosed by a red ring keeps alpha 255 — flood-fill
//       never enters, no bg adjacency in the edge band
// - T5: white sliver isolated inside a coloured block by a moat keeps
//       alpha 255 — partition is border-flood, no interior erosion
// - T6: two segments (red and cyan-green) each map their seam blends to
//       their own local F; a global F would push one seam out of 120..135
// - T7: d(C,B) just inside tolerance partitions as background (≤), one
//       step beyond stays foreground
// - T8: ratio above 1 clamps to 255, never NaN or wrapped
// - T9: input untouched, deterministic, fresh output, RGB passthrough

const W = (w, h) => ({
  width: w,
  height: h,
  data: new Uint8ClampedArray(w * h * 4).fill(255),
});

const put = (buf, x, y, [r, g, b]) => {
  const i = (y * buf.width + x) * 4;
  buf.data[i] = r;
  buf.data[i + 1] = g;
  buf.data[i + 2] = b;
};

const get = (buf, x, y) => {
  const i = (y * buf.width + x) * 4;
  return [buf.data[i], buf.data[i + 1], buf.data[i + 2], buf.data[i + 3]];
};

const RED = [255, 0, 0];
const BLACK = [0, 0, 0];

test("T1 pure white background fully removed", () => {
  const buf = W(8, 8);
  for (let x = 3; x <= 4; x++)
    for (let y = 3; y <= 4; y++) put(buf, x, y, RED);
  const out = whiteToTransparent(buf);
  assert.equal(get(out, 0, 0)[3], 0);
  assert.equal(get(out, 4, 0)[3], 0);
  assert.equal(get(out, 0, 4)[3], 0);
  for (let x = 3; x <= 4; x++)
    for (let y = 3; y <= 4; y++) assert.equal(get(out, x, y)[3], 255);
});

test("T2 off-white background within tolerance removed", () => {
  const buf = W(8, 8);
  const WARM = [240, 238, 232];
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) put(buf, x, y, WARM);
  for (let x = 3; x <= 4; x++)
    for (let y = 3; y <= 4; y++) put(buf, x, y, RED);
  const out = whiteToTransparent(buf);
  assert.equal(get(out, 0, 0)[3], 0);
  assert.equal(get(out, 6, 6)[3], 0);
  assert.equal(get(out, 3, 3)[3], 255);
});

test("T3 half-blend edge pixel back-solves near alpha 127", () => {
  const buf = W(10, 10);
  for (let x = 3; x <= 6; x++)
    for (let y = 3; y <= 6; y++) put(buf, x, y, BLACK);
  for (let x = 2; x <= 7; x++)
    for (let y = 2; y <= 7; y++)
      if (x < 3 || x > 6 || y < 3 || y > 6) put(buf, x, y, [128, 128, 128]);
  const out = whiteToTransparent(buf);
  for (const [x, y] of [
    [2, 2],
    [5, 2],
    [2, 5],
    [7, 7],
  ]) {
    const [r, g, b, a] = get(out, x, y);
    assert.ok(Math.abs(a - 127) <= 2, `alpha at ${x},${y} = ${a}`);
    assert.deepEqual([r, g, b], [128, 128, 128]);
  }
});

test("T4 interior whites are preserved", () => {
  const buf = W(10, 10);
  for (let x = 3; x <= 6; x++)
    for (let y = 3; y <= 6; y++)
      if (x < 4 || x > 5 || y < 4 || y > 5) put(buf, x, y, RED);
  const out = whiteToTransparent(buf);
  assert.equal(get(out, 4, 4)[3], 255);
  assert.equal(get(out, 5, 5)[3], 255);
  assert.deepEqual(get(out, 4, 4).slice(0, 3), [255, 255, 255]);
  assert.equal(get(out, 0, 0)[3], 0);
  assert.equal(get(out, 3, 3)[3], 255);
});

test("T5 flood fill does not punch holes", () => {
  const buf = W(10, 10);
  for (let x = 3; x <= 6; x++)
    for (let y = 3; y <= 6; y++) put(buf, x, y, [100, 100, 100]);
  put(buf, 4, 4, [255, 255, 255]);
  put(buf, 5, 4, [255, 255, 255]);
  const out = whiteToTransparent(buf);
  assert.equal(get(out, 4, 4)[3], 255);
  assert.equal(get(out, 5, 4)[3], 255);
  assert.deepEqual(get(out, 4, 4).slice(0, 3), [255, 255, 255]);
});

test("T6 dual-tone product gets local F per RGB segment", () => {
  const buf = W(12, 12);
  const F1 = [255, 0, 0];
  const F2 = [0, 200, 255];
  for (let x = 2; x <= 4; x++)
    for (let y = 3; y <= 7; y++) put(buf, x, y, F1);
  for (let x = 7; x <= 9; x++)
    for (let y = 3; y <= 7; y++) put(buf, x, y, F2);
  put(buf, 1, 4, [255, 128, 128]);
  put(buf, 1, 5, [255, 128, 128]);
  put(buf, 10, 4, [128, 228, 255]);
  put(buf, 10, 5, [128, 228, 255]);
  const out = whiteToTransparent(buf);
  for (const [x, y] of [
    [1, 4],
    [1, 5],
  ]) {
    const a = get(out, x, y)[3];
    assert.ok(a >= 120 && a <= 135, `left seam alpha ${x},${y} = ${a}`);
  }
  for (const [x, y] of [
    [10, 4],
    [10, 5],
  ]) {
    const a = get(out, x, y)[3];
    assert.ok(a >= 120 && a <= 135, `right seam alpha ${x},${y} = ${a}`);
  }
});

test("T7 gray pixels at tolerance edge partition correctly", () => {
  const buf = W(10, 10);
  for (let y = 2; y <= 7; y++) {
    put(buf, 3, y, [179, 255, 255]);
    put(buf, 4, y, [179, 255, 255]);
    put(buf, 6, y, [178, 255, 255]);
    put(buf, 7, y, [178, 255, 255]);
  }
  const out = whiteToTransparent(buf, { tolerance: 0.3 });
  assert.equal(get(out, 3, 4)[3], 0, "just inside tolerance must partition as background");
  assert.equal(get(out, 6, 4)[3], 255, "one step beyond tolerance is foreground");
});

test("T8 alpha clamps to 0..255", () => {
  const buf = W(10, 10);
  for (let y = 2; y <= 6; y++)
    for (let x = 2; x <= 3; x++) put(buf, x, y, [180, 180, 180]);
  put(buf, 4, 4, [100, 100, 100]);
  const out = whiteToTransparent(buf);
  const [, , , a] = get(out, 4, 4);
  assert.ok(Number.isFinite(a), `alpha must not be NaN, got ${a}`);
  assert.equal(a, 255);
});

test("T9 function purity — RGB passthrough and determinism", () => {
  const buf = W(8, 8);
  for (let x = 3; x <= 4; x++)
    for (let y = 3; y <= 4; y++) put(buf, x, y, RED);
  put(buf, 3, 3, [128, 128, 128]);
  const before = Uint8ClampedArray.from(buf.data);
  const snapshot = { width: buf.width, height: buf.height };
  const out1 = whiteToTransparent(buf);
  const out2 = whiteToTransparent(buf);
  assert.deepEqual(buf.data, before);
  assert.equal(buf.width, snapshot.width);
  assert.equal(buf.height, snapshot.height);
  assert.notEqual(out1, buf);
  assert.notEqual(out2, buf);
  assert.notEqual(out1.data, buf.data);
  assert.deepEqual(out1.data, out2.data);
  assert.equal(out1.width, snapshot.width);
  assert.equal(out1.height, snapshot.height);
  for (const [x, y] of [
    [0, 0],
    [3, 3],
    [4, 4],
  ]) {
    const src = get(buf, x, y).slice(0, 3);
    assert.deepEqual(get(out1, x, y).slice(0, 3), src);
  }
});
