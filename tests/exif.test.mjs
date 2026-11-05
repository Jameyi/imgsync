// BDD (Gherkin) — F04/F05 Format Convert: EXIF orientation parsing + pixel rotation
//
// Feature: auto-straighten phone photos and convert between image formats
//   As an e-commerce seller or content creator uploading phone photos
//   I want the tool to read the EXIF orientation and rotate pixels accordingly
//   So that converted images come out upright without an editor
//
// Scenario: JPEG EXIF Orientation tag is extracted (PRD F05)
//   Given a minimal JPEG byte stream containing an EXIF APP1 segment with Orientation = 6
//   When readExifOrientation is called with those bytes
//   Then it returns 6
//
// Scenario: JPEG without EXIF returns null
//   Given a JPEG byte stream with an APP1 segment that has no Orientation tag
//   When readExifOrientation is called
//   Then it returns null
//
// Scenario: non-JPEG bytes return null without throwing
//   Given a PNG-signature byte stream
//   And a truncated garbage byte stream
//   When readExifOrientation is called with each
//   Then both return null and no exception is raised
//
// Scenario: orientation 1 is an identity transform
//   Given a 2x3 image with distinct per-pixel colors and orientation = 1
//   When applyExifOrientation is called
//   Then the output equals the input pixel-for-pixel with the same dimensions
//
// Scenario: orientation 3 rotates the image 180 degrees
//   Given a 2x3 image with distinct per-pixel colors and orientation = 3
//   When applyExifOrientation is called
//   Then the output has the same dimensions
//   And output pixel (x, y) equals input pixel (W-1-x, H-1-y)
//
// Scenario: orientation 6 swaps width and height (90 degrees CW)
//   Given a 2x3 image with distinct per-pixel colors and orientation = 6
//   When applyExifOrientation is called
//   Then the output is 3 wide and 2 high
//   And the original top-left corner lands at the new top-right corner
//
// Scenario: orientation 8 swaps width and height (90 degrees CCW)
//   Given a 2x3 image with distinct per-pixel colors and orientation = 8
//   When applyExifOrientation is called
//   Then the output is 3 wide and 2 high
//   And the original top-left corner lands at the new bottom-left corner
//
// Scenario: unknown orientation values fall back to identity
//   Given a 2x3 image and orientation = 0 (and also 9)
//   When applyExifOrientation is called with each
//   Then the output equals the input pixel-for-pixel

import test from "node:test";
import assert from "node:assert/strict";
import {
  readExifOrientation,
  applyExifOrientation,
} from "../src/lib/image-core/exif.ts";

// Helpers ---------------------------------------------------------------------

const solidImage = (width, height) => {
  // Distinct color per pixel: R = index, G = 2*index mod 256, B = 255 - index.
  const data = new Uint8ClampedArray(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    data[i] = p % 256;
    data[i + 1] = (2 * p) % 256;
    data[i + 2] = 255 - (p % 256);
    data[i + 3] = 255;
  }
  return { width, height, data };
};

// Minimal JPEG byte stream: SOI + APP1("Exif\0\0" + TIFF/LE + IFD0 with a
// single Orientation SHORT entry) + EOI.
const jpegWithExif = (orientation) => {
  const ifd = new Uint8Array(18);
  ifd[0] = 0x01; ifd[1] = 0x00; // 1 entry
  ifd[2] = 0x12; ifd[3] = 0x01; // tag 0x0112 (Orientation)
  ifd[4] = 0x03; ifd[5] = 0x00; // type SHORT
  ifd[6] = 0x01; // count 1
  ifd[10] = orientation & 0xff; // value in first 2 bytes of the value field
  const tiff = new Uint8Array(8 + ifd.length);
  tiff[0] = 0x49; tiff[1] = 0x49; // "II" (little-endian)
  tiff[2] = 0x2a; tiff[3] = 0x00;
  tiff[4] = 0x08; tiff[7] = 0x00; // IFD0 offset = 8
  tiff.set(ifd, 8);
  const payload = new Uint8Array(6 + tiff.length);
  payload.set([0x45, 0x78, 0x69, 0x66, 0x00, 0x00], 0); // "Exif\0\0"
  payload.set(tiff, 6);
  const segLen = payload.length + 2;
  const jpeg = new Uint8Array(4 + 2 + payload.length + 2);
  jpeg[0] = 0xff; jpeg[1] = 0xd8; // SOI
  jpeg[2] = 0xff; jpeg[3] = 0xe1; // APP1
  jpeg[4] = (segLen >> 8) & 0xff; jpeg[5] = segLen & 0xff;
  jpeg.set(payload, 6);
  jpeg[jpeg.length - 2] = 0xff; jpeg[jpeg.length - 1] = 0xd9; // EOI
  return jpeg;
};

const pixelAt = (img, x, y) => {
  const i = (y * img.width + x) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
};

// Tests -----------------------------------------------------------------------

test("JPEG EXIF Orientation tag is extracted", async () => {
  const bytes = jpegWithExif(6);
  assert.equal(await readExifOrientation(bytes), 6);
});

test("JPEG without EXIF Orientation returns null", async () => {
  // APP1/Exif present, but IFD0 has zero entries.
  const tiff = new Uint8Array(10);
  tiff[0] = 0x49; tiff[1] = 0x49;
  tiff[2] = 0x2a; tiff[3] = 0x00;
  tiff[4] = 0x08; tiff[7] = 0x00;
  tiff[8] = 0x00; tiff[9] = 0x00; // 0 entries
  const payload = new Uint8Array(6 + tiff.length);
  payload.set([0x45, 0x78, 0x69, 0x66, 0x00, 0x00], 0);
  payload.set(tiff, 6);
  const segLen = payload.length + 2;
  const jpeg = new Uint8Array(4 + 2 + payload.length + 2);
  jpeg[0] = 0xff; jpeg[1] = 0xd8;
  jpeg[2] = 0xff; jpeg[3] = 0xe1;
  jpeg[4] = (segLen >> 8) & 0xff; jpeg[5] = segLen & 0xff;
  jpeg.set(payload, 6);
  assert.equal(await readExifOrientation(jpeg), null);
});

test("non-JPEG and truncated bytes return null without throwing", async () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const garbage = new Uint8Array([0x01, 0x02, 0x03]);
  assert.equal(await readExifOrientation(png), null);
  assert.equal(await readExifOrientation(garbage), null);
});

test("orientation 1 is an identity transform", async () => {
  const image = solidImage(2, 3);
  const out = await applyExifOrientation(image, 1);
  assert.equal(out.width, 2);
  assert.equal(out.height, 3);
  assert.deepEqual(out.data, image.data);
});

test("orientation 3 rotates the image 180 degrees", async () => {
  const image = solidImage(2, 3);
  const out = await applyExifOrientation(image, 3);
  assert.equal(out.width, 2);
  assert.equal(out.height, 3);
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 2; x++) {
      assert.deepEqual(
        pixelAt(out, x, y),
        pixelAt(image, 1 - x, 2 - y),
        `out(${x},${y}) should be in(${1 - x},${2 - y})`,
      );
    }
  }
});

test("orientation 6 swaps width and height (90 degrees CW)", async () => {
  const image = solidImage(2, 3);
  const out = await applyExifOrientation(image, 6);
  assert.equal(out.width, 3);
  assert.equal(out.height, 2);
  // Stored (sx, sy) lands at output (2 - sy, sx); top-left → top-right.
  for (let sy = 0; sy < 3; sy++) {
    for (let sx = 0; sx < 2; sx++) {
      assert.deepEqual(
        pixelAt(out, 2 - sy, sx),
        pixelAt(image, sx, sy),
        `in(${sx},${sy}) should land at out(${2 - sy},${sx})`,
      );
    }
  }
  assert.deepEqual(pixelAt(out, 2, 0), pixelAt(image, 0, 0));
});

test("orientation 8 swaps width and height (90 degrees CCW)", async () => {
  const image = solidImage(2, 3);
  const out = await applyExifOrientation(image, 8);
  assert.equal(out.width, 3);
  assert.equal(out.height, 2);
  // Stored (sx, sy) lands at output (sy, 1 - sx); top-left → bottom-left.
  for (let sy = 0; sy < 3; sy++) {
    for (let sx = 0; sx < 2; sx++) {
      assert.deepEqual(
        pixelAt(out, sy, 1 - sx),
        pixelAt(image, sx, sy),
        `in(${sx},${sy}) should land at out(${sy},${1 - sx})`,
      );
    }
  }
  assert.deepEqual(pixelAt(out, 0, 1), pixelAt(image, 0, 0));
});

test("unknown orientation values fall back to identity", async () => {
  const image = solidImage(2, 3);
  for (const orientation of [0, 9]) {
    const out = await applyExifOrientation(image, orientation);
    assert.equal(out.width, 2);
    assert.equal(out.height, 3);
    assert.deepEqual(out.data, image.data);
  }
});
