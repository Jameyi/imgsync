// BDD (Gherkin) behaviour sheet — T2: lib/tools/compress-to-size.ts (+worker)
// (behaviour sheet approved 2026-10-21, headers below; OH4–OH6 browser-verified)
import test from "node:test";
import assert from "node:assert/strict";
import {
  runCompressToSizeJob,
  applyCompressToSize,
} from "../src/lib/tools/compress-to-size.ts";

// Frozen contract (T2 grilling 2026-10-21 + orchestration sheet approval):
//   runCompressToSizeJob(input, encode?) — input {source: PixelBuffer, targetBytes}
//     routes into compressToSize(image-core) and returns its result untouched;
//     encoder injectable for node tests, default = createSizeEncoder(source)
//   applyCompressToSize(input, encode?) — ≥4MP pixels with Worker available ->
//     compress-to-size.worker.ts; otherwise main-thread job (F01 branch rule)
//   worker message protocol {id, result|error} (F01 shape; browser-verified)
//   createSizeEncoder: JPEG-only mime, dims max(1, round(source×scale)),
//     alpha composited on white before encode (browser-verified)
//
// Feature: compress-to-size orchestration (encoder seam + worker dispatch)
//
// - OH1: job routes input to compressToSize via the provided encoder and
//        returns its result unchanged
// - OH2: input through structuredClone round-trip re-runs to identical bytes
//        (sync/worker parity rule from PRD)
// - OH3: small input (< 4MP) apply equals the main-thread job output
// - OH4: ≥4MP apply takes the Worker branch — real canonical encoder runs
//        OffscreenCanvas/convertToBlob, browser-only; page live test at T2
//        covers it (node SKIP here, mirrors loadImageFromFiles precedent)
// - OH5: worker message protocol {id, result:{data,width,height,hasHitTarget}|error}
//        — browser-verified (node SKIP)
// - OH6: createSizeEncoder contract — scale ∈ (0,1], dims max(1, round×scale),
//        'image/jpeg' mime, white-backed alpha composite — browser-verified
//        (node SKIP)

const TINY = { width: 1, height: 1, data: new Uint8ClampedArray(4) };

const fakeEncoder = async () => {
  const data = new Uint8Array(1000);
  return { data, width: 160, height: 90 };
};

test("OH1 job routes input through the injected encoder untouched", async () => {
  const input = { source: TINY, targetBytes: 2000 };
  const result = await runCompressToSizeJob(input, fakeEncoder);
  assert.equal(result.hasHitTarget, true);
  assert.equal(result.data.byteLength, 1000);
  assert.equal(result.width, 160);
  assert.equal(result.height, 90);
});

test("OH2 structuredClone round-trip reproduces identical bytes", async () => {
  const input = { source: TINY, targetBytes: 2000 };
  const first = await runCompressToSizeJob(input, fakeEncoder);
  const second = await runCompressToSizeJob(structuredClone(input), fakeEncoder);
  assert.deepEqual(second.data, first.data);
  assert.equal(second.hasHitTarget, first.hasHitTarget);
});

test("OH3 small-input apply equals the main-thread job output", async () => {
  const input = { source: TINY, targetBytes: 2000 };
  const viaJob = await runCompressToSizeJob(input, fakeEncoder);
  const viaApply = await applyCompressToSize(input, fakeEncoder);
  assert.deepEqual(viaApply.data, viaJob.data);
  assert.equal(viaApply.hasHitTarget, viaJob.hasHitTarget);
});

test("OH4 large-input apply takes the Worker branch (browser-verified)", { skip: "real OffscreenCanvas/convertToBlob — covered by T2 page live test" }, () => {});

test("OH5 worker message protocol {id, result|error} (browser-verified)", { skip: "real worker message flow — covered by T2 page live test" }, () => {});

test("OH6 createSizeEncoder JPEG/white-composite contract (browser-verified)", { skip: "real OffscreenCanvas — covered by T2 page live test" }, () => {});
