// BDD (Gherkin) — T4: frontend slice for resize-to-preset
// (orchestration + page + content — behaviour sheet pending approval, stubs only)
import test from "node:test";
import assert from "node:assert/strict";
import {
  applyResizeToPreset,
  runResizeToPresetJob,
} from "../src/lib/tools/resize-to-preset.ts";
import { resizeToPreset } from "../src/lib/image-core/resize-to-preset.ts";

// Feature: dual-path execution for F02 (mirrors T1d/T3 sheets)
//
// Scenario: worker job equals algorithm after clone round-trip
//   Given a PixelBuffer and preset options {width, height}
//   When runResizeToPresetJob runs on a structuredClone of it
//   Then the output equals resizeToPreset(input, options) pixel-for-pixel
//   And the clone source is not mutated
//
// Scenario: apply matches job output on both buffer sizes
//   Given one small buffer (below 4MP) and one enlarged buffer (above 4MP)
//   When applyResizeToPreset runs on each
//   Then both outputs equal the synchronous job output
//
// Feature: resize-to-preset guide content (mirrors GC/GD sheets)
//
// Scenario: implemented tool carries exactly its guide
//   Given the F02 tool "resize-to-preset" is implemented
//   When the guide is looked up by slug
//   Then it has exactly 3 how-to steps and 2 FAQs
//   And every step and FAQ field is non-empty
//
// Scenario: tools page renders the F02 workbench with schemas
//   → covered by tests/tools-page.test.mjs (new PG6/GC6 scenarios at wiring time)
//
// Scenario: resize-to-preset claims no promo until configured
//   When promos are looked up for "resize-to-preset"
//   Then the list is empty

const makeBuf = (w, h, fill) => {
  const buf = { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
  if (fill) {
    for (let i = 0; i < buf.data.length; i += 4) {
      buf.data[i] = fill[0];
      buf.data[i + 1] = fill[1];
      buf.data[i + 2] = fill[2];
      buf.data[i + 3] = 255;
    }
  }
  return buf;
};

const PRESET = { width: 32, height: 32 };

test("worker job equals algorithm after clone round-trip", () => {
  const buf = makeBuf(8, 8, [255, 0, 0]);
  const expected = resizeToPreset(buf, PRESET);
  const cloned = structuredClone(buf);
  const actual = runResizeToPresetJob(cloned, PRESET);
  assert.deepEqual(actual.data, expected.data);
  assert.equal(actual.width, expected.width);
  assert.equal(actual.height, expected.height);
  assert.deepEqual(cloned.data, buf.data, "job must not mutate the clone source");
});

test("apply matches job output on both buffer sizes", async () => {
  const small = makeBuf(8, 8, [255, 0, 0]);
  const big = makeBuf(2001, 2001, [0, 0, 255]);
  const [rSmall, rBig] = await Promise.all([
    applyResizeToPreset(small, PRESET),
    applyResizeToPreset(big, { width: 512, height: 512 }),
  ]);
  assert.deepEqual(rSmall.data, runResizeToPresetJob(small, PRESET).data);
  assert.deepEqual(
    rBig.data,
    runResizeToPresetJob(big, { width: 512, height: 512 }).data,
  );
});

// Scenario: implemented tool carries exactly its guide
//   → covered by tests/tool-guides.test.mjs (GE1/GE2, pure data seam)
// Scenario: tools page renders the F02 workbench with schemas
//   → covered by tests/tools-page.test.mjs (PG6/GC6, LIVE-gated server tests)

import { getPromos } from "../src/config/promos.ts";

test("resize-to-preset carries the approved Fotor promo", () => {
  const promos = getPromos("resize-to-preset");
  assert.equal(promos.length, 1, "exactly one enabled promo for F02");
  assert.equal(promos[0].brand, "Fotor");
  assert.equal(promos[0].href, "https://www.fotor.com/?via=jameyi");
});
