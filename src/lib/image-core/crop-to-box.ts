import type { PixelBuffer } from "./types";

export type CropBox = { x0: number; y0: number; x1: number; y1: number };

const CHANNELS = 4;

export const cropToBox = (input: PixelBuffer, box: CropBox): PixelBuffer => {
  const { width, height, data } = input;
  const x0 = Math.max(0, Math.min(Math.floor(box.x0), Math.floor(box.x1), width - 1));
  const y0 = Math.max(0, Math.min(Math.floor(box.y0), Math.floor(box.y1), height - 1));
  const x1 = Math.min(width - 1, Math.max(Math.ceil(box.x0), Math.ceil(box.x1)));
  const y1 = Math.min(height - 1, Math.max(Math.ceil(box.y0), Math.ceil(box.y1)));
  const outW = Math.max(1, x1 - x0 + 1);
  const outH = Math.max(1, y1 - y0 + 1);
  const out = new Uint8ClampedArray(outW * outH * CHANNELS);
  for (let row = 0; row < outH; row++) {
    const srcStart = ((y0 + row) * width + x0) * CHANNELS;
    const rowBytes = outW * CHANNELS;
    out.set(data.subarray(srcStart, srcStart + rowBytes), row * rowBytes);
  }
  return { width: outW, height: outH, data: out };
};
