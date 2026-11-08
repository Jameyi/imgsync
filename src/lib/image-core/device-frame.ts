import type { PixelBuffer } from "./types.ts";
import { insideRoundedRect, type Rgb } from "./frame.ts";

export type { Rgb };

export type DeviceFrameOptions = {
  /** Shell thickness in pixels around the screen (0 = bare clipped screen). */
  bezelWidth?: number;
  bezelColor?: Rgb;
  /** Corner radius of the screen; the shell's outer radius is this + bezel. */
  screenRadius?: number;
  /** Transparent canvas margin around the device. */
  padding?: number;
  /** Canvas fill behind everything; null keeps transparency. */
  background?: Rgb | null;
};

/**
 * Wraps a screenshot in a device shell drawn from pure geometry — no asset
 * files: a rounded-rect shell ring (outer radius = screenRadius + bezel),
 * the screen pasted inside it clipped to its own radius (clipped screen
 * corners reveal the shell, like a real device), on a padded canvas.
 * Pure function: PixelBuffer in, PixelBuffer out, zero DOM.
 */
export const frameDevice = (
  input: PixelBuffer,
  options: DeviceFrameOptions = {},
): PixelBuffer => {
  const bezel = Math.max(0, Math.floor(options.bezelWidth ?? 0));
  const screenRadius = Math.max(0, Math.floor(options.screenRadius ?? 0));
  const padding = Math.max(0, Math.floor(options.padding ?? 0));
  const iw = input.width;
  const ih = input.height;
  const w = iw + bezel * 2 + padding * 2;
  const h = ih + bezel * 2 + padding * 2;
  const out: PixelBuffer = {
    width: w,
    height: h,
    data: new Uint8ClampedArray(w * h * 4),
  };

  // 1. background fill.
  const bg = options.background ?? null;
  if (bg) {
    for (let i = 0; i < w * h; i++) {
      const j = i * 4;
      out.data[j] = bg.r;
      out.data[j + 1] = bg.g;
      out.data[j + 2] = bg.b;
      out.data[j + 3] = 255;
    }
  }

  // 2. shell ring: rounded rect spanning the screen plus the bezel.
  const shellX = padding;
  const shellY = padding;
  const shellW = iw + bezel * 2;
  const shellH = ih + bezel * 2;
  const shellRadius = screenRadius + bezel;
  const shellColor = options.bezelColor;
  if (bezel > 0 && shellColor) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!insideRoundedRect(x, y, shellX, shellY, shellW, shellH, shellRadius)) {
          continue;
        }
        const i = (y * w + x) * 4;
        out.data[i] = shellColor.r;
        out.data[i + 1] = shellColor.g;
        out.data[i + 2] = shellColor.b;
        out.data[i + 3] = 255;
      }
    }
  }

  // 3. paste the screen, clipped to its own radius, centered in the shell.
  const ox = padding + bezel;
  const oy = padding + bezel;
  for (let y = 0; y < ih; y++) {
    for (let x = 0; x < iw; x++) {
      if (!insideRoundedRect(x, y, 0, 0, iw, ih, screenRadius)) continue;
      const si = (y * iw + x) * 4;
      const di = ((y + oy) * w + (x + ox)) * 4;
      const sa = input.data[si + 3] / 255;
      const da = out.data[di + 3] / 255;
      const ao = sa + da * (1 - sa);
      if (ao === 0) continue;
      for (let c = 0; c < 3; c++) {
        out.data[di + c] = Math.round(
          (input.data[si + c] * sa + out.data[di + c] * da * (1 - sa)) / ao,
        );
      }
      out.data[di + 3] = Math.round(ao * 255);
    }
  }
  return out;
};
