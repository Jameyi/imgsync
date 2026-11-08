import type { PixelBuffer } from "./types.ts";
import { blurAlphaValues } from "./edge-smooth.ts";

export type Rgb = { r: number; g: number; b: number };

export type FrameShadow = {
  color: Rgb;
  /** Box-filter passes over the silhouette alpha (0 = crisp shadow). */
  blurPasses?: number;
  offsetX?: number;
  offsetY?: number;
};

export type FrameOptions = {
  /** Corner radius in pixels (0 = square corners). */
  radius?: number;
  borderWidth?: number;
  borderColor?: Rgb;
  /** Transparent canvas margin around the image (room for the shadow). */
  padding?: number;
  shadow?: FrameShadow;
  /** Canvas fill behind the image; null keeps transparency. */
  background?: Rgb | null;
};

/**
 * Continuous-coordinate rounded-rect membership test for a pixel center:
 * true when (px, py) falls inside the rect (rectX, rectY, rectW, rectH)
 * with corner radius r. Shared by the frame and device-frame modules.
 */
export const insideRoundedRect = (
  px: number,
  py: number,
  rectX: number,
  rectY: number,
  rectW: number,
  rectH: number,
  r: number,
): boolean => {
  if (r <= 0) return true;
  const inCornerX = px < rectX + r || px >= rectX + rectW - r;
  const inCornerY = py < rectY + r || py >= rectY + rectH - r;
  if (!inCornerX || !inCornerY) return true;
  // Both circle centers use continuous coordinates (left/top at rect + r,
  // right/bottom at rect + size - r) so the tests agree even when r spans
  // half the rect width.
  const cx = px < rectX + r ? rectX + r : rectX + rectW - r;
  const cy = py < rectY + r ? rectY + r : rectY + rectH - r;
  const dx = px + 0.5 - cx;
  const dy = py + 0.5 - cy;
  return dx * dx + dy * dy <= r * r;
};

const isClipped = (x: number, y: number, iw: number, ih: number, r: number) =>
  !insideRoundedRect(x, y, 0, 0, iw, ih, r);

/** Source-over composite of one RGB layer with per-pixel alpha onto out. */
const compositeLayer = (
  out: PixelBuffer,
  color: Rgb,
  alpha: Uint8ClampedArray | Uint8Array,
) => {
  for (let i = 0; i < out.width * out.height; i++) {
    const sa = alpha[i] / 255;
    if (sa <= 0) continue;
    const j = i * 4;
    const da = out.data[j + 3] / 255;
    const ao = sa + da * (1 - sa);
    for (let c = 0; c < 3; c++) {
      out.data[j + c] = Math.round(
        (color[c === 0 ? "r" : c === 1 ? "g" : "b"] * sa +
          out.data[j + c] * da * (1 - sa)) /
          ao,
      );
    }
    out.data[j + 3] = Math.round(ao * 255);
  }
};

/**
 * Frames an image: pads the canvas (solid or transparent background), drops a
 * blurred-silhouette shadow, pastes the corner-clipped image, then strokes a
 * border ring that respects the corner clipping. Pure function: PixelBuffer
 * in, PixelBuffer out, zero DOM.
 */
export const frameImage = (
  input: PixelBuffer,
  options: FrameOptions = {},
): PixelBuffer => {
  const radius = Math.max(0, Math.floor(options.radius ?? 0));
  const borderWidth = Math.max(0, Math.floor(options.borderWidth ?? 0));
  const padding = Math.max(0, Math.floor(options.padding ?? 0));
  const iw = input.width;
  const ih = input.height;
  const w = iw + padding * 2;
  const h = ih + padding * 2;
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

  // 2. shadow: input silhouette stamped at the offset, then box-blurred.
  const shadow = options.shadow;
  if (shadow) {
    const alpha = new Uint8Array(w * h);
    const offX = padding + Math.floor(shadow.offsetX ?? 0);
    const offY = padding + Math.floor(shadow.offsetY ?? 0);
    for (let y = 0; y < ih; y++) {
      for (let x = 0; x < iw; x++) {
        const px = x + offX;
        const py = y + offY;
        if (px < 0 || py < 0 || px >= w || py >= h) continue;
        alpha[py * w + px] = input.data[(y * iw + x) * 4 + 3];
      }
    }
    const blurred = blurAlphaValues(alpha, w, h, Math.max(0, Math.min(4, Math.floor(shadow.blurPasses ?? 0))));
    compositeLayer(out, shadow.color, blurred);
  }

  // 3. paste the corner-clipped image (source-over).
  const ox = padding;
  const oy = padding;
  for (let y = 0; y < ih; y++) {
    for (let x = 0; x < iw; x++) {
      if (isClipped(x, y, iw, ih, radius)) continue;
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

  // 4. border ring on the image bounds, respecting corner clipping.
  if (borderWidth > 0 && options.borderColor) {
    const color = options.borderColor;
    // Mark pixels within borderWidth of the image edge.
    for (let y = 0; y < ih; y++) {
      for (let x = 0; x < iw; x++) {
        const dist = Math.min(x, y, iw - 1 - x, ih - 1 - y);
        if (dist >= borderWidth) continue;
        if (isClipped(x, y, iw, ih, radius)) continue;
        const di = ((y + oy) * w + (x + ox)) * 4;
        out.data[di] = color.r;
        out.data[di + 1] = color.g;
        out.data[di + 2] = color.b;
        out.data[di + 3] = 255;
      }
    }
  }
  return out;
};
