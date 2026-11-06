// BDD (Gherkin) — F06 Batch Convert: store-method ZIP container writer (PRD F06)
//
// Feature: bundle many converted images into one downloadable zip
//   As an e-commerce seller converting a folder of product photos
//   I want the batch tool to hand me a single zip archive
//   So that I can save all results in one download
//
// (Images are already compressed — the container stores payloads verbatim
//  with the store method. Pure functions, no DOM, zero dependencies.)
//
// Scenario: crc32 reproduces the standard check vector
//   Given the ASCII bytes of "123456789"
//   When crc32 is called
//   Then it returns 0xCBF43926
//
// Scenario: crc32 is stable for arbitrary bytes
//   Given a 1KB buffer of pseudo-random bytes
//   When crc32 is called twice
//   Then both calls return the same value
//   And the empty input returns 0
//
// Scenario: empty entry list is rejected
//   Given no entries
//   When buildZip is called with an empty array
//   Then it throws
//
// Scenario: a single-file zip stores the payload verbatim
//   Given one entry "a.png" with known bytes
//   When buildZip is called
//   Then bytes 0-3 are the local header signature PK\x03\x04
//   And the compression method field is 0 (store)
//   And the CRC-32 field matches crc32 of the payload
//   And the payload bytes appear verbatim at their recorded offset
//
// Scenario: a multi-file zip links local headers through a central directory
//   Given three entries with distinct names and payloads
//   When buildZip is called
//   Then the central directory holds 3 entries with matching names
//   And the end-of-central-directory record reports 3 entries
//   And each central entry's local-header offset points at a PK\x03\x04 signature
//
// Scenario: a round-trip parse recovers the entries
//   Given three entries with distinct names and payloads
//   When the zip is parsed with a minimal reader written in the test
//   Then it recovers the original file names, sizes and payload bytes

import test from "node:test";
import assert from "node:assert/strict";
import { crc32, buildZip } from "../src/lib/image-core/zip.ts";

// Helpers ---------------------------------------------------------------------

const entry = (name, seed) => {
  const data = new Uint8Array(16 + seed);
  for (let i = 0; i < data.length; i++) data[i] = (seed * 7 + i * 13) % 256;
  return { name, data };
};

const readU16 = (bytes, offset) => bytes[offset] | (bytes[offset + 1] << 8);
const readU32 = (bytes, offset) =>
  (bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)) >>>
  0;

const ascii = (text) => new TextEncoder().encode(text);

// Minimal reader: walk the central directory and extract payloads.
const readZipEntries = (bytes) => {
  // Locate the EOCD record (scan backwards, no comment support needed).
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (readU32(bytes, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("EOCD not found");
  const count = readU16(bytes, eocd + 10);
  let cursor = readU32(bytes, eocd + 16);
  const out = [];
  for (let i = 0; i < count; i++) {
    if (readU32(bytes, cursor) !== 0x02014b50) throw new Error("bad central signature");
    const nameLen = readU16(bytes, cursor + 28);
    const compSize = readU32(bytes, cursor + 20);
    const crc = readU32(bytes, cursor + 16);
    const localOffset = readU32(bytes, cursor + 42);
    const name = new TextDecoder().decode(
      bytes.subarray(cursor + 46, cursor + 46 + nameLen),
    );
    const localNameLen = readU16(bytes, localOffset + 26);
    const dataStart = localOffset + 30 + localNameLen;
    out.push({
      name,
      crc,
      data: bytes.slice(dataStart, dataStart + compSize),
    });
    cursor += 46 + nameLen;
  }
  return out;
};

// Tests -----------------------------------------------------------------------

test("crc32 reproduces the standard check vector", async () => {
  assert.equal(crc32(ascii("123456789")), 0xcbf43926);
});

test("crc32 is stable for arbitrary bytes and empty input", async () => {
  const buffer = new Uint8Array(1024);
  for (let i = 0; i < buffer.length; i++) buffer[i] = (i * 31 + 7) % 256;
  const first = crc32(buffer);
  const second = crc32(buffer);
  assert.equal(first, second);
  assert.notEqual(first, 0);
  assert.equal(crc32(new Uint8Array(0)), 0);
});

test("empty entry list is rejected", async () => {
  assert.throws(() => buildZip([]));
});

test("a single-file zip stores the payload verbatim", async () => {
  const payload = entry("a.png", 1);
  const bytes = new Uint8Array(buildZip([payload]));
  assert.equal(readU32(bytes, 0), 0x04034b50, "local header signature");
  assert.equal(readU16(bytes, 8), 0, "compression method must be store (0)");
  assert.equal(readU16(bytes, 26), payload.name.length, "file name length");
  const name = new TextDecoder().decode(bytes.subarray(30, 30 + payload.name.length));
  assert.equal(name, payload.name);
  const crc = readU32(bytes, 14);
  assert.equal(crc, crc32(payload.data), "CRC field matches payload crc32");
  assert.equal(readU32(bytes, 18), payload.data.length, "compressed size");
  assert.equal(readU32(bytes, 22), payload.data.length, "uncompressed size");
  const start = 30 + payload.name.length;
  assert.deepEqual(
    Array.from(bytes.slice(start, start + payload.data.length)),
    Array.from(payload.data),
    "payload embedded verbatim",
  );
});

test("a multi-file zip links local headers through a central directory", async () => {
  const ins = [entry("a.png", 1), entry("b.jpg", 2), entry("c.webp", 3)];
  const bytes = new Uint8Array(buildZip(ins));
  // Walk to the EOCD at the tail (no comment).
  const eocd = bytes.length - 22;
  assert.equal(readU32(bytes, eocd), 0x06054b50, "EOCD signature");
  assert.equal(readU16(bytes, eocd + 10), 3, "EOCD entry count");
  let cursor = readU32(bytes, eocd + 16);
  for (let i = 0; i < 3; i++) {
    assert.equal(readU32(bytes, cursor), 0x02014b50, `central entry ${i} signature`);
    const nameLen = readU16(bytes, cursor + 28);
    const name = new TextDecoder().decode(
      bytes.subarray(cursor + 46, cursor + 46 + nameLen),
    );
    assert.equal(name, ins[i].name, `central entry ${i} name`);
    const localOffset = readU32(bytes, cursor + 42);
    assert.equal(readU32(bytes, localOffset), 0x04034b50, `entry ${i} local offset target`);
    cursor += 46 + nameLen;
  }
});

test("a round-trip parse recovers the entries", async () => {
  const ins = [entry("a.png", 1), entry("b.jpg", 2), entry("c.webp", 3)];
  const bytes = new Uint8Array(buildZip(ins));
  const parsed = readZipEntries(bytes);
  assert.equal(parsed.length, ins.length);
  parsed.forEach((record, i) => {
    assert.equal(record.name, ins[i].name);
    assert.equal(record.crc, crc32(ins[i].data));
    assert.deepEqual(Array.from(record.data), Array.from(ins[i].data));
  });
});
