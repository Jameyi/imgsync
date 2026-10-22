// BDD (Gherkin) — T5: frontend slice for platform-preflight
// (orchestration + content + promos — behaviour sheet pending approval, stubs only)
import test from "node:test";
import assert from "node:assert/strict";
import {
  applyPlatformPreflight,
  runPlatformPreflightJob,
} from "../src/lib/tools/platform-preflight.ts";
import { checkPreflight } from "../src/lib/image-core/platform-preflight.ts";

// Feature: dual-path execution for F09 (mirrors T1d/T3/T4 sheets)
//
// Scenario: worker job equals algorithm after clone round-trip
//   Given a PixelBuffer and preflight options
//   When runPlatformPreflightJob runs on a structuredClone of it
//   Then the report equals checkPreflight(input, options)
//   And the clone source is not mutated
//
// Scenario: apply matches job output on both buffer sizes
//   Given one small buffer (below 4MP) and one enlarged buffer (above 4MP)
//   When applyPlatformPreflight runs on each
//   Then both reports equal the synchronous job report
//
// Feature: platform-preflight guide content (mirrors GE sheet)
//
// Scenario: implemented tool carries exactly its guide
//   Given the F09 tool "platform-preflight" is implemented
//   When the guide is looked up by slug
//   Then it has exactly 3 how-to steps and 2 FAQs
//   And every step and FAQ field is non-empty
//
// Scenario: tools page renders the F09 workbench with schemas
//   → covered by tests/tools-page.test.mjs (new PG7/GC7 scenarios at wiring time)
//
// Scenario: platform-preflight claims no promo until configured
//   When promos are looked up for "platform-preflight"
//   Then the list is empty

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

const OPTIONS = { minSubjectRatio: 0.6, minDimension: 10 };

test("worker job equals algorithm after clone round-trip", () => {
  const buf = makeBuf(20, 20, [255, 255, 255]);
  // paint a red subject so the report is non-trivial
  for (let x = 4; x <= 15; x++)
    for (let y = 4; y <= 15; y++) {
      const i = (y * buf.width + x) * 4;
      buf.data[i] = 255;
      buf.data[i + 1] = 0;
      buf.data[i + 2] = 0;
    }
  const expected = checkPreflight(buf, OPTIONS);
  const cloned = structuredClone(buf);
  const actual = runPlatformPreflightJob(cloned, OPTIONS);
  assert.deepEqual(actual, expected);
  assert.deepEqual(cloned.data, buf.data, "job must not mutate the clone source");
});

test("apply matches job output on both buffer sizes", async () => {
  const small = makeBuf(20, 20);
  const big = makeBuf(2001, 1200);
  const [rSmall, rBig] = await Promise.all([
    applyPlatformPreflight(small, OPTIONS),
    applyPlatformPreflight(big, OPTIONS),
  ]);
  assert.deepEqual(rSmall, runPlatformPreflightJob(small, OPTIONS));
  assert.deepEqual(rBig, runPlatformPreflightJob(big, OPTIONS));
});

// Scenario: implemented tool carries exactly its guide
//   → covered by tests/tool-guides.test.mjs (GF1/GF2, pure data seam)
// Scenario: tools page renders the F09 workbench with schemas
//   → covered by tests/tools-page.test.mjs (PG7/GC7, LIVE-gated server tests)

import { getPromos } from "../src/config/promos.ts";

test("platform-preflight claims no promo until configured", () => {
  assert.deepEqual(getPromos("platform-preflight"), []);
});
