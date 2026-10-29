import { encodeAtQuality } from "../image-core/compress.ts";
import type { EncodedImage } from "../image-core/compress-to-size.ts";
import type { PixelBuffer } from "../image-core/types.ts";
import { shouldUseWorker } from "./runtime.ts";

export type { EncodedImage };

const JPEG_MIME = "image/jpeg";

export type CompressQualityInput = {
  source: PixelBuffer;
};

export const createQualityEncoder = (
  source: PixelBuffer,
): ((quality: number) => Promise<EncodedImage>) => {
  const base = new OffscreenCanvas(source.width, source.height);
  const baseContext = base.getContext("2d") as OffscreenCanvasRenderingContext2D;
  baseContext.putImageData(
    (() => {
      const pixels = baseContext.createImageData(source.width, source.height);
      pixels.data.set(source.data);
      return pixels;
    })(),
    0,
    0,
  );
  return async (quality: number) => {
    const blob = await base.convertToBlob({
      type: JPEG_MIME,
      quality,
    });
    const data = new Uint8Array(await blob.arrayBuffer());
    return { data, width: source.width, height: source.height };
  };
};

export const runCompressQualityJob = (
  input: CompressQualityInput,
  quality: number,
  encode = createQualityEncoder(input.source),
): Promise<EncodedImage> => encodeAtQuality(encode, quality);

type WorkerJobRequest = {
  id: number;
  input: CompressQualityInput;
  quality: number;
};

type WorkerJobResponse = {
  id: number;
  result?: EncodedImage;
  error?: string;
};

export const applyCompressQuality = (
  input: CompressQualityInput,
  quality: number,
): Promise<EncodedImage> => {
  if (
    typeof Worker === "undefined" ||
    !shouldUseWorker(input.source.width * input.source.height)
  ) {
    return runCompressQualityJob(input, quality);
  }
  const worker = new Worker(new URL("./compress.worker.ts", import.meta.url));
  return new Promise<EncodedImage>((resolve, reject) => {
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
    const request: WorkerJobRequest = { id: 1, input, quality };
    worker.postMessage(request);
  });
};
