import {
  compressToSize,
  type SizeEncoder,
  type CompressToSizeResult,
} from "../image-core/compress-to-size.ts";

export type { CompressToSizeResult };
import type { PixelBuffer } from "../image-core/types.ts";
import { shouldUseWorker } from "./runtime.ts";

const JPEG_MIME = "image/jpeg";

export type CompressToSizeInput = {
  source: PixelBuffer;
  targetBytes: number;
};

export const createSizeEncoder = (source: PixelBuffer): SizeEncoder => {
  const base = new OffscreenCanvas(source.width, source.height);
  const baseContext = base.getContext(
    "2d",
  ) as OffscreenCanvasRenderingContext2D;
  baseContext.putImageData(
    (() => {
      const pixels = baseContext.createImageData(source.width, source.height);
      pixels.data.set(source.data);
      return pixels;
    })(),
    0,
    0,
  );
  const bitmapPromise = createImageBitmap(base);
  return async (quality, scale) => {
    const bitmap = await bitmapPromise;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext(
      "2d",
    ) as OffscreenCanvasRenderingContext2D;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await canvas.convertToBlob({ type: JPEG_MIME, quality });
    return { data: new Uint8Array(await blob.arrayBuffer()), width, height };
  };
};

export const runCompressToSizeJob = (
  input: CompressToSizeInput,
  encode: SizeEncoder = createSizeEncoder(input.source),
): Promise<CompressToSizeResult> =>
  compressToSize(encode, { targetBytes: input.targetBytes });

type WorkerJobRequest = {
  id: number;
  input: CompressToSizeInput;
};

type WorkerJobResponse = {
  id: number;
  result?: CompressToSizeResult;
  error?: string;
};

export const applyCompressToSize = (
  input: CompressToSizeInput,
  encode?: SizeEncoder,
): Promise<CompressToSizeResult> => {
  if (
    typeof Worker === "undefined" ||
    !shouldUseWorker(input.source.width * input.source.height)
  ) {
    return runCompressToSizeJob(input, encode);
  }
  const worker = new Worker(
    new URL("./compress-to-size.worker.ts", import.meta.url),
  );
  return new Promise<CompressToSizeResult>((resolve, reject) => {
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
