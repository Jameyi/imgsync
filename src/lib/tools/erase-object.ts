import { inpaintFill, type MaskData } from "../image-core/telea-inpaint.ts";
import type { PixelBuffer } from "../image-core/types.ts";
import { shouldUseWorker } from "./runtime.ts";

export type EraseObjectInput = {
  source: PixelBuffer;
  mask: MaskData;
  /** Telea band radius in pixels. */
  radius?: number;
};

export const runEraseObjectJob = (input: EraseObjectInput) =>
  inpaintFill(input.source, input.mask, { radius: input.radius });

type WorkerJobRequest = {
  id: number;
  input: EraseObjectInput;
};

type WorkerJobResponse = {
  id: number;
  result?: PixelBuffer;
  error?: string;
};

export const applyEraseObject = (input: EraseObjectInput) => {
  if (
    typeof Worker === "undefined" ||
    !shouldUseWorker(input.source.width * input.source.height)
  ) {
    return runEraseObjectJob(input);
  }
  const worker = new Worker(
    new URL("./erase-object.worker.ts", import.meta.url),
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
    const request: WorkerJobRequest = { id: 1, input };
    worker.postMessage(request);
  });
};
