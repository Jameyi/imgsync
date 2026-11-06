import type { PixelBuffer } from "../image-core/types.ts";
import { smoothAlphaEdges } from "../image-core/edge-smooth.ts";

/** Edge smoothing only applies to PNG sources — JPEG has no alpha channel. */
export const isEligibleForSmooth = (file: { name: string; type: string }): boolean => {
  if (file.type === "image/png") return true;
  return /\.png$/i.test(file.name);
};

export type SmoothStrength = "light" | "standard" | "strong";

export const STRENGTH_LEVELS: ReadonlyArray<{
  value: SmoothStrength;
  label: string;
  passes: number;
}> = [
  { value: "light", label: "Light", passes: 1 },
  { value: "standard", label: "Standard", passes: 2 },
  { value: "strong", label: "Strong", passes: 3 },
];

/** Appends the -smooth suffix and keeps the .png extension. */
export const buildSmoothFileName = (sourceName: string): string => {
  const dot = sourceName.lastIndexOf(".");
  const stem = dot > 0 ? sourceName.slice(0, dot) : sourceName;
  return `${stem}-smooth.png`;
};

export type SmoothJobInput = {
  source: PixelBuffer;
  passes: number;
};

export type SmoothedImage = {
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

export const runSmoothJob = async (
  input: SmoothJobInput,
): Promise<SmoothedImage> => {
  const smoothed = smoothAlphaEdges(input.source, { passes: input.passes });
  return {
    data: await encodePng(smoothed),
    width: smoothed.width,
    height: smoothed.height,
  };
};

type WorkerJobRequest = { id: number; input: SmoothJobInput };
type WorkerJobResponse = {
  id: number;
  result?: SmoothedImage;
  error?: string;
};

export const applySmoothEdges = (
  input: SmoothJobInput,
): Promise<SmoothedImage> => {
  if (typeof Worker === "undefined") {
    return runSmoothJob(input);
  }
  const worker = new Worker(new URL("./smooth-edges.worker.ts", import.meta.url));
  return new Promise<SmoothedImage>((resolve, reject) => {
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
