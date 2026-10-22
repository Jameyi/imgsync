// BDD (Gherkin) — T6b: frontend slice for custom crop (user request 2026-10-22,
// upgraded same day to Photoshop-style handles per user spec)
// (behaviour sheet approved via user interaction spec, bodies per sheet)
import test from "node:test";
import assert from "node:assert/strict";
import { cropToBox } from "../src/lib/image-core/crop-to-box.ts";

// Feature: Photoshop-style "Custom crop" mode in the resize workbench
//
// Scenario: mode switch
//   Given an uploaded image
//   When the user clicks "Free crop instead"
//   Then a crop overlay appears on the original-image preview
//   And no preset select is shown while in crop mode
//
// Scenario: drawing and reshaping the selection
//   When the user drags on empty preview area
//   Then a new selection box is drawn (image pixel coordinates)
//   And the four corner handles resize the box from that corner
//   And the four edge strips move one side at a time (no crossing)
//   And dragging inside the box moves the whole box, clamped in bounds
//
// Scenario: confirm applies the crop to the right preview
//   Given a valid selection (at least 2×2 px)
//   When the user presses Enter or clicks "Apply crop"
//   Then the right-hand preview canvas shows the cropped result
//   at native resolution (cropToBox, no resampling)
//   And any further handle edit un-applies until confirmed again
//
// Scenario: download exports the confirmed crop
//   Given a confirmed crop preview
//   When the user clicks Download
//   Then the exported PNG is exactly the confirmed box region
//
// Scenario: switching back to presets restores preset mode
//   When the user selects "Back to platform presets"
//   Then the overlay disappears and the contain-resize result returns
//
// (overlay dragging is DOM interaction — Playwright E2E at T7; node tests
//  cover the algorithm seam used by confirm)

test("confirm seam — cropToBox feeds the preview at native resolution", () => {
  const w = 10;
  const buf = { width: w, height: 8, data: new Uint8ClampedArray(w * 8 * 4) };
  for (let i = 0; i < buf.data.length; i += 4) {
    buf.data[i] = 200;
    buf.data[i + 3] = 255;
  }
  const out = cropToBox(buf, { x0: 2, y0: 1, x1: 6, y1: 4 });
  assert.equal(out.width, 5);
  assert.equal(out.height, 4);
  assert.equal(out.data[0], 200);
  assert.equal(out.data[3], 255);
});
