// BDD (Gherkin) — T0c: lib/tools orchestration seams
// (behaviour sheet approved 2026-10-21, header below)
import test from "node:test";
import assert from "node:assert/strict";
import { shouldUseWorker, track, setTrackTransport } from "../src/lib/tools/runtime.ts";
import { MAX_SINGLE_THREAD_PIXELS } from "../src/lib/tools/runtime.ts";
import { getTool } from "../src/config/tools.ts";

// Feature: worker-gate and tracking seam for tool orchestration (see sheet above)

test("orchestration seams", () => {
  assert.equal(MAX_SINGLE_THREAD_PIXELS, 4_000_000);

  assert.equal(shouldUseWorker(4_000_000), true);
  assert.equal(shouldUseWorker(3_999_999), false);
  assert.equal(shouldUseWorker(0), false);

  const seen = [];
  setTrackTransport((event) => seen.push(event));
  const event = {
    tool: getTool("remove-white-background").slug,
    step: "export_done",
    meta: { bytes: 861 },
  };
  track(event);
  assert.equal(seen.length, 1);
  assert.deepEqual(seen[0], event);
  assert.equal(seen[0].tool, "remove-white-background");
  track({ tool: "defringe-edges", step: "tool_use" });
  assert.equal(seen[1].meta, undefined);

  // all four funnel steps are valid on the seam
  for (const step of ["visit", "tool_use", "export_done", "promo_click"]) {
    track({ tool: "remove-white-background", step });
  }
  assert.equal(seen.length, 6);
});
