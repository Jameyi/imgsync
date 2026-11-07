import type { PixelBuffer } from "../image-core/types.ts";
import {
  blendWatermark,
  tileOrigins,
  type WatermarkOptions,
  type WatermarkPlacement,
} from "../image-core/watermark.ts";
import { hexToRgb, type Rgb } from "../image-core/color.ts";

export type { WatermarkOptions, WatermarkPlacement, Rgb };
export { tileOrigins };

export type StampSpec = {
  text: string;
  fontSize: number;
  color: Rgb;
};

/** Empty/whitespace text or an invalid color yields no stamp. */
export const buildStampSpec = (input: {
  text: string;
  fontSize: number;
  colorHex: string;
}): StampSpec | null => {
  const text = input.text.trim();
  if (!text) return null;
  const color = hexToRgb(input.colorHex);
  if (!color) return null;
  return { text, fontSize: Math.max(1, Math.floor(input.fontSize)), color };
};

/** Passes opacity through to the seam, clamped to [0, 1]. */
export const buildBlendOptions = (input: {
  placement: WatermarkPlacement;
  opacity: number;
  gap: number;
  angle: number;
}): WatermarkOptions => ({
  placement: input.placement,
  opacity: Math.min(1, Math.max(0, input.opacity)),
  gap: Math.max(0, Math.floor(input.gap)),
  angle: input.angle,
});

/** Appends the -watermarked suffix and keeps the .png extension. */
export const buildWatermarkedFileName = (sourceName: string): string => {
  const dot = sourceName.lastIndexOf(".");
  const stem = dot > 0 ? sourceName.slice(0, dot) : sourceName;
  return `${stem}-watermarked.png`;
};

/**
 * Rasterizes the text into a transparent-backed stamp bitmap. Canvas
 * side-effect boundary: this is the only place text becomes pixels; the
 * blend seam stays a pure function.
 */
export const renderTextStamp = async (
  spec: StampSpec,
): Promise<PixelBuffer> => {
  const font = `bold ${spec.fontSize}px sans-serif`;
  const measure = new OffscreenCanvas(0, 0);
  const mContext = measure.getContext("2d") as OffscreenCanvasRenderingContext2D;
  mContext.font = font;
  const metrics = mContext.measureText(spec.text);
  const pad = Math.ceil(spec.fontSize * 0.2);
  const w = Math.max(1, Math.ceil(metrics.width) + pad * 2);
  const h = Math.max(1, Math.ceil(spec.fontSize * 1.2) + pad * 2);
  const canvas = new OffscreenCanvas(w, h);
  const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  context.font = font;
  context.fillStyle = `rgb(${spec.color.r},${spec.color.g},${spec.color.b})`;
  context.textBaseline = "top";
  context.fillText(spec.text, pad, pad);
  const imageData = context.getImageData(0, 0, w, h);
  return {
    width: imageData.width,
    height: imageData.height,
    data: imageData.data,
  };
};

export type WatermarkJobInput = {
  source: PixelBuffer;
  stamp: PixelBuffer;
  options: WatermarkOptions;
};

export type WatermarkedImage = {
  data: Uint8Array;
  width: number;
  height: number;
};

const encodePng = async (image: PixelBuffer): Promise<Uint8Array> => {
  const canvas = new OffscreenCanvas(image.width, image.height);
  const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  const pixels = context.createImageData(image.width, image.height);
  pixels.data.set(image.data);
  context.putImageData(pixels, 0, 0);
  const blob = await canvas.convertToBlob({ type: "image/png" });
  return new Uint8Array(await blob.arrayBuffer());
};

export const runWatermarkJob = async (
  input: WatermarkJobInput,
): Promise<WatermarkedImage> => {
  const watermarked = blendWatermark(input.source, input.stamp, input.options);
  return {
    data: await encodePng(watermarked),
    width: watermarked.width,
    height: watermarked.height,
  };
};

type WorkerJobRequest = { id: number; input: WatermarkJobInput };
type WorkerJobResponse = {
  id: number;
  result?: WatermarkedImage;
  error?: string;
};

export const applyTextWatermark = (
  input: WatermarkJobInput,
): Promise<WatermarkedImage> => {
  if (typeof Worker === "undefined") {
    return runWatermarkJob(input);
  }
  const worker = new Worker(new URL("./text-watermark.worker.ts", import.meta.url));
  return new Promise<WatermarkedImage>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<WorkerJobResponse>) => {
      const { result, error } = event.data;
      worker.terminate();
      if (result) resolve(result);
      else reject(new Error(error ?? "worker job failed"));
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message));
    };
    const request: WorkerJobRequest = { id: 1, input };
    worker.postMessage(request);
  });
};
