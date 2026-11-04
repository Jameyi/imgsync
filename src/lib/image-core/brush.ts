import type { MaskData } from "./telea-inpaint.ts";

/**
 * Stamps a round brush onto a mask and returns a NEW mask (the input is
 * never mutated — the UI keeps history snapshots for undo). Pure function.
 * value 255 = erase, 0 = keep (undo-painting).
 */
export const stampBrush = (
  mask: MaskData,
  x: number,
  y: number,
  brushRadius: number,
  value: 0 | 255 = 255,
): MaskData => {
  const out: MaskData = {
    width: mask.width,
    height: mask.height,
    data: new Uint8Array(mask.data),
  };
  const r2 = brushRadius * brushRadius;
  const y0 = Math.max(0, y - brushRadius);
  const y1 = Math.min(mask.height - 1, y + brushRadius);
  const x0 = Math.max(0, x - brushRadius);
  const x1 = Math.min(mask.width - 1, x + brushRadius);
  for (let yy = y0; yy <= y1; yy++) {
    for (let xx = x0; xx <= x1; xx++) {
      const dx = xx - x;
      const dy = yy - y;
      if (dx * dx + dy * dy <= r2) out.data[yy * mask.width + xx] = value;
    }
  }
  return out;
};
