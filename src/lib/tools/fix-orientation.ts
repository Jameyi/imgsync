import type { PixelBuffer } from "../image-core/types.ts";
import {
  applyExifOrientation,
} from "../image-core/exif.ts";

/** EXIF correction only applies to JPEG sources (PNG/WebP carry no EXIF). */
export const isEligibleForExif = (file: { name: string; type: string }): boolean => {
  if (file.type === "image/jpeg") return true;
  return /\.jpe?g$/i.test(file.name);
};

export type FixDecision =
  | { action: "none" }
  | { action: "rotate"; orientation: number };

/** Orientation 1 (or absent) means the pixels are already upright. */
export const resolveFixDecision = (orientation: number | null): FixDecision => {
  if (orientation === null || orientation === 1) return { action: "none" };
  return { action: "rotate", orientation };
};

/** Swaps the extension for .jpg and appends the -fixed suffix. */
export const buildFixedFileName = (sourceName: string): string => {
  const dot = sourceName.lastIndexOf(".");
  const stem = dot > 0 ? sourceName.slice(0, dot) : sourceName;
  return `${stem}-fixed.jpg`;
};

export type FixJobInput = {
  source: PixelBuffer;
  orientation: number | null;
};

export type FixedImage = {
  data: Uint8Array;
  width: number;
  height: number;
  rotated: boolean;
};

const encodeJpeg = async (image: PixelBuffer): Promise<Uint8Array> => {
  const canvas = new OffscreenCanvas(image.width, image.height);
  const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  const pixels = context.createImageData(image.width, image.height);
  pixels.data.set(image.data);
  context.putImageData(pixels, 0, 0);
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.92 });
  return new Uint8Array(await blob.arrayBuffer());
};

export const runFixJob = async (
  input: FixJobInput,
): Promise<FixedImage> => {
  const decision = resolveFixDecision(input.orientation);
  const upright =
    decision.action === "rotate"
      ? applyExifOrientation(input.source, decision.orientation)
      : input.source;
  return {
    data: await encodeJpeg(upright),
    width: upright.width,
    height: upright.height,
    rotated: decision.action === "rotate",
  };
};

type WorkerJobRequest = { id: number; input: FixJobInput };
type WorkerJobResponse = {
  id: number;
  result?: FixedImage;
  error?: string;
};

export const applyFixOrientation = (
  input: FixJobInput,
): Promise<FixedImage> => {
  if (typeof Worker === "undefined") {
    return runFixJob(input);
  }
  const worker = new Worker(new URL("./fix-orientation.worker.ts", import.meta.url));
  return new Promise<FixedImage>((resolve, reject) => {
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
