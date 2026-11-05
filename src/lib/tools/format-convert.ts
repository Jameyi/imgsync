import type { PixelBuffer } from "../image-core/types.ts";
import { shouldUseWorker } from "./runtime.ts";

export type ConvertFormat = "jpeg" | "png" | "webp";

export type ConvertFormatSpec = {
  mime: string;
  ext: string;
  /** Lossy formats honor the quality slider; PNG ignores it. */
  lossy: boolean;
};

export const FORMATS: Readonly<Record<ConvertFormat, ConvertFormatSpec>> = {
  jpeg: { mime: "image/jpeg", ext: ".jpg", lossy: true },
  png: { mime: "image/png", ext: ".png", lossy: false },
  webp: { mime: "image/webp", ext: ".webp", lossy: true },
};

export const lookupFormat = (name: string): ConvertFormatSpec | null => {
  const spec = (FORMATS as Record<string, ConvertFormatSpec | undefined>)[name];
  return spec ?? null;
};

/** Swaps the source file's extension for the target format's, keeping the stem. */
export const buildOutputFileName = (
  sourceName: string,
  format: ConvertFormat,
): string => {
  const dot = sourceName.lastIndexOf(".");
  const stem = dot > 0 ? sourceName.slice(0, dot) : sourceName;
  return `${stem}${FORMATS[format].ext}`;
};

export type ConvertInput = {
  source: PixelBuffer;
  format: ConvertFormat;
  quality: number;
};

export type ConvertedImage = {
  data: Uint8Array;
  mime: string;
  width: number;
  height: number;
};

const encodeWithCanvas = async (input: ConvertInput): Promise<ConvertedImage> => {
  const spec = FORMATS[input.format];
  const canvas = new OffscreenCanvas(input.source.width, input.source.height);
  const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  const pixels = context.createImageData(input.source.width, input.source.height);
  pixels.data.set(input.source.data);
  context.putImageData(pixels, 0, 0);
  const blob = await canvas.convertToBlob({
    type: spec.mime,
    ...(spec.lossy ? { quality: input.quality } : {}),
  });
  const data = new Uint8Array(await blob.arrayBuffer());
  return { data, mime: spec.mime, width: input.source.width, height: input.source.height };
};

type WorkerJobRequest = ConvertInput & { id: number };
type WorkerJobResponse = {
  id: number;
  result?: ConvertedImage;
  error?: string;
};

export const runConvertJob = (
  input: ConvertInput,
  encode: (input: ConvertInput) => Promise<ConvertedImage> = encodeWithCanvas,
): Promise<ConvertedImage> => encode(input);

export const applyFormatConvert = (
  input: ConvertInput,
): Promise<ConvertedImage> => {
  if (
    typeof Worker === "undefined" ||
    !shouldUseWorker(input.source.width * input.source.height)
  ) {
    return runConvertJob(input);
  }
  const worker = new Worker(new URL("./format-convert.worker.ts", import.meta.url));
  return new Promise<ConvertedImage>((resolve, reject) => {
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
    const request: WorkerJobRequest = { id: 1, ...input };
    worker.postMessage(request);
  });
};
