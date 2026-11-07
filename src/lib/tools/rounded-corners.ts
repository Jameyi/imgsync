import type { PixelBuffer } from "../image-core/types.ts";
import { frameImage, type FrameOptions, type Rgb } from "../image-core/frame.ts";
import { hexToRgb } from "../image-core/color.ts";

export type { FrameOptions, Rgb };
export { hexToRgb };

export type ShadowPreset = "none" | "soft" | "strong";

export const SHADOW_PRESETS: ReadonlyArray<{
  value: ShadowPreset;
  label: string;
  blurPasses: number;
}> = [
  { value: "none", label: "None", blurPasses: 0 },
  { value: "soft", label: "Soft", blurPasses: 1 },
  { value: "strong", label: "Strong", blurPasses: 3 },
];

/** Appends the -framed suffix and keeps the .png extension. */
export const buildFramedFileName = (sourceName: string): string => {
  const dot = sourceName.lastIndexOf(".");
  const stem = dot > 0 ? sourceName.slice(0, dot) : sourceName;
  return `${stem}-framed.png`;
};

export type FrameJobInput = {
  source: PixelBuffer;
  options: FrameOptions;
};

export type FramedImage = {
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

export const runFrameJob = async (
  input: FrameJobInput,
): Promise<FramedImage> => {
  const framed = frameImage(input.source, input.options);
  return {
    data: await encodePng(framed),
    width: framed.width,
    height: framed.height,
  };
};

type WorkerJobRequest = { id: number; input: FrameJobInput };
type WorkerJobResponse = {
  id: number;
  result?: FramedImage;
  error?: string;
};

export const applyRoundedCorners = (
  input: FrameJobInput,
): Promise<FramedImage> => {
  if (typeof Worker === "undefined") {
    return runFrameJob(input);
  }
  const worker = new Worker(new URL("./rounded-corners.worker.ts", import.meta.url));
  return new Promise<FramedImage>((resolve, reject) => {
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
