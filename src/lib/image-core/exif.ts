import type { PixelBuffer } from "./types.ts";

/**
 * Reads the EXIF Orientation tag (1-8) from a JPEG byte stream, or null when
 * the stream is not a JPEG, carries no EXIF APP1 segment, or has no valid
 * Orientation tag. Pure function over bytes — no DOM, throws nothing.
 */
export const readExifOrientation = (bytes: Uint8Array): number | null => {
  try {
    if (!bytes || bytes.length < 4) return null;
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null; // SOI
    let pos = 2;
    while (pos + 4 <= bytes.length) {
      if (bytes[pos] !== 0xff) return null;
      const marker = bytes[pos + 1];
      // Standalone markers without a length field.
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
        if (marker === 0xd8 || marker === 0xd9) return null;
        pos += 2;
        continue;
      }
      if (marker === 0xda) return null; // SOS: EXIF must appear before scan data
      const segLen = (bytes[pos + 2] << 8) | bytes[pos + 3];
      if (segLen < 2) return null;
      const segStart = pos + 4;
      if (marker === 0xe1 && segStart + 6 <= bytes.length) {
        const isExif =
          bytes[segStart] === 0x45 && bytes[segStart + 1] === 0x78 &&
          bytes[segStart + 2] === 0x69 && bytes[segStart + 3] === 0x66 &&
          bytes[segStart + 4] === 0x00 && bytes[segStart + 5] === 0x00;
        if (isExif) {
          return parseTiffOrientation(
            bytes.subarray(segStart + 6, Math.min(segStart + segLen - 2, bytes.length)),
          );
        }
      }
      pos = segStart + segLen - 2;
    }
    return null;
  } catch {
    return null;
  }
};

const parseTiffOrientation = (tiff: Uint8Array): number | null => {
  if (tiff.length < 8) return null;
  const le = tiff[0] === 0x49 && tiff[1] === 0x49; // "II"
  const be = tiff[0] === 0x4d && tiff[1] === 0x4d; // "MM"
  if (!le && !be) return null;
  const u16 = (o: number) =>
    le ? tiff[o] | (tiff[o + 1] << 8) : (tiff[o] << 8) | tiff[o + 1];
  const u32 = (o: number) =>
    le
      ? tiff[o] | (tiff[o + 1] << 8) | (tiff[o + 2] << 16) | (tiff[o + 3] << 24)
      : ((tiff[o] << 24) | (tiff[o + 1] << 16) | (tiff[o + 2] << 8) | tiff[o + 3]) >>> 0;
  if (u16(2) !== 0x2a) return null; // TIFF magic
  const ifd0 = u32(4);
  if (ifd0 < 8 || ifd0 + 2 > tiff.length) return null;
  const count = u16(ifd0);
  for (let e = 0; e < count; e++) {
    const off = ifd0 + 2 + e * 12;
    if (off + 12 > tiff.length) return null;
    if (u16(off) === 0x0112) {
      const v = u16(off + 8); // SHORT value lives in the first 2 bytes
      return v >= 1 && v <= 8 ? v : null;
    }
  }
  return null;
};

/**
 * Applies an EXIF orientation (1-8) to pixel data: returns a new PixelBuffer
 * with pixels rotated/flipped so the image displays upright. Values outside
 * 1-8 (and 1 itself) return an untouched copy. Pure function, ImageData in,
 * ImageData out.
 */
export const applyExifOrientation = (
  input: PixelBuffer,
  orientation: number,
): PixelBuffer => {
  const { width: w, height: h, data } = input;
  const copy = (): PixelBuffer => ({
    width: w,
    height: h,
    data: new Uint8ClampedArray(data),
  });
  const o = orientation | 0;
  if (o < 2 || o > 8) return copy();

  const swap = o === 5 || o === 6 || o === 7 || o === 8;
  const ow = swap ? h : w;
  const oh = swap ? w : h;
  const out: PixelBuffer = {
    width: ow,
    height: oh,
    data: new Uint8ClampedArray(ow * oh * 4),
  };
  // For each output pixel, compute its source pixel per EXIF mapping.
  for (let oy = 0; oy < oh; oy++) {
    for (let ox = 0; ox < ow; ox++) {
      let sx: number;
      let sy: number;
      switch (o) {
        case 2: sx = w - 1 - ox; sy = oy; break; // mirror horizontal
        case 3: sx = w - 1 - ox; sy = h - 1 - oy; break; // rotate 180
        case 4: sx = ox; sy = h - 1 - oy; break; // mirror vertical
        case 5: sx = oy; sy = ox; break; // transpose
        case 6: sx = oy; sy = h - 1 - ox; break; // rotate 90 CW
        case 7: sx = w - 1 - oy; sy = h - 1 - ox; break; // transverse
        default: sx = w - 1 - oy; sy = ox; break; // 8: rotate 90 CCW
      }
      const si = (sy * w + sx) * 4;
      const di = (oy * ow + ox) * 4;
      out.data[di] = data[si];
      out.data[di + 1] = data[si + 1];
      out.data[di + 2] = data[si + 2];
      out.data[di + 3] = data[si + 3];
    }
  }
  return out;
};
