import {
  buildPsd,
  type PsdLayerInput,
  type PsdExportOptions,
} from "../image-core/psdExport.ts";
import { shouldUseWorker } from "./runtime.ts";

export type { PsdLayerInput, PsdExportOptions };

export const runPsdExportJob = (
  layers: readonly PsdLayerInput[],
  options?: PsdExportOptions,
): ArrayBuffer => buildPsd(layers, options);

type WorkerJobRequest = {
  id: number;
  layers: readonly PsdLayerInput[];
  options?: PsdExportOptions;
};

type WorkerJobResponse = {
  id: number;
  result?: ArrayBuffer;
  error?: string;
};

/** Total canvas pixels drive the worker threshold (same 4MP rule). */
const totalPixels = (
  layers: readonly PsdLayerInput[],
  options?: PsdExportOptions,
): number => {
  const width = options?.width ?? Math.max(...layers.map((l) => l.imageData.width));
  const height = options?.height ?? Math.max(...layers.map((l) => l.imageData.height));
  return width * height;
};

export const applyPsdExport = (
  layers: readonly PsdLayerInput[],
  options?: PsdExportOptions,
): Promise<ArrayBuffer> => {
  if (
    typeof Worker === "undefined" ||
    layers.length === 0 ||
    !shouldUseWorker(totalPixels(layers, options))
  ) {
    return Promise.resolve(runPsdExportJob(layers, options));
  }
  const worker = new Worker(new URL("./psd-export.worker.ts", import.meta.url));
  return new Promise<ArrayBuffer>((resolve, reject) => {
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
    const request: WorkerJobRequest = { id: 1, layers, options };
    worker.postMessage(request);
  });
};
