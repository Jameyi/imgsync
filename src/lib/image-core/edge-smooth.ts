import type { PixelBuffer } from "./types.ts";

export type SmoothEdgesOptions = {
  /** Number of 3×3 box-filter passes over the alpha channel (1-4). */
  passes?: number;
};

/**
 * Shared alpha-channel box filter: averages a standalone alpha map with a
 * 3×3 kernel per pass. Also used by the frame module for shadow silhouettes.
 */
export const blurAlphaValues = (
  values: Uint8Array,
  w: number,
  h: number,
  passes = 1,
): Uint8Array => {
  let src = Uint8Array.from(values);
  for (let p = 0; p < passes; p++) {
    const dst = new Uint8Array(src);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;
            sum += src[ny * w + nx];
            count++;
          }
        }
        dst[y * w + x] = Math.round(sum / count);
      }
    }
    src = dst;
  }
  return src;
};

/**
 * Softens jagged transparency edges by averaging the alpha channel with a
 * 3×3 box filter; RGB bytes are carried over untouched. Pixels far from any
 * boundary sit in constant-alpha regions, so the average reproduces their
 * exact value — only the boundary staircase becomes a gradient. Pure
 * function: PixelBuffer in, PixelBuffer out, zero DOM.
 */
export const smoothAlphaEdges = (
  input: PixelBuffer,
  options: SmoothEdgesOptions = {},
): PixelBuffer => {
  const passes = Math.max(0, Math.min(4, Math.floor(options.passes ?? 1)));
  const { width: w, height: h } = input;
  const out: PixelBuffer = {
    width: w,
    height: h,
    data: new Uint8ClampedArray(input.data),
  };
  if (passes === 0) return out;
  const alphas = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) alphas[i] = input.data[i * 4 + 3];
  const smoothed = blurAlphaValues(alphas, w, h, passes);
  for (let i = 0; i < w * h; i++) out.data[i * 4 + 3] = smoothed[i];
  return out;
};
