import {
  whiteToTransparent,
  type WhiteToTransparentOptions,
} from "../image-core/white-to-transparent.ts";
import { shouldUseWorker } from "./runtime.ts";
import type { PixelBuffer } from "../image-core/types.ts";

export const runWhiteToTransparentJob = (
  input: PixelBuffer,
  options?: WhiteToTransparentOptions,
): PixelBuffer => whiteToTransparent(input, options);

type WorkerJobRequest = {
  id: number;
  input: PixelBuffer;
  options?: WhiteToTransparentOptions;
};

type WorkerJobResponse = {
  id: number;
  result?: PixelBuffer;
  error?: string;
};

export const applyWhiteToTransparent = (
  input: PixelBuffer,
  options?: WhiteToTransparentOptions,
): Promise<PixelBuffer> => {
  if (typeof Worker === "undefined" || !shouldUseWorker(input.width * input.height)) {
    return Promise.resolve(runWhiteToTransparentJob(input, options));
  }
  const worker = new Worker(
    new URL("./white-to-transparent.worker.ts", import.meta.url),
  );
  return new Promise<PixelBuffer>((resolve, reject) => {
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
    const request: WorkerJobRequest = { id: 1, input, options };
    worker.postMessage(request);
  });
};
