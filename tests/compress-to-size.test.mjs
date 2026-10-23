// BDD (Gherkin) behaviour sheet — T2: lib/image-core/compress-to-size.ts
// Frozen contract (SESSION T2 grilling 2026-10-21):
//   API: compressToSize(encode, { targetBytes }): Promise<CompressToSizeResult>
//   encode(quality 0..1, scale 0..1) => Promise<{data: Uint8Array, width, height}>
//     (injected seam — JPEG-only mime is an orchestration decision, invisible here)
//   fixed 7-round quality bisection on [0,1]; best-so-far = largest bytes <= target
//   no fit at quality floor -> scale x0.5 and re-bisect
//   floor: stop when last probed min(width,height) <= 1
//   floor exhausted -> closest (min-bytes) result with hasHitTarget:false
//   encode rejection propagates as-is; no DOM, no pixels in this layer
//
// Feature: compress an image to hit an exact KB target in the browser
//
// - CT1: linear encode, target mid-slope — result bytes land <= target,
//        >= 80% of target (no over-compression), dims passed through
// - CT2: exactly 7 quality probes on the first scale pass, first probe 0.5,
//        every probe strictly inside (0,1) at scale 1
// - CT3: oversized source — scale fallback walks 1 -> 0.5 -> 0.25 and the
//        hit carries scaled-down dimensions; hit stops further downsampling
// - CT4: unreachable target — returns closest (min-bytes) result with
//        hasHitTarget:false, no throw, stops at the dimension floor
//        (no infinite loop when floor can't fit the target)
// - CT5: best-so-far keeps the largest fitting bytes across a non-monotonic
//        encode — never the last probe's bytes
// - CT6: encode rejection propagates as-is

import test from "node:test";
import assert from "node:assert/strict";
import { compressToSize } from "../src/lib/image-core/compress-to-size.ts";

const recorder = (bytesFor) => {
  const calls = [];
  const encode = async (quality, scale) => {
    calls.push({ quality, scale });
    return {
      data: new Uint8Array(bytesFor(quality, scale)),
      width: Math.max(1, Math.round(160 * scale)),
      height: Math.max(1, Math.round(90 * scale)),
    };
  };
  return { encode, calls };
};

test("CT1 lands inside target band with 80% floor and passes dims through", async () => {
  const { encode } = recorder(
    (quality) => Math.round(200000 * quality) + 5000,
  );
  const result = await compressToSize(encode, { targetBytes: 100000 });
  assert.ok(result.data.byteLength <= 100000, `bytes ${result.data.byteLength}`);
  assert.ok(result.data.byteLength >= 80000, `not over-compressed: ${result.data.byteLength}`);
  assert.equal(result.width, 160);
  assert.equal(result.height, 90);
  assert.equal(result.hasHitTarget, true);
});

test("CT2 bisects exactly 7 quality probes starting at 0.5", async () => {
  const { encode, calls } = recorder(
    (quality) => Math.round(200000 * quality) + 5000,
  );
  await compressToSize(encode, { targetBytes: 100000 });
  assert.equal(calls.length, 7);
  assert.equal(calls[0].quality, 0.5);
  for (const call of calls) {
    assert.ok(call.quality > 0 && call.quality < 1, `quality ${call.quality}`);
    assert.equal(call.scale, 1);
  }
});

test("CT3 falls back to scale 1 -> 0.5 -> 0.25 and hits with scaled dims", async () => {
  const { encode, calls } = recorder(
    (quality, scale) => 4000 + Math.round(20000 * quality) + Math.round(96000 * scale),
  );
  const result = await compressToSize(encode, { targetBytes: 30000 });
  assert.equal(result.hasHitTarget, true);
  assert.ok(result.data.byteLength <= 30000, `bytes ${result.data.byteLength}`);
  assert.ok(result.data.byteLength >= 24000, `not over-compressed: ${result.data.byteLength}`);
  assert.equal(result.width, 40);
  assert.equal(result.height, 23);
  assert.deepEqual(
    [...new Set(calls.map((call) => call.scale))],
    [1, 0.5, 0.25],
  );
});

test("CT4 unreachable target returns closest result, no throw, no infinite loop", async () => {
  const { encode } = recorder(
    (quality, scale) => 500 + Math.round(10000 * scale) + Math.round(20000 * quality),
  );
  const result = await compressToSize(encode, { targetBytes: 499 });
  assert.equal(result.hasHitTarget, false);
  assert.ok(result.data.byteLength > 499, "closest result stays honest (over target)");
  assert.ok(result.data.byteLength < 2000, "closest is the smallest scale attempt");
});

test("CT5 best-so-far survives a non-monotonic encode", async () => {
  const fitBytes = { 0.5: 29000, 0.25: 10000, 0.125: 7000 };
  const { encode } = recorder(
    (quality) => fitBytes[quality] ?? 500,
  );
  const result = await compressToSize(encode, { targetBytes: 30000 });
  assert.equal(result.hasHitTarget, true);
  assert.equal(result.data.byteLength, 29000);
});

test("CT6 encode rejection propagates as-is", async () => {
  const encode = async () => {
    throw new Error("encode exploded");
  };
  await assert.rejects(
    compressToSize(encode, { targetBytes: 1000 }),
    /encode exploded/,
  );
});
