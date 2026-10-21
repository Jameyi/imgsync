import type { PixelBuffer } from "./types";

const CHANNELS = 4;
const WHITE = 255;

const isEdgeBand = (
  index: number,
  width: number,
  height: number,
  data: Uint8ClampedArray,
): boolean => {
  const alpha = data[index * CHANNELS + 3];
  if (alpha === 0 || alpha === 255) return false;
  const x = index % width;
  const y = (index / width) | 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (data[(ny * width + nx) * CHANNELS + 3] === 0) return true;
    }
  }
  return false;
};

const unmixWhite = (
  observed: number,
  alpha: number,
): number => {
  const a = alpha / 255;
  const fg = (observed - WHITE * (1 - a)) / a;
  return Math.max(0, Math.min(255, Math.round(fg)));
};

export const defringeEdges = (input: PixelBuffer): PixelBuffer => {
  const { width, height, data } = input;
  const out = new Uint8ClampedArray(data);
  const total = width * height;
  for (let index = 0; index < total; index++) {
    if (!isEdgeBand(index, width, height, data)) continue;
    const alpha = data[index * CHANNELS + 3];
    for (let c = 0; c < 3; c++) {
      out[index * CHANNELS + c] = unmixWhite(data[index * CHANNELS + c], alpha);
    }
  }
  return { width, height, data: out };
};
