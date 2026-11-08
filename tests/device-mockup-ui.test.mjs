// BDD (Gherkin) — F16 Device Mockup: orchestration decisions + registration
//
// Feature: wrap a screenshot in a device shell
//   As the workbench
//   I want the mockup orchestration to expose pure decisions
//   So that the UI wiring and the algorithm seam never drift apart
//
// (The pixel pipeline lives in lib/image-core/device-frame.ts and is
//  covered by tests/device-frame.test.mjs — this file pins the pure
//  decisions around it.)
//
// Scenario: the phone preset maps to a thin bezel and large screen radius
//   Given the device presets
//   When the phone preset is inspected
//   Then it maps to a smaller bezel than the tablet preset
//   And both presets set non-zero screen radii
//
// Scenario: an invalid frame color is rejected before any work starts
//   Given the hex "#zzzzzz"
//   When the frame options are built
//   Then they resolve to an invalid-color marker
//   And a valid hex resolves to the seam's RGB options
//
// Scenario: output file name appends the -mockup suffix and keeps PNG
//   Given the source file name "shot.png"
//   When the output name is built
//   Then the result is "shot-mockup.png"
//
// Feature: tool registration and page presence
//   As a visitor searching for "device mockup generator online"
//   I want a working /tools/device-mockup page
//   So that I can land directly on the tool
//
// Scenario: device-mockup is registered in the tools config
//   Given the TOOLS registry
//   When it is inspected
//   Then it contains slug "device-mockup" with implemented: true
//
// Scenario: device-mockup appears in the sitemap
//   Given the sitemap route is evaluated
//   When the URL list is generated
//   Then it contains /tools/device-mockup

import test from "node:test";
import assert from "node:assert/strict";
import {
  DEVICE_PRESETS,
  buildFrameOptions,
  buildMockupFileName,
} from "../src/lib/tools/device-frame.ts";
import { TOOLS } from "../src/config/tools.ts";

// Tests -----------------------------------------------------------------------

test("device presets map to bezel and screen radius", async () => {
  const phone = DEVICE_PRESETS.find((preset) => preset.value === "phone");
  const tablet = DEVICE_PRESETS.find((preset) => preset.value === "tablet");
  assert.ok(phone, "phone preset missing");
  assert.ok(tablet, "tablet preset missing");
  assert.ok(phone.bezelWidth < tablet.bezelWidth, "phone bezel thinner than tablet");
  assert.ok(phone.screenRadius > 0, "phone screen radius non-zero");
  assert.ok(tablet.screenRadius > 0, "tablet screen radius non-zero");
});

test("an invalid frame color is rejected before any work starts", async () => {
  assert.equal(
    buildFrameOptions({
      bezelWidth: 10,
      bezelColorHex: "#zzzzzz",
      screenRadius: 28,
      padding: 20,
      backgroundHex: null,
    }),
    null,
  );
  assert.deepEqual(
    buildFrameOptions({
      bezelWidth: 10,
      bezelColorHex: "#0a0a0a",
      screenRadius: 28,
      padding: 20,
      backgroundHex: null,
    }),
    {
      bezelWidth: 10,
      bezelColor: { r: 10, g: 10, b: 10 },
      screenRadius: 28,
      padding: 20,
      background: null,
    },
  );
});

test("output file name appends the -mockup suffix and keeps PNG", async () => {
  assert.equal(buildMockupFileName("shot.png"), "shot-mockup.png");
  assert.equal(buildMockupFileName("noext"), "noext-mockup.png");
});

test("device-mockup is registered in the tools config", async () => {
  const tool = TOOLS.find((entry) => entry.slug === "device-mockup");
  assert.ok(tool, "device-mockup missing from TOOLS");
  assert.equal(tool.implemented, true);
});

test("device-mockup appears in the sitemap", async () => {
  process.env.NEXT_PUBLIC_URL ??= "https://imgsync.example";
  const { default: sitemap } = await import("../src/app/sitemap.ts");
  const urls = sitemap().map((entry) => new URL(entry.url).pathname);
  assert.ok(
    urls.includes("/tools/device-mockup"),
    "sitemap missing /tools/device-mockup",
  );
});
