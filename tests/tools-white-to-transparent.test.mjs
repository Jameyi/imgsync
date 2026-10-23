// BDD (Gherkin) — T1d: lib/tools orchestration for remove-white-background
// (behaviour sheet approved 2026-10-21, header below)
import test from "node:test";
import assert from "node:assert/strict";
import {
  applyWhiteToTransparent,
  runWhiteToTransparentJob,
} from "../src/lib/tools/white-to-transparent.ts";
import { whiteToTransparent } from "../src/lib/image-core/white-to-transparent.ts";

// Feature: dual-path execution (main thread vs worker) for F01 (sheet above)

const W = (w, h) => ({
  width: w,
  height: h,
  data: new Uint8ClampedArray(w * h * 4).fill(255),
});

const paintSquare = (buf, [x0, x1], [y0, y1], [r, g, b]) => {
  for (let x = x0; x <= x1; x++)
    for (let y = y0; y <= y1; y++) {
      const i = (y * buf.width + x) * 4;
      buf.data[i] = r;
      buf.data[i + 1] = g;
      buf.data[i + 2] = b;
    }
};

const makeBuffer = () => {
  const buf = W(64, 64);
  paintSquare(buf, [20, 43], [20, 43], [255, 0, 0]);
  paintSquare(buf, [26, 37], [26, 37], [0, 0, 255]);
  for (let i = 3; i < buf.data.length; i += 4) buf.data[i] = 255;
  return buf;
};

test("worker job equals algorithm after clone round-trip", () => {
  const buf = makeBuffer();
  const expected = whiteToTransparent(buf, { tolerance: 0.15 });
  const cloned = structuredClone(buf);
  const actual = runWhiteToTransparentJob(cloned, { tolerance: 0.15 });
  assert.deepEqual(actual.data, expected.data);
  assert.equal(actual.width, expected.width);
  assert.equal(actual.height, expected.height);
  assert.deepEqual(cloned.data, buf.data, "job must not mutate the clone source");
});

test("apply matches job output on both buffer sizes", async () => {
  const small = makeBuffer();
  const big = makeBuffer();
  big.width = 2561;
  big.height = 1562;
  big.data = new Uint8ClampedArray(2561 * 1562 * 4).fill(255);
  paintSquare(big, [60, 90], [60, 90], [255, 0, 0]);
  const [rSmall, rBig] = await Promise.all([
    applyWhiteToTransparent(small, { tolerance: 0.15 }),
    applyWhiteToTransparent(big, {}),
  ]);
  const eSmall = runWhiteToTransparentJob(small, { tolerance: 0.15 });
  assert.deepEqual(rSmall.data, eSmall.data);
  const eBig = runWhiteToTransparentJob(big, {});
  assert.deepEqual(rBig.data, eBig.data);
});

test.skip("loadImageFromFiles contract (browser-verified at T1e)", () => {
  // DOM File/createImageBitmap APIs — no Node unit test
});
