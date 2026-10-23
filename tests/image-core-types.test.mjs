// BDD (Gherkin) — T0b: lib/image-core types contract
// (behaviour sheet approved 2026-10-21, see header below)
import test from "node:test";
import assert from "node:assert/strict";

// Feature: PixelBuffer type foundation for lib/image-core
//   As an image-core module author
//   I want a shared PixelBuffer contract with zero DOM imports
//   So that all tool algorithms and their tests share one image data shape
//
// Scenario: module is importable at runtime with DOM-free type stripping
//   Given the file "lib/image-core/types.ts" does not exist yet
//   When a test process imports it via Node type stripping
//   Then the import resolves without throwing
//   And the module contributes no runtime side effects
//
// Scenario: PixelBuffer structural contract (typecheck-enforced)
//   Given a runtime image data object with width, height and Uint8ClampedArray data
//   When a function declares its parameter as PixelBuffer
//   Then that object is accepted structurally without importing any DOM type

test("types module contract", async () => {
  const types = await import("../src/lib/image-core/types.ts");
  // DOM-free pure type module: importable, and contributes no runtime values
  assert.ok(types, "types module should evaluate without side effects");
});
