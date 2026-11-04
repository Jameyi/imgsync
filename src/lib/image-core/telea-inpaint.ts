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
  /** Mask dilation in pixels before filling (absorbs brush-contaminated edge pixels). */
  dilate?: number;
};

const DEFAULT_RADIUS = 5;
const DEFAULT_DILATE = 2;

/**
 * Expands a binary mask by `r` pixels (8-neighborhood, r passes — Chebyshev
 * distance, so the dilated region is a full square, not a cross). The dilated
 * ring swallows brush-contaminated edge pixels so they are filled over
 * instead of leaking into the result.
 */
const dilateMask = (mask: MaskData, r: number): MaskData => {
  const { width: w, height: h } = mask;
  let cur = Uint8Array.from(mask.data);
  for (let it = 0; it < r; it++) {
    const next = Uint8Array.from(cur);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (cur[i]) continue;
        if (
          (x > 0 && cur[i - 1]) || (x < w - 1 && cur[i + 1]) ||
          (y > 0 && cur[i - w]) || (y < h - 1 && cur[i + w]) ||
          (x > 0 && y > 0 && cur[i - w - 1]) ||
          (x < w - 1 && y > 0 && cur[i - w + 1]) ||
          (x > 0 && y < h - 1 && cur[i + w - 1]) ||
          (x < w - 1 && y < h - 1 && cur[i + w + 1])
        ) next[i] = 255;
      }
    }
    cur = next;
  }
  return { width: w, height: h, data: cur };
};

/**
 * True Telea FMM inpainting (Telea 2004): a narrow band marches inward by
 * distance; each pixel takes a weighted average of known neighbors with
 * dir (mask-normal alignment) * dst (inverse square distance) * lev
 * (distance-level similarity) weights, which continues isophotes instead of
 * blurring across them. Pure function: PixelBuffer in, PixelBuffer out,
 * zero DOM. Async signature per the frozen seam — the Worker tier wraps this.
 */
const teleaFill = (
  input: PixelBuffer,
  mask: MaskData,
  radius: number,
): PixelBuffer => {
  const eps = radius;
  const { width: w, height: h, data } = input;
  const n = w * h;
  const out: PixelBuffer = {
    width: w,
    height: h,
    data: new Uint8ClampedArray(data),
  };
  const KNOWN = 0;
  const BAND = 1;
  const INSIDE = 2;
  const flag = new Uint8Array(n);
  const T = new Float32Array(n);
  const conf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    flag[i] = mask.data[i] ? INSIDE : KNOWN;
    conf[i] = mask.data[i] ? 0 : 1;
  }

  // Binary min-heap over (T, index).
  const heap: { t: number; i: number }[] = [];
  const push = (i: number, t: number) => {
    heap.push({ t, i });
    let c = heap.length - 1;
    while (c > 0) {
      const p = (c - 1) >> 1;
      if (heap[p].t <= heap[c].t) break;
      const tmp = heap[p];
      heap[p] = heap[c];
      heap[c] = tmp;
      c = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let c = 0;
      for (;;) {
        const l = 2 * c + 1;
        const r = l + 1;
        let m = c;
        if (l < heap.length && heap[l].t < heap[m].t) m = l;
        if (r < heap.length && heap[r].t < heap[m].t) m = r;
        if (m === c) break;
        const tmp = heap[m];
        heap[m] = heap[c];
        heap[c] = tmp;
        c = m;
      }
    }
    return top;
  };

  // Init the narrow band: inside pixels touching a known pixel.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (flag[i] !== INSIDE) continue;
      if (
        (x > 0 && flag[i - 1] === KNOWN) || (x < w - 1 && flag[i + 1] === KNOWN) ||
        (y > 0 && flag[i - w] === KNOWN) || (y < h - 1 && flag[i + w] === KNOWN)
      ) {
        flag[i] = BAND;
        T[i] = 0;
        push(i, 0);
      }
    }
  }
  const minNeighborT = (x: number, y: number) => {
    let best = Infinity;
    if (x > 0 && flag[y * w + x - 1] !== INSIDE) best = Math.min(best, T[y * w + x - 1]);
    if (x < w - 1 && flag[y * w + x + 1] !== INSIDE) best = Math.min(best, T[y * w + x + 1]);
    if (y > 0 && flag[(y - 1) * w + x] !== INSIDE) best = Math.min(best, T[(y - 1) * w + x]);
    if (y < h - 1 && flag[(y + 1) * w + x] !== INSIDE) best = Math.min(best, T[(y + 1) * w + x]);
    return best === Infinity ? 1 : best + 1;
  };
  const gradT = (x: number, y: number): [number, number] => {
    const c = y * w + x;
    const l = x > 0 && flag[c - 1] !== INSIDE ? T[c - 1] : T[c];
    const r = x < w - 1 && flag[c + 1] !== INSIDE ? T[c + 1] : T[c];
    const u = y > 0 && flag[c - w] !== INSIDE ? T[c - w] : T[c];
    const d = y < h - 1 && flag[c + w] !== INSIDE ? T[c + w] : T[c];
    return [(r - l) / 2, (d - u) / 2];
  };

  let guard = n;
  while (heap.length && guard-- > 0) {
    const { i } = pop();
    if (flag[i] !== BAND) continue;
    const x = i % w;
    const y = (i / w) | 0;
    T[i] = minNeighborT(x, y);
    flag[i] = KNOWN;
    const [gx, gy] = gradT(x, y);
    const glen = Math.hypot(gx, gy);
    // Degenerate normal (flat first-layer front where every neighbor T is 0):
    // fall back to direction-free dst*lev weighting instead of skipping all
    // neighbors, which would leave the pixel at its original value.
    const hasNormal = glen > 1e-9;
    const nx = hasNormal ? gx / glen : 0;
    const ny = hasNormal ? gy / glen : 0;
    let sr = 0;
    let sg = 0;
    let sb = 0;
    let wsum = 0;
    let cs = 0;
    let cdsum = 0;
    for (let dy = -eps; dy <= eps; dy++) {
      const qy = y + dy;
      if (qy < 0 || qy >= h) continue;
      for (let dx = -eps; dx <= eps; dx++) {
        const qx = x + dx;
        if (qx < 0 || qx >= w) continue;
        const q = qy * w + qx;
        // Only already-filled pixels may contribute: band pixels inside the
        // dilated mask still carry untrusted (possibly brush-contaminated)
        // original values and must never leak into the fill.
        if (flag[q] !== KNOWN) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 === 0) continue;
        const d = Math.sqrt(d2);
        const dst = 1 / d2;
        const dir = hasNormal ? Math.abs((nx * dx + ny * dy) / d) : 1;
        if (dir < 1e-4) continue;
        const lev = 1 / (1 + Math.abs(T[q] - T[i]));
        const wgt = dir * dst * lev;
        const j = q * 4;
        sr += wgt * out.data[j];
        sg += wgt * out.data[j + 1];
        sb += wgt * out.data[j + 2];
        wsum += wgt;
        cs += dir * dst * conf[q];
        cdsum += dir * dst;
      }
    }
    if (wsum > 0) {
      const j = i * 4;
      out.data[j] = Math.round(sr / wsum);
      out.data[j + 1] = Math.round(sg / wsum);
      out.data[j + 2] = Math.round(sb / wsum);
      conf[i] = cdsum > 0 ? cs / cdsum : 0.5;
    }
    // March: promote INSIDE neighbors to the band.
    if (x > 0 && flag[i - 1] === INSIDE) { flag[i - 1] = BAND; push(i - 1, minNeighborT(x - 1, y)); }
    if (x < w - 1 && flag[i + 1] === INSIDE) { flag[i + 1] = BAND; push(i + 1, minNeighborT(x + 1, y)); }
    if (y > 0 && flag[i - w] === INSIDE) { flag[i - w] = BAND; push(i - w, minNeighborT(x, y - 1)); }
    if (y < h - 1 && flag[i + w] === INSIDE) { flag[i + w] = BAND; push(i + w, minNeighborT(x, y + 1)); }
  }
  // Isolation guard (e.g. full mask): plain average fill for stragglers.
  for (let pass = 0; pass < 32; pass++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      if (flag[i] !== INSIDE) continue;
      const x = i % w;
      const y = (i / w) | 0;
      let sr = 0;
      let sg = 0;
      let sb = 0;
      let ws = 0;
      for (const off of [-1, 1, -w, w] as const) {
        const q = i + off;
        if (q < 0 || q >= n) continue;
        if ((off === -1 && x === 0) || (off === 1 && x === w - 1)) continue;
        if (flag[q] === INSIDE) continue;
        const j = q * 4;
        sr += out.data[j];
        sg += out.data[j + 1];
        sb += out.data[j + 2];
        ws++;
      }
      if (ws) {
        const j = i * 4;
        out.data[j] = Math.round(sr / ws);
        out.data[j + 1] = Math.round(sg / ws);
        out.data[j + 2] = Math.round(sb / ws);
        flag[i] = KNOWN;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return out;
};

/**
 * Erases masked pixels and fills them from surrounding known pixels
 * (true Telea FMM, small-region tier per PRD B.1). The mask is dilated
 * by `options.dilate` pixels first so brush-contaminated edge pixels are
 * filled over; a boundary feather blend toward the original is
 * deliberately not applied — pixels inside the dilated mask are untrusted
 * by definition, and the FMM result is boundary-continuous by construction.
 * Pure function: PixelBuffer in, PixelBuffer out, zero DOM.
 */
export const inpaintFill = (
  input: PixelBuffer,
  mask: MaskData,
  options: InpaintOptions = {},
): Promise<PixelBuffer> => {
  const radius = options.radius ?? DEFAULT_RADIUS;
  const dilate = options.dilate ?? DEFAULT_DILATE;
  let hasUnknown = false;
  for (let p = 0; p < mask.data.length; p++) {
    if (mask.data[p] !== 0) {
      hasUnknown = true;
      break;
    }
  }
  if (!hasUnknown) {
    return Promise.resolve({
      width: input.width,
      height: input.height,
      data: new Uint8ClampedArray(input.data),
    });
  }
  const effective = dilate > 0 ? dilateMask(mask, dilate) : mask;
  return Promise.resolve(teleaFill(input, effective, radius));
};
