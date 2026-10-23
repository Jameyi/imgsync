import type { PixelBuffer } from "./types";

export type WhiteToTransparentOptions = {
  tolerance?: number;
};

const DEFAULT_TOLERANCE = 0.15;
const BORDER_BAND_PX = 2;
const CHANNELS = 4;

type RGB = [number, number, number];

const colorDistance = (a: RGB, b: RGB): number => {
  const dr = (a[0] - b[0]) / 255;
  const dg = (a[1] - b[1]) / 255;
  const db = (a[2] - b[2]) / 255;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

const readPixel = (data: Uint8ClampedArray, index: number): RGB => [
  data[index],
  data[index + 1],
  data[index + 2],
];

const isBorder = (x: number, y: number, width: number, height: number): boolean =>
  x < BORDER_BAND_PX ||
  y < BORDER_BAND_PX ||
  x >= width - BORDER_BAND_PX ||
  y >= height - BORDER_BAND_PX;

const estimateBackground = (input: PixelBuffer): RGB => {
  const { width, height, data } = input;
  const bucket: number[][] = [[], [], []];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isBorder(x, y, width, height)) continue;
      const rgb = readPixel(data, (y * width + x) * CHANNELS);
      for (let c = 0; c < 3; c++) bucket[c].push(rgb[c]);
    }
  }
  const medianFor = (channel: number[]): number => {
    channel.sort((a, b) => a - b);
    return channel[channel.length >> 1];
  };
  return [medianFor(bucket[0]), medianFor(bucket[1]), medianFor(bucket[2])];
};

const segmentBackground = (
  input: PixelBuffer,
  background: RGB,
  tolerance: number,
): Uint8Array => {
  const { width, height, data } = input;
  const total = width * height;
  const isBackground = new Uint8Array(total);
  const queue: number[] = [];
  const enqueue = (index: number): void => {
    if (isBackground[index]) return;
    const rgb = readPixel(data, index * CHANNELS);
    if (colorDistance(rgb, background) > tolerance) return;
    isBackground[index] = 1;
    queue.push(index);
  };
  for (let x = 0; x < width; x++) enqueue(x);
  for (let x = 0; x < width; x++) enqueue((height - 1) * width + x);
  for (let y = 0; y < height; y++) enqueue(y * width);
  for (let y = 0; y < height; y++) enqueue(y * width + width - 1);
  const neighbours4 = [1, -1, width, -width];
  for (let head = 0; head < queue.length; head++) {
    const index = queue[head];
    const x = index % width;
    const y = (index / width) | 0;
    for (const offset of neighbours4) {
      if (offset === 1 && x === width - 1) continue;
      if (offset === -1 && x === 0) continue;
      if (offset === width && y === height - 1) continue;
      if (offset === -width && y === 0) continue;
      enqueue(index + offset);
    }
  }
  return isBackground;
};

const touchesBackground = (
  index: number,
  width: number,
  height: number,
  isBackground: Uint8Array,
): boolean => {
  const x = index % width;
  const y = (index / width) | 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      if (isBackground[ny * width + nx]) return true;
    }
  }
  return false;
};

const solveAlpha = (
  input: PixelBuffer,
  background: RGB,
  index: number,
  isBackground: Uint8Array,
): number => {
  const centerRgb = readPixel(input.data, index * CHANNELS);
  const centerDistance = colorDistance(centerRgb, background);
  const { width, height, data } = input;
  const x = index % width;
  const y = (index / width) | 0;
  let foregroundDistance = centerDistance;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const ni = ny * width + nx;
      if (isBackground[ni]) continue;
      const rgb = readPixel(data, ni * CHANNELS);
      const distance = colorDistance(rgb, background);
      if (distance > foregroundDistance) foregroundDistance = distance;
    }
  }
  if (foregroundDistance === 0) return 255;
  const ratio = centerDistance / foregroundDistance;
  return Math.max(0, Math.min(255, Math.round(ratio * 255)));
};

export const whiteToTransparent = (
  input: PixelBuffer,
  options: WhiteToTransparentOptions = {},
): PixelBuffer => {
  const { width, height, data } = input;
  const background = estimateBackground(input);
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
  const isBackground = segmentBackground(input, background, tolerance);
  const out = new Uint8ClampedArray(data);
  for (let index = 0; index < width * height; index++) {
    let alpha = 255;
    if (isBackground[index]) {
      alpha = 0;
    } else if (touchesBackground(index, width, height, isBackground)) {
      alpha = solveAlpha(input, background, index, isBackground);
    }
    out[index * CHANNELS + 3] = alpha;
  }
  return { width, height, data: out };
};
