import type { PixelBuffer } from "../image-core/types.ts";
import { buildIco, FAVICON_FILES, type IcoEntry } from "../image-core/ico-export.ts";

export type FaviconSize = 16 | 32 | 48 | 180 | 512;

export const FAVICON_SIZES: readonly FaviconSize[] = [16, 32, 48, 180, 512];

/** Renders the source into a size×size canvas (aspect-fit, centered) and encodes PNG. */
export const renderSize = async (
  source: PixelBuffer,
  size: FaviconSize,
): Promise<Uint8Array> => {
  const canvas = new OffscreenCanvas(size, size);
  const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  const bitmapCanvas = new OffscreenCanvas(source.width, source.height);
  const src = bitmapCanvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  const pixels = src.createImageData(source.width, source.height);
  pixels.data.set(source.data);
  src.putImageData(pixels, 0, 0);
  // Aspect-fit into the square, centered.
  const scale = Math.min(size / source.width, size / source.height);
  const w = Math.max(1, Math.round(source.width * scale));
  const h = Math.max(1, Math.round(source.height * scale));
  context.drawImage(bitmapCanvas, Math.round((size - w) / 2), Math.round((size - h) / 2), w, h);
  const blob = await canvas.convertToBlob({ type: "image/png" });
  return new Uint8Array(await blob.arrayBuffer());
};

export type FaviconKit = {
  ico: Uint8Array;
  pngs: Array<{ file: string; bytes: Uint8Array }>;
};

/** Generates the full kit: multi-size .ico plus one PNG per size. */
export const createFaviconKit = async (
  source: PixelBuffer,
): Promise<FaviconKit> => {
  const entries: IcoEntry[] = [];
  const pngs: FaviconKit["pngs"] = [];
  const fileBySize: Record<FaviconSize, string> = {
    16: FAVICON_FILES.png16,
    32: FAVICON_FILES.png32,
    48: FAVICON_FILES.png32, // 48 lives inside the .ico only; placeholder unused
    180: FAVICON_FILES.png180,
    512: FAVICON_FILES.png512,
  };
  for (const size of FAVICON_SIZES) {
    const bytes = await renderSize(source, size);
    if (size === 16 || size === 32 || size === 48) {
      entries.push({ width: size, height: size, png: bytes });
    }
    if (size !== 48) {
      pngs.push({ file: fileBySize[size], bytes });
    }
  }
  const ico = new Uint8Array(buildIco(entries));
  return { ico, pngs };
};
