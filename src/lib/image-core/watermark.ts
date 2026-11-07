import type { PixelBuffer } from "./types.ts";
import { resolvePlacementAnchor } from "./composite.ts";

export type WatermarkPlacement =
  | "top-left"
  | "top"
  | "top-right"
  | "left"
  | "center"
  | "right"
  | "bottom-left"
  | "bottom"
  | "bottom-right"
  | "tile";

export type WatermarkOptions = {
  placement?: WatermarkPlacement;
  /** Stamp opacity 0-1 applied on top of the stamp's own alpha. */
  opacity?: number;
  /** Tile spacing in pixels between stamps (tile mode only). */
  gap?: number;
  /** Tile rotation in degrees (tile mode only). */
  angle?: number;
};

/** Nearest-neighbor rotation of a stamp around its center; output is the rotated bounding box. */
const rotateStamp = (stamp: PixelBuffer, angleDeg: number): PixelBuffer => {
  if (angleDeg === 0) return stamp;
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const w = stamp.width;
  const h = stamp.height;
  const nw = Math.max(1, Math.round(Math.abs(w * cos) + Math.abs(h * sin)));
  const nh = Math.max(1, Math.round(Math.abs(w * sin) + Math.abs(h * cos)));
  const out: PixelBuffer = {
    width: nw,
    height: nh,
    data: new Uint8ClampedArray(nw * nh * 4),
  };
  const cx = w / 2;
  const cy = h / 2;
  const ncx = nw / 2;
  const ncy = nh / 2;
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const dx = x + 0.5 - ncx;
      const dy = y + 0.5 - ncy;
      const sx = Math.floor(cos * dx + sin * dy + cx);
      const sy = Math.floor(-sin * dx + cos * dy + cy);
      if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
      const si = (sy * w + sx) * 4;
      const di = (y * nw + x) * 4;
      out.data[di] = stamp.data[si];
      out.data[di + 1] = stamp.data[si + 1];
      out.data[di + 2] = stamp.data[si + 2];
      out.data[di + 3] = stamp.data[si + 3];
    }
  }
  return out;
};

/** Source-over blend of the stamp onto out at (ox, oy), clipped to bounds. */
const blendStampAt = (
  out: PixelBuffer,
  stamp: PixelBuffer,
  ox: number,
  oy: number,
  opacity: number,
) => {
  for (let sy = 0; sy < stamp.height; sy++) {
    const dy = oy + sy;
    if (dy < 0 || dy >= out.height) continue;
    for (let sx = 0; sx < stamp.width; sx++) {
      const dx = ox + sx;
      if (dx < 0 || dx >= out.width) continue;
      const si = (sy * stamp.width + sx) * 4;
      const sa = (stamp.data[si + 3] / 255) * opacity;
      if (sa <= 0) continue;
      const di = (dy * out.width + dx) * 4;
      const da = out.data[di + 3] / 255;
      const ao = sa + da * (1 - sa);
      for (let c = 0; c < 3; c++) {
        out.data[di + c] = Math.round(
          (stamp.data[si + c] * sa + out.data[di + c] * da * (1 - sa)) / ao,
        );
      }
      out.data[di + 3] = Math.round(ao * 255);
    }
  }
};

/**
 * Resolves the tile origins for a gap-spaced grid: x steps by stampWidth +
 * gap, y steps by stampHeight + gap, both from the origin, keeping every
 * stamp fully inside the image. Shared by the blend pipeline and the
 * orchestration preview.
 */
export const tileOrigins = (
  imageWidth: number,
  imageHeight: number,
  stampWidth: number,
  stampHeight: number,
  gap: number,
): Array<{ x: number; y: number }> => {
  const origins: Array<{ x: number; y: number }> = [];
  const stepX = stampWidth + gap;
  const stepY = stampHeight + gap;
  for (let y = 0; y + stampHeight <= imageHeight; y += stepY) {
    for (let x = 0; x + stampWidth <= imageWidth; x += stepX) {
      origins.push({ x, y });
    }
  }
  return origins;
};

/**
 * Blends a pre-rendered watermark stamp over an image. Single placements use
 * the nine-grid anchors; "tile" repeats the (optionally rotated) stamp on a
 * gap-spaced grid from the origin, clipping at the bounds. The text bitmap
 * itself is produced in the orchestration layer (canvas fillText). Pure
 * function: PixelBuffer in, PixelBuffer out, zero DOM.
 */
export const blendWatermark = (
  input: PixelBuffer,
  stamp: PixelBuffer,
  options: WatermarkOptions = {},
): PixelBuffer => {
  const placement = options.placement ?? "center";
  const opacity = Math.min(1, Math.max(0, options.opacity ?? 1));
  const gap = Math.max(0, Math.floor(options.gap ?? 0));
  const angle = placement === "tile" ? options.angle ?? 0 : 0;
  const out: PixelBuffer = {
    width: input.width,
    height: input.height,
    data: new Uint8ClampedArray(input.data),
  };
  if (opacity <= 0) return out;
  const mark = rotateStamp(stamp, angle);
  if (placement === "tile") {
    for (const { x, y } of tileOrigins(input.width, input.height, mark.width, mark.height, gap)) {
      blendStampAt(out, mark, x, y, opacity);
    }
    return out;
  }
  const { x, y } = resolvePlacementAnchor(
    placement,
    input.width,
    input.height,
    mark.width,
    mark.height,
  );
  blendStampAt(out, mark, x, y, opacity);
  return out;
};
