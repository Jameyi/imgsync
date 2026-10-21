import {
  resizeToPreset,
  type ResizeToPresetOptions,
} from "../image-core/resize-to-preset.ts";
import { shouldUseWorker } from "./runtime.ts";
import type { PixelBuffer } from "../image-core/types.ts";

export type ResizeToPresetJobOptions = ResizeToPresetOptions;

export const runResizeToPresetJob = (
  input: PixelBuffer,
  options: ResizeToPresetJobOptions,
): PixelBuffer => resizeToPreset(input, options);

type WorkerJobRequest = {
  id: number;
  input: PixelBuffer;
  options: ResizeToPresetJobOptions;
};

type WorkerJobResponse = {
  id: number;
  result?: PixelBuffer;
  error?: string;
};

export const applyResizeToPreset = (
  input: PixelBuffer,
  options: ResizeToPresetJobOptions,
): Promise<PixelBuffer> => {
  if (typeof Worker === "undefined" || !shouldUseWorker(input.width * input.height)) {
    return Promise.resolve(runResizeToPresetJob(input, options));
  }
  const worker = new Worker(
    new URL("./resize-to-preset.worker.ts", import.meta.url),
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
