import { splitLayers } from "../image-core/split-layers.ts";
import type { PixelBuffer } from "../image-core/types.ts";
import { shouldUseWorker } from "./runtime.ts";

export type { SplitLayersResult } from "../image-core/split-layers.ts";

export type SplitLayersInput = {
  source: PixelBuffer;
};

export const runSplitLayersJob = (input: SplitLayersInput) =>
  splitLayers(input.source);

type WorkerJobRequest = {
  id: number;
  input: SplitLayersInput;
};

type WorkerJobResponse = {
  id: number;
  result?: { subject: PixelBuffer; background: PixelBuffer };
  error?: string;
};

export const applySplitLayers = (input: SplitLayersInput) => {
  if (
    typeof Worker === "undefined" ||
    !shouldUseWorker(input.source.width * input.source.height)
  ) {
    return Promise.resolve(runSplitLayersJob(input));
  }
  const worker = new Worker(new URL("./split-layers.worker.ts", import.meta.url));
  return new Promise<{ subject: PixelBuffer; background: PixelBuffer }>(
    (resolve, reject) => {
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
    },
  );
};
