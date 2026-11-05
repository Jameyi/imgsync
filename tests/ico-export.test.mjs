// BDD (Gherkin) — F12 Favicon Kit: ICO container writer (PRD F12)
//
// Feature: bundle multiple PNG sizes into one .ico file
//   As a developer shipping a site
//   I want one .ico containing several square PNG sizes
//   So that favicons render correctly across browsers and contexts
//
// Scenario: empty entry list is rejected
//   Given no PNG entries
//   When buildIco is called with an empty array
//   Then it throws
//
// Scenario: the ICONDIR header identifies a valid ICO with one entry per input
//   Given three PNG entries of sizes 16, 32 and 48
//   When buildIco is called
//   Then bytes 0-1 are 0 and bytes 2-3 are 1 (type icon)
//   And bytes 4-5 equal 3 (entry count)
//
// Scenario: each ICONDIRENTRY carries its size, byte length and offset
//   Given three PNG entries of sizes 16, 32 and 48 with known payload lengths
//   When buildIco is called
//   Then entry i's width byte equals its size (255-byte cap not reached)
//   And entry i's height byte equals its size
//   And entry i's data length field equals the PNG payload length
//   And entry i's data offset equals 6 + 16*count + the sum of earlier payload lengths
//
// Scenario: PNG payloads are embedded verbatim after the directory
//   Given three PNG entries with distinguishable payloads
//   When buildIco is called
//   Then the bytes after the directory equal each payload in order
//
// Scenario: a round-trip parse recovers the entries
//   Given three PNG entries of sizes 16, 32 and 48
//   When buildIco output is parsed with a minimal reader in the test
//   Then it reports 3 entries with the original sizes and payload lengths

import test from "node:test";
import assert from "node:assert/strict";
import {
  buildIco,
  buildFaviconSnippet,
  buildWebmanifest,
} from "../src/lib/image-core/ico-export.ts";
import { TOOLS } from "../src/config/tools.ts";

// Helpers ---------------------------------------------------------------------

// Minimal valid-looking PNG payload: signature + a size-tagged filler.
const fakePng = (size) => {
  const payload = new Uint8Array(8 + size);
  payload.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  payload[8] = size;
  return payload;
};

const entries = (sizes) =>
  sizes.map((size) => ({ width: size, height: size, png: fakePng(size) }));

const readU16 = (bytes, offset) =>
  bytes[offset] | (bytes[offset + 1] << 8);
const readU32 = (bytes, offset) =>
  (bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)) >>>
  0;

// Tests -----------------------------------------------------------------------

test("empty entry list is rejected", async () => {
  assert.throws(() => buildIco([]));
});

test("the ICONDIR header identifies a valid ICO with one entry per input", async () => {
  const bytes = new Uint8Array(buildIco(entries([16, 32, 48])));
  assert.equal(readU16(bytes, 0), 0, "reserved must be 0");
  assert.equal(readU16(bytes, 2), 1, "type must be 1 (icon)");
  assert.equal(readU16(bytes, 4), 3, "one directory entry per input");
});

test("each ICONDIRENTRY carries its size, byte length and offset", async () => {
  const sizes = [16, 32, 48];
  const ins = entries(sizes);
  const bytes = new Uint8Array(buildIco(ins));
  const count = ins.length;
  const dirEnd = 6 + 16 * count;
  let expectedOffset = dirEnd;
  ins.forEach((entry, i) => {
    const base = 6 + i * 16;
    assert.equal(bytes[base], entry.width, `entry ${i} width byte`);
    assert.equal(bytes[base + 1], entry.height, `entry ${i} height byte`);
    assert.equal(readU32(bytes, base + 8), entry.png.length, `entry ${i} data length`);
    assert.equal(readU32(bytes, base + 12), expectedOffset, `entry ${i} data offset`);
    expectedOffset += entry.png.length;
  });
});

test("PNG payloads are embedded verbatim after the directory", async () => {
  const ins = entries([16, 32, 48]);
  const bytes = new Uint8Array(buildIco(ins));
  const dirEnd = 6 + 16 * ins.length;
  let cursor = dirEnd;
  ins.forEach((entry, i) => {
    const slice = bytes.subarray(cursor, cursor + entry.png.length);
    assert.deepEqual(
      Array.from(slice),
      Array.from(entry.png),
      `payload ${i} must be embedded verbatim`,
    );
    cursor += entry.png.length;
  });
  assert.equal(cursor, bytes.length, "no trailing bytes after the last payload");
});

test("a round-trip parse recovers the entries", async () => {
  const sizes = [16, 32, 48];
  const ins = entries(sizes);
  const bytes = new Uint8Array(buildIco(ins));
  const count = readU16(bytes, 4);
  assert.equal(count, sizes.length);
  const parsed = [];
  for (let i = 0; i < count; i++) {
    const base = 6 + i * 16;
    parsed.push({
      width: bytes[base] || 256,
      height: bytes[base + 1] || 256,
      length: readU32(bytes, base + 8),
    });
  }
  assert.deepEqual(
    parsed,
    sizes.map((size) => ({ width: size, height: size, length: 8 + size })),
  );
});

// ——— favicon kit: snippet builder + tool registration (F12 frontend pin) ———

test("the HTML snippet references every generated file", async () => {
  const html = buildFaviconSnippet();
  for (const file of [
    "favicon.ico",
    "favicon-16x16.png",
    "favicon-32x32.png",
    "apple-touch-icon.png",
    "icon-512x512.png",
  ]) {
    assert.ok(html.includes(file), `snippet must reference ${file}`);
  }
});

test("the manifest snippet names the PNG sizes", async () => {
  const manifest = JSON.parse(buildWebmanifest());
  assert.ok(Array.isArray(manifest.icons));
  const bySize = Object.fromEntries(
    manifest.icons.map((icon) => [icon.sizes, icon]),
  );
  assert.equal(bySize["180x180"]?.src, "/apple-touch-icon.png");
  assert.equal(bySize["512x512"]?.src, "/icon-512x512.png");
  assert.equal(bySize["180x180"]?.purpose, "any");
  assert.equal(bySize["512x512"]?.purpose, "any");
});

test("absolute paths work for any deployment root", async () => {
  const html = buildFaviconSnippet();
  const manifest = JSON.parse(buildWebmanifest());
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    assert.ok(match[1].startsWith("/"), `href ${match[1]} must be absolute`);
  }
  for (const icon of manifest.icons) {
    assert.ok(icon.src.startsWith("/"), `icon src ${icon.src} must be absolute`);
  }
});

test("favicon-kit is registered in the tools config", async () => {
  const tool = TOOLS.find((entry) => entry.slug === "favicon-kit");
  assert.ok(tool, "favicon-kit missing from TOOLS");
  assert.equal(tool.implemented, true);
});

test("favicon-kit appears in the sitemap", async () => {
  process.env.NEXT_PUBLIC_URL ??= "https://imgsync.example";
  const { default: sitemap } = await import("../src/app/sitemap.ts");
  const urls = sitemap().map((entry) => new URL(entry.url).pathname);
  assert.ok(
    urls.includes("/tools/favicon-kit"),
    "sitemap missing /tools/favicon-kit",
  );
});
