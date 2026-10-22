import type { PixelBuffer } from "./types";

export type PreflightOptions = {
  minSubjectRatio?: number;
  minDimension?: number;
};

export type BoundingBox = { x0: number; y0: number; x1: number; y1: number };

export type PreflightCheck = {
  id: "subject-ratio" | "dimension";
  label: string;
  passed: boolean;
  detail: string;
};

export type PreflightReport = {
  width: number;
  height: number;
  subjectRatio: number;
  boundingBox: BoundingBox | null;
  checks: PreflightCheck[];
};

const CHANNELS = 4;
const BORDER_BAND_PX = 2;
const DEFAULT_MIN_SUBJECT_RATIO = 0.85;
const DEFAULT_MIN_DIMENSION = 1000;

type RGB = [number, number, number];

const readPixel = (data: Uint8ClampedArray, index: number): RGB => [
  data[index],
  data[index + 1],
  data[index + 2],
];

const colorDistance = (a: RGB, b: RGB): number => {
  const dr = (a[0] - b[0]) / 255;
  const dg = (a[1] - b[1]) / 255;
  const db = (a[2] - b[2]) / 255;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

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

// Tolerance for "same colour as background": same default as F01.
const BACKGROUND_TOLERANCE = 0.15;

const isForeground = (
  input: PixelBuffer,
  background: RGB,
  tolerance: number,
): Uint8Array => {
  const { width, height, data } = input;
  const total = width * height;
  const foreground = new Uint8Array(total);
  for (let index = 0; index < total; index++) {
    const rgb = readPixel(data, index * CHANNELS);
    if (colorDistance(rgb, background) > tolerance) foreground[index] = 1;
  }
  return foreground;
};

const largestRegionBoundingBox = (
  foreground: Uint8Array,
  width: number,
  height: number,
): BoundingBox | null => {
  const total = width * height;
  const visited = new Uint8Array(total);
  let best: { box: BoundingBox; area: number } | null = null;
  const queue: number[] = [];
  for (let start = 0; start < total; start++) {
    if (!foreground[start] || visited[start]) continue;
    queue.length = 0;
    queue.push(start);
    visited[start] = 1;
    let x0 = width;
    let y0 = height;
    let x1 = 0;
    let y1 = 0;
    let area = 0;
    for (let head = 0; head < queue.length; head++) {
      const index = queue[head];
      const x = index % width;
      const y = (index / width) | 0;
      area++;
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
      const neighbours4 = [1, -1, width, -width];
      for (const offset of neighbours4) {
        if (offset === 1 && x === width - 1) continue;
        if (offset === -1 && x === 0) continue;
        if (offset === width && y === height - 1) continue;
        if (offset === -width && y === 0) continue;
        const ni = index + offset;
        if (ni < 0 || ni >= total) continue;
        if (visited[ni] || !foreground[ni]) continue;
        visited[ni] = 1;
        queue.push(ni);
      }
    }
    if (!best || area > best.area) best = { box: { x0, y0, x1, y1 }, area };
  }
  return best ? best.box : null;
};

export const checkPreflight = (
  input: PixelBuffer,
  options: PreflightOptions = {},
): PreflightReport => {
  const { width, height } = input;
  const minSubjectRatio = options.minSubjectRatio ?? DEFAULT_MIN_SUBJECT_RATIO;
  const minDimension = options.minDimension ?? DEFAULT_MIN_DIMENSION;

  const background = estimateBackground(input);
  const foreground = isForeground(input, background, BACKGROUND_TOLERANCE);
  const boundingBox = largestRegionBoundingBox(foreground, width, height);

  const boxArea =
    boundingBox ? (boundingBox.x1 - boundingBox.x0 + 1) * (boundingBox.y1 - boundingBox.y0 + 1) : 0;
  const subjectRatio = boundingBox ? boxArea / (width * height) : 0;

  const minSide = Math.min(width, height);
  const checks: PreflightCheck[] = [
    {
      id: "subject-ratio",
      label: "Subject-to-canvas ratio",
      passed: subjectRatio >= minSubjectRatio,
      detail: boundingBox
        ? `Subject fills ${(subjectRatio * 100).toFixed(1)}% of the canvas (minimum ${(minSubjectRatio * 100).toFixed(0)}%).`
        : "No subject detected against the background.",
    },
    {
      id: "dimension",
      label: "Minimum dimension",
      passed: minSide >= minDimension,
      detail: `Shortest side is ${minSide}px (minimum ${minDimension}px).`,
    },
  ];

  return { width, height, subjectRatio, boundingBox, checks };
};
