// BDD (Gherkin) — T3: frontend slice for defringe-edges
// (orchestration + page + content + promos — behaviour sheet pending approval, stubs only)
import test from "node:test";
import assert from "node:assert/strict";
import {
  applyDefringeEdges,
  runDefringeEdgesJob,
} from "../src/lib/tools/defringe-edges.ts";
import { defringeEdges } from "../src/lib/image-core/defringe-edges.ts";

// Feature: dual-path execution for F08 (mirrors T1d sheet)
//
// Scenario: worker job equals algorithm after clone round-trip
//   Given a PixelBuffer cutout with white-tinted edge pixels
//   When runDefringeEdgesJob runs on a structuredClone of it
//   Then the output equals defringeEdges(input) pixel-for-pixel
//   And the clone source is not mutated
//
// Scenario: apply matches job output on both buffer sizes
//   Given one small buffer (below 4MP) and one enlarged buffer (above 4MP)
//   When applyDefringeEdges runs on each
//   Then both outputs equal the synchronous job output
//
// Feature: defringe-edges guide content (mirrors GC sheet)
//
// Scenario: implemented tool carries exactly its guide
//   Given the F08 tool "defringe-edges" is implemented
//   When the guide is looked up by slug
//   Then it has exactly 3 how-to steps and 2 FAQs
//   And every step and FAQ field is non-empty
//
// Scenario: tools page renders the F08 workbench with schemas
//   Given the rendered /tools/defringe-edges page
//   When the HTML is inspected
//   Then it contains the workbench mount, FAQPage JSON-LD
//   and canonical/OG metadata for /tools/defringe-edges
//
// Scenario: defringe-edges claims no promo until configured
//   When promos are looked up for "defringe-edges"
//   Then the list is empty (affiliate slot stays off for F08, like T1 initial state)

const put = (buf, x, y, [r, g, b, a]) => {
  const i = (y * buf.width + x) * 4;
  buf.data[i] = r;
  buf.data[i + 1] = g;
  buf.data[i + 2] = b;
  buf.data[i + 3] = a;
};

const makeCutout = () => {
  const buf = { width: 64, height: 64, data: new Uint8ClampedArray(64 * 64 * 4) };
  // opaque red disc interior with a white-blend semi edge over transparency
  for (let x = 20; x <= 43; x++)
    for (let y = 20; y <= 43; y++) put(buf, x, y, [255, 0, 0, 255]);
  put(buf, 19, 20, [255, 255, 255, 0]);
  put(buf, 20, 19, [255, 255, 255, 0]);
  put(buf, 19, 19, [128, 0, 0, 128]); // semi edge adjacent to α0
  return buf;
};

test("worker job equals algorithm after clone round-trip", () => {
  const buf = makeCutout();
  const expected = defringeEdges(buf);
  const cloned = structuredClone(buf);
  const actual = runDefringeEdgesJob(cloned);
  assert.deepEqual(actual.data, expected.data);
  assert.equal(actual.width, expected.width);
  assert.equal(actual.height, expected.height);
  assert.deepEqual(cloned.data, buf.data, "job must not mutate the clone source");
});

test("apply matches job output on both buffer sizes", async () => {
  const small = makeCutout();
  const big = makeCutout();
  big.width = 2561;
  big.height = 1562;
  big.data = new Uint8ClampedArray(2561 * 1562 * 4);
  put(big, 60, 60, [255, 255, 255, 0]);
  put(big, 61, 61, [128, 0, 0, 128]);
  put(big, 62, 62, [255, 0, 0, 255]);
  const [rSmall, rBig] = await Promise.all([
    applyDefringeEdges(small),
    applyDefringeEdges(big),
  ]);
  const eSmall = runDefringeEdgesJob(small);
  assert.deepEqual(rSmall.data, eSmall.data);
  const eBig = runDefringeEdgesJob(big);
  assert.deepEqual(rBig.data, eBig.data);
});

// Scenario: implemented tool carries exactly its guide
//   → covered by tests/tool-guides.test.mjs (GD1/GD2, pure data seam)
// Scenario: tools page renders the F08 workbench with schemas
//   → covered by tests/tools-page.test.mjs (PG4/GC5, LIVE-gated server tests)

import { getPromos } from "../src/config/promos.ts";

test("defringe-edges claims no promo until configured", () => {
  assert.deepEqual(getPromos("defringe-edges"), []);
});
