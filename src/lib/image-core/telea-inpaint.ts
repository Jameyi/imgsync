import type { PixelBuffer } from "./types.ts";

/** Binary mask: 0 = keep, 255 = erase (PRD B.1 MaskData). */
export type MaskData = {
  width: number;
  height: number;
  data: Uint8Array;
};

export type InpaintOptions = {
  /** Telea band radius in pixels. */
  radius?: number;
};

const DEFAULT_RADIUS = 5;

/**
 * Erases masked pixels and fills them from surrounding known pixels
 * (Telea-style FMM approximation, small-region tier per PRD B.1): mask
 * boundary marches inward layer by layer; each pixel takes an
 * inverse-distance-weighted average of known pixels within the radius
 * window. Pure function: PixelBuffer in, PixelBuffer out, zero DOM.
 * Async signature per the frozen seam — the Worker tier wraps this later.
 */
export const inpaintFill = (
  input: PixelBuffer,
  mask: MaskData,
  options: InpaintOptions = {},
): Promise<PixelBuffer> => {
  const radius = options.radius ?? DEFAULT_RADIUS;
  const { width, height } = input;
  const out: PixelBuffer = {
    width,
    height,
    data: new Uint8ClampedArray(input.data),
  };

  const unknown = new Uint8Array(width * height);
  let hasUnknown = false;
  for (let p = 0; p < mask.data.length; p++) {
    if (mask.data[p] !== 0) {
      unknown[p] = 1;
      hasUnknown = true;
    }
  }
  if (!hasUnknown) return Promise.resolve(out);

  const filled = new Uint8Array(width * height);
  for (let p = 0; p < unknown.length; p++) filled[p] = unknown[p] ? 0 : 1;

  // March inward: fill unknown pixels that touch the known frontier.
  let remaining = true;
  while (remaining) {
    remaining = false;
    const newlyKnown: number[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = y * width + x;
        if (!unknown[p] || filled[p]) continue;
        const i = p * 4;
        let wr = 0;
        let wg = 0;
        let wb = 0;
        let wsum = 0;
        for (let dy = -radius; dy <= radius; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= width) continue;
            const q = ny * width + nx;
            if (!filled[q]) continue;
            // Skip original masked pixels until they are actually filled.
            if (unknown[q] && !filled[q]) continue;
            const d2 = dx * dx + dy * dy;
            if (d2 === 0 || d2 > radius * radius) continue;
            const w = 1 / Math.sqrt(d2);
            const j = q * 4;
            wr += w * out.data[j];
            wg += w * out.data[j + 1];
            wb += w * out.data[j + 2];
            wsum += w;
          }
        }
        if (wsum === 0) {
          remaining = true; // no known neighbor yet — try next layer
          continue;
        }
        out.data[i] = Math.round(wr / wsum);
        out.data[i + 1] = Math.round(wg / wsum);
        out.data[i + 2] = Math.round(wb / wsum);
        newlyKnown.push(p);
      }
    }
    for (const p of newlyKnown) filled[p] = 1;
    // Guard against a stuck pass (e.g. full mask with no known source).
    if (newlyKnown.length === 0 && remaining) {
      // No progress possible; stop (full-mask edge case keeps input values).
      break;
    }
  }

  return Promise.resolve(out);
};
