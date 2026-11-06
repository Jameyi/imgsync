import type { PixelBuffer } from "./types.ts";

export type ResizeMode = "cover" | "contain" | "stretch";

/**
 * Nearest-neighbor resample of `source` into a width×height box.
 * - "stretch": independent x/y mapping, every box pixel samples the source.
 * - "contain": largest aspect-true fit inside the box; padding stays
 *   transparent (alpha 0).
 * - "cover": smallest aspect-true fit that fills the box; overflow is
 *   cropped symmetrically.
 * Pure function: PixelBuffer in, PixelBuffer out, zero DOM.
 */
export const resizeInto = (
  source: PixelBuffer,
  width: number,
  height: number,
  mode: ResizeMode = "contain",
): PixelBuffer => {
  const out: PixelBuffer = {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4),
  };
  const sw = source.width;
  const sh = source.height;
  const sample = (sx: number, sy: number, di: number) => {
    const cx = Math.min(sw - 1, Math.max(0, sx));
    const cy = Math.min(sh - 1, Math.max(0, sy));
    const si = (cy * sw + cx) * 4;
    out.data[di] = source.data[si];
    out.data[di + 1] = source.data[si + 1];
    out.data[di + 2] = source.data[si + 2];
    out.data[di + 3] = source.data[si + 3];
  };
  if (mode === "stretch" || (width === sw && height === sh)) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        sample(
          Math.floor((x * sw) / width),
          Math.floor((y * sh) / height),
          (y * width + x) * 4,
        );
      }
    }
    return out;
  }
  const scale =
    mode === "cover"
      ? Math.max(width / sw, height / sh)
      : Math.min(width / sw, height / sh);
  const dw = Math.round(sw * scale);
  const dh = Math.round(sh * scale);
  const ox = Math.floor((width - dw) / 2);
  const oy = Math.floor((height - dh) / 2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const di = (y * width + x) * 4;
      if (x < ox || x >= ox + dw || y < oy || y >= oy + dh) continue; // contain padding
      sample(Math.floor((x - ox) / scale), Math.floor((y - oy) / scale), di);
    }
  }
  return out;
};

export type Placement =
  | "top-left"
  | "top"
  | "top-right"
  | "left"
  | "center"
  | "right"
  | "bottom-left"
  | "bottom"
  | "bottom-right";

export type CompositeOptions = {
  placement?: Placement;
  /** Foreground scale in percent of its own size (100 = untouched). */
  scalePercent?: number;
};

/**
 * Resolves a placement preset to the foreground's top-left anchor on the
 * backdrop box. Edge placements clamp the anchor so an oversized foreground
 * stays within the box.
 */
export const resolvePlacementAnchor = (
  placement: Placement,
  bw: number,
  bh: number,
  fw: number,
  fh: number,
): { x: number; y: number } => {
  const x =
    placement === "top-left" || placement === "left" || placement === "bottom-left"
      ? 0
      : placement === "top-right" || placement === "right" || placement === "bottom-right"
        ? bw - fw
        : Math.floor((bw - fw) / 2);
  const y =
    placement === "top-left" || placement === "top" || placement === "top-right"
      ? 0
      : placement === "bottom-left" || placement === "bottom" || placement === "bottom-right"
        ? bh - fh
        : Math.floor((bh - fh) / 2);
  return { x, y };
};

/**
 * Blends a foreground image over a backdrop using standard source-over alpha
 * compositing. Output takes the backdrop's size; a foreground larger than the
 * backdrop (after scaling) is cropped at the bounds. Pure function,
 * PixelBuffer in, PixelBuffer out, zero DOM.
 */
export const compositeOnBackdrop = (
  foreground: PixelBuffer,
  backdrop: PixelBuffer,
  options: CompositeOptions = {},
): PixelBuffer => {
  const placement = options.placement ?? "center";
  const scalePercent = options.scalePercent ?? 100;
  const fw = Math.max(1, Math.round((foreground.width * scalePercent) / 100));
  const fh = Math.max(1, Math.round((foreground.height * scalePercent) / 100));
  const fg =
    fw === foreground.width && fh === foreground.height
      ? foreground
      : resizeInto(foreground, fw, fh, "stretch");
  const bw = backdrop.width;
  const bh = backdrop.height;
  const out: PixelBuffer = {
    width: bw,
    height: bh,
    data: new Uint8ClampedArray(backdrop.data),
  };
  const { x: anchorX, y: anchorY } = resolvePlacementAnchor(placement, bw, bh, fw, fh);
  for (let y = Math.max(0, anchorY); y < Math.min(bh, anchorY + fh); y++) {
    for (let x = Math.max(0, anchorX); x < Math.min(bw, anchorX + fw); x++) {
      const si = ((y - anchorY) * fw + (x - anchorX)) * 4;
      const di = (y * bw + x) * 4;
      const af = fg.data[si + 3] / 255;
      const ab = out.data[di + 3] / 255;
      const ao = af + ab * (1 - af);
      if (ao === 0) {
        out.data[di] = 0;
        out.data[di + 1] = 0;
        out.data[di + 2] = 0;
        out.data[di + 3] = 0;
        continue;
      }
      for (let c = 0; c < 3; c++) {
        out.data[di + c] = Math.round(
          (fg.data[si + c] * af + out.data[di + c] * ab * (1 - af)) / ao,
        );
      }
      out.data[di + 3] = Math.round(ao * 255);
    }
  }
  return out;
};
