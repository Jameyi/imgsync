// BDD (Gherkin) — T5: lib/image-core/platform-preflight.ts
// (behaviour sheet approved 2026-10-22, bodies per sheet)
import test from "node:test";
import assert from "node:assert/strict";
import { checkPreflight } from "../src/lib/image-core/platform-preflight.ts";

// Frozen contract (SESSION 2026-10-22, approved):
//   API: checkPreflight(input: PixelBuffer,
//                       options?: PreflightOptions): PreflightReport
//   Options: { minSubjectRatio? = 0.85, minDimension? = 1000 }
//   Report: { width, height, subjectRatio, boundingBox, checks[] }
//     checks: [{ id: "subject-ratio" | "dimension", passed, detail }]
//   Subject = flood-fill segmentation from the border (same estimator as
//   F01: median 2px border background); bounding box of the largest
//   non-background region; subjectRatio = box area / canvas area.
//   Purity: no input mutation, fresh report, deterministic.
//
// Feature: marketplace preflight checks (F09)
//
// - T1: white-canvas product shot → bounding box isolates the subject
// - T2: subjectRatio is box area / canvas area (exact computation)
// - T3: ratio at/above minSubjectRatio passes; below fails
// - T4: dimension check fails when a side is under minDimension
// - T5: fully-uniform image (no subject) → empty subject, ratio 0, fails
// - T6: purity — input untouched, deterministic

const makeBuf = (w, h, fill = [255, 255, 255]) => {
  const buf = { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
  for (let i = 0; i < buf.data.length; i += 4) {
    buf.data[i] = fill[0];
    buf.data[i + 1] = fill[1];
    buf.data[i + 2] = fill[2];
    buf.data[i + 3] = 255;
  }
  return buf;
};

const put = (buf, x, y, [r, g, b]) => {
  const i = (y * buf.width + x) * 4;
  buf.data[i] = r;
  buf.data[i + 1] = g;
  buf.data[i + 2] = b;
};

const RED = [255, 0, 0];
const BLACK = [0, 0, 0];

test("T1 white-canvas product shot isolates the subject bounding box", () => {
  const buf = makeBuf(10, 10);
  for (let x = 3; x <= 6; x++)
    for (let y = 2; y <= 7; y++) put(buf, x, y, RED);
  const report = checkPreflight(buf, {});
  assert.deepEqual(report.boundingBox, { x0: 3, y0: 2, x1: 6, y1: 7 });
  assert.equal(report.width, 10);
  assert.equal(report.height, 10);
});

test("T2 subjectRatio equals box area over canvas area", () => {
  // 10×10 canvas, subject box 4 wide × 6 tall = 24 px → 0.24
  const buf = makeBuf(10, 10);
  for (let x = 3; x <= 6; x++)
    for (let y = 2; y <= 7; y++) put(buf, x, y, RED);
  const report = checkPreflight(buf, {});
  assert.ok(Math.abs(report.subjectRatio - 24 / 100) < 1e-9);
});

test("T3 ratio at or above the minimum passes, below fails", () => {
  // subject keeps a white margin so the border-band background estimate
  // stays valid; 16×16 in 20×20 → ratio 0.64 ≥ 0.6 → pass
  const big = makeBuf(20, 20);
  for (let x = 2; x <= 17; x++)
    for (let y = 2; y <= 17; y++) put(big, x, y, RED);
  const passing = checkPreflight(big, { minSubjectRatio: 0.6 });
  const ratioCheck = passing.checks.find((c) => c.id === "subject-ratio");
  assert.equal(ratioCheck.passed, true);

  // 14×14 in 20×20 → ratio 0.49 < 0.6 → fail
  const small = makeBuf(20, 20);
  for (let x = 3; x <= 16; x++)
    for (let y = 3; y <= 16; y++) put(small, x, y, RED);
  const failing = checkPreflight(small, { minSubjectRatio: 0.6 });
  const failedCheck = failing.checks.find((c) => c.id === "subject-ratio");
  assert.equal(failedCheck.passed, false);
});

test("T4 dimension check fails when a side is under the minimum", () => {
  const buf = makeBuf(900, 1200);
  for (let x = 0; x < 900; x++)
    for (let y = 0; y < 1200; y++) put(buf, x, y, RED);
  const report = checkPreflight(buf, { minDimension: 1000 });
  const dimCheck = report.checks.find((c) => c.id === "dimension");
  assert.equal(dimCheck.passed, false, "width 900 < 1000 must fail");
  const ok = checkPreflight(buf, { minDimension: 900 });
  assert.equal(
    ok.checks.find((c) => c.id === "dimension").passed,
    true,
    "width 900 ≥ 900 passes",
  );
});

test("T5 uniform image has no subject and fails the ratio check", () => {
  const buf = makeBuf(8, 8);
  const report = checkPreflight(buf, {});
  assert.deepEqual(report.boundingBox, null);
  assert.equal(report.subjectRatio, 0);
  assert.equal(
    report.checks.find((c) => c.id === "subject-ratio").passed,
    false,
  );
});

test("T6 purity — input untouched, deterministic", () => {
  const buf = makeBuf(10, 10);
  for (let x = 3; x <= 6; x++)
    for (let y = 3; y <= 6; y++) put(buf, x, y, BLACK);
  const before = Uint8ClampedArray.from(buf.data);
  const r1 = checkPreflight(buf, {});
  const r2 = checkPreflight(buf, {});
  assert.deepEqual(buf.data, before, "input must not be mutated");
  assert.deepEqual(r1, r2, "deterministic");
});
