import type { PixelBuffer } from "./types";

export type ResizeToPresetOptions = {
  width: number;
  height: number;
  background?: [number, number, number];
};

const DEFAULT_BACKGROUND: [number, number, number] = [255, 255, 255];
const CHANNELS = 4;

const sampleBilinear = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  channel: number,
): number => {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);
  const fx = x - x0;
  const fy = y - y0;
  const at = (px: number, py: number): number =>
    data[(py * width + px) * CHANNELS + channel];
  const top = at(x0, y0) * (1 - fx) + at(x1, y0) * fx;
  const bottom = at(x0, y1) * (1 - fx) + at(x1, y1) * fx;
  return top * (1 - fy) + bottom * fy;
};

export const resizeToPreset = (
  input: PixelBuffer,
  options: ResizeToPresetOptions,
): PixelBuffer => {
  const { width, height, data } = input;
  const { width: targetW, height: targetH } = options;
  const background = options.background ?? DEFAULT_BACKGROUND;
  const out = new Uint8ClampedArray(targetW * targetH * CHANNELS);
  for (let index = 0; index < targetW * targetH; index++) {
    for (let c = 0; c < 3; c++) out[index * CHANNELS + c] = background[c];
    out[index * CHANNELS + 3] = 255;
  }
  if (targetW <= 0 || targetH <= 0 || width === 0 || height === 0) {
    return { width: targetW, height: targetH, data: out };
  }
  const scale = Math.min(targetW / width, targetH / height);
  const drawnW = Math.max(1, Math.round(width * scale));
  const drawnH = Math.max(1, Math.round(height * scale));
  const offsetX = Math.floor((targetW - drawnW) / 2);
  const offsetY = Math.floor((targetH - drawnH) / 2);
  const xRatio = width / drawnW;
  const yRatio = height / drawnH;
  for (let dy = 0; dy < drawnH; dy++) {
    const srcY = Math.min(height - 1, (dy + 0.5) * yRatio - 0.5);
    const clampedY = Math.max(0, srcY);
    for (let dx = 0; dx < drawnW; dx++) {
      const srcX = Math.max(0, Math.min(width - 1, (dx + 0.5) * xRatio - 0.5));
      const destIndex = ((dy + offsetY) * targetW + (dx + offsetX)) * CHANNELS;
      // alpha-weighted colour sampling: transparent neighbours don't darken
      const a = sampleBilinear(data, width, height, srcX, clampedY, 3) / 255;
      if (a <= 0) {
        out[destIndex] = background[0];
        out[destIndex + 1] = background[1];
        out[destIndex + 2] = background[2];
        out[destIndex + 3] = 255;
        continue;
      }
      for (let c = 0; c < 3; c++) {
        const colour = sampleBilinear(data, width, height, srcX, clampedY, c);
        const blended = a < 1 ? colour * a + background[c] * (1 - a) : colour;
        out[destIndex + c] = Math.round(blended);
      }
      out[destIndex + 3] = 255;
    }
  }
  return { width: targetW, height: targetH, data: out };
};
