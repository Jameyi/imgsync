import type { PixelBuffer } from "./types.ts";

export type SplitLayersOptions = {
  /** Max per-channel distance from the estimated background color. */
  tolerance?: number;
};

export type SplitLayersResult = {
  /** Foreground cutout: subject pixels opaque, background pixels alpha 0. */
  subject: PixelBuffer;
  /** Full copy of the original image (background preserved). */
  background: PixelBuffer;
};

const DEFAULT_TOLERANCE = 60;

const colorDistance = (
  a: Uint8ClampedArray,
  b: readonly [number, number, number],
  i: number,
): number =>
  Math.max(
    Math.abs(a[i] - b[0]),
    Math.abs(a[i + 1] - b[1]),
    Math.abs(a[i + 2] - b[2]),
  );

/**
 * Estimates the background color from the four image borders (median of
 * border samples) — same approach as white-to-transparent's background
 * estimation, generalized to any dominant backdrop color.
 */
const estimateBackground = (image: PixelBuffer): [number, number, number] => {
  const { width, height, data } = image;
  const samples: number[][] = [];
  const push = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    samples.push([data[i], data[i + 1], data[i + 2]]);
  };
  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }
  const channel = (index: number) => {
    const values = samples.map((s) => s[index]).sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)];
  };
  return [channel(0), channel(1), channel(2)];
};

/**
 * Flood-fills from the borders collecting pixels within tolerance of the
 * background color; returns a boolean "is background" map.
 */
const segmentBackground = (
  image: PixelBuffer,
  backgroundColor: [number, number, number],
  tolerance: number,
): boolean[] => {
  const { width, height, data } = image;
  const isBackground = new Array<boolean>(width * height).fill(false);
  const queue: number[] = [];

  // `pixel` is a pixel index; colorDistance reads from the byte offset.
  const matches = (pixel: number): boolean =>
    colorDistance(data, backgroundColor, pixel * 4) <= tolerance;

  // Seed: all border pixels that match the background color.
  for (let x = 0; x < width; x++) {
    if (matches(x)) { isBackground[x] = true; queue.push(x); }
    const bottom = (height - 1) * width + x;
    if (matches(bottom) && !isBackground[bottom]) { isBackground[bottom] = true; queue.push(bottom); }
  }
  for (let y = 0; y < height; y++) {
    const left = y * width;
    if (matches(left) && !isBackground[left]) { isBackground[left] = true; queue.push(left); }
    const right = y * width + width - 1;
    if (matches(right) && !isBackground[right]) { isBackground[right] = true; queue.push(right); }
  }

  while (queue.length > 0) {
    const index = queue.pop()!;
    const x = index % width;
    const y = Math.floor(index / width);
    const neighbors = [
      x > 0 ? index - 1 : -1,
      x < width - 1 ? index + 1 : -1,
      y > 0 ? index - width : -1,
      y < height - 1 ? index + width : -1,
    ];
    for (const neighbor of neighbors) {
      if (neighbor === -1 || isBackground[neighbor]) continue;
      if (matches(neighbor)) {
        isBackground[neighbor] = true;
        queue.push(neighbor);
      }
    }
  }
  return isBackground;
};

/**
 * Splits one image into a subject layer (foreground cutout with alpha) and
 * a background layer (full original copy). Pure function: ImageData in,
 * two PixelBuffers out, zero DOM.
 */
export const splitLayers = (
  image: PixelBuffer,
  options: SplitLayersOptions = {},
): SplitLayersResult => {
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
  const backgroundColor = estimateBackground(image);
  const isBackground = segmentBackground(image, backgroundColor, tolerance);

  const subject: PixelBuffer = {
    width: image.width,
    height: image.height,
    data: new Uint8ClampedArray(image.data.length),
  };
  for (let p = 0; p < image.width * image.height; p++) {
    const i = p * 4;
    if (!isBackground[p]) {
      subject.data[i] = image.data[i];
      subject.data[i + 1] = image.data[i + 1];
      subject.data[i + 2] = image.data[i + 2];
      subject.data[i + 3] = 255;
    } // else stays zeroed (transparent)
  }

  return { subject, background: image };
};
