// BDD (Gherkin) — T6b: lib/image-core/crop-to-box.ts (user request 2026-10-22)
// (behaviour sheet approved 2026-10-22, bodies per sheet)
import test from "node:test";
import assert from "node:assert/strict";
import { cropToBox } from "../src/lib/image-core/crop-to-box.ts";

// Frozen contract (SESSION 2026-10-22, approved):
//   API: cropToBox(input: PixelBuffer, box: CropBox): PixelBuffer
//   CropBox = { x0, y0, x1, y1 } — inclusive pixel coords, clipped to the
//   image; reversed corners are normalised; degenerate boxes collapse to
//   the clamped origin (no throw). Output dims = (x1-x0+1) × (y1-y0+1);
//   RGBA passthrough — crop never recolours, alpha included.
//   Purity: no input mutation, fresh output, deterministic.
//
// Feature: free-form crop for the resize tool (F02 extension)
//
// - T1: box in the middle of the image extracts exactly those pixels
// - T2: box touching the image edges works (full-width strip, corner box)
// - T3: box larger than the image is clipped to the image bounds
// - T4: degenerate box (reversed corners) normalises without throwing
// - T5: RGBA passthrough — semi-transparent pixels copy untouched
// - T6: purity — input untouched, deterministic, fresh output

const makeBuf = (w, h) => {
  const buf = { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
  for (let x = 0; x < w; x++)
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4;
      buf.data[i] = x * 10;
      buf.data[i + 1] = y * 10;
      buf.data[i + 2] = 7;
      buf.data[i + 3] = 255;
    }
  return buf;
};

const get = (buf, x, y) => {
  const i = (y * buf.width + x) * 4;
  return [buf.data[i], buf.data[i + 1], buf.data[i + 2], buf.data[i + 3]];
};

test("T1 middle box extracts exactly those pixels", () => {
  const buf = makeBuf(10, 10);
  const out = cropToBox(buf, { x0: 3, y0: 2, x1: 6, y1: 5 });
  assert.equal(out.width, 4);
  assert.equal(out.height, 4);
  // local (0,0) must be global (3,2); local (2,3) must be global (5,5)
  assert.deepEqual(get(out, 0, 0), get(buf, 3, 2));
  assert.deepEqual(get(out, 2, 3), get(buf, 5, 5));
  assert.deepEqual(get(out, 3, 3), get(buf, 6, 5));
});

test("T2 edge boxes work — full-width strip and corner box", () => {
  const buf = makeBuf(8, 6);
  const strip = cropToBox(buf, { x0: 0, y0: 4, x1: 7, y1: 5 });
  assert.equal(strip.width, 8);
  assert.equal(strip.height, 2);
  assert.deepEqual(get(strip, 5, 0), get(buf, 5, 4));
  const corner = cropToBox(buf, { x0: 0, y0: 0, x1: 1, y1: 1 });
  assert.equal(corner.width, 2);
  assert.equal(corner.height, 2);
  assert.deepEqual(get(corner, 1, 1), get(buf, 1, 1));
});

test("T3 oversized box is clipped to image bounds", () => {
  const buf = makeBuf(6, 6);
  const out = cropToBox(buf, { x0: -20, y0: -20, x1: 99, y1: 99 });
  assert.equal(out.width, 6);
  assert.equal(out.height, 6);
  assert.deepEqual(get(out, 0, 0), get(buf, 0, 0));
  assert.deepEqual(get(out, 5, 5), get(buf, 5, 5));
});

test("T4 degenerate box normalises without throwing", () => {
  const buf = makeBuf(6, 6);
  // reversed corners
  const reversed = cropToBox(buf, { x0: 4, y0: 4, x1: 2, y1: 1 });
  assert.equal(reversed.width, 3);
  assert.equal(reversed.height, 4);
  assert.deepEqual(get(reversed, 0, 0), get(buf, 2, 1));
  // fully outside → collapses to clamped origin, 1×1
  const outside = cropToBox(buf, { x0: 50, y0: 50, x1: 60, y1: 60 });
  assert.equal(outside.width, 1);
  assert.equal(outside.height, 1);
});

test("T5 RGBA passthrough — alpha included", () => {
  const buf = makeBuf(4, 4);
  const i = (1 * 4 + 2) * 4;
  buf.data[i] = 10;
  buf.data[i + 1] = 20;
  buf.data[i + 2] = 30;
  buf.data[i + 3] = 128; // semi-transparent
  const out = cropToBox(buf, { x0: 0, y0: 0, x1: 3, y1: 3 });
  assert.deepEqual(get(out, 2, 1), [10, 20, 30, 128]);
});

test("T6 purity — input untouched, deterministic, fresh output", () => {
  const buf = makeBuf(5, 5);
  const before = Uint8ClampedArray.from(buf.data);
  const out1 = cropToBox(buf, { x0: 1, y0: 1, x1: 3, y1: 2 });
  const out2 = cropToBox(buf, { x0: 1, y0: 1, x1: 3, y1: 2 });
  assert.deepEqual(buf.data, before, "input must not be mutated");
  assert.notEqual(out1, buf);
  assert.notEqual(out1.data, buf.data);
  assert.deepEqual(out1.data, out2.data, "deterministic");
  assert.equal(out1.width, 3);
  assert.equal(out1.height, 2);
});
