import {
  checkPreflight,
  type PreflightOptions,
  type PreflightReport,
} from "../image-core/platform-preflight.ts";
import { shouldUseWorker } from "./runtime.ts";
import type { PixelBuffer } from "../image-core/types.ts";

export type PlatformPreflightJobOptions = PreflightOptions;

export const runPlatformPreflightJob = (
  input: PixelBuffer,
  options?: PlatformPreflightJobOptions,
): PreflightReport => checkPreflight(input, options);

type WorkerJobRequest = {
  id: number;
  input: PixelBuffer;
  options?: PlatformPreflightJobOptions;
};

type WorkerJobResponse = {
  id: number;
  result?: PreflightReport;
  error?: string;
};

export const applyPlatformPreflight = (
  input: PixelBuffer,
  options?: PlatformPreflightJobOptions,
): Promise<PreflightReport> => {
  if (typeof Worker === "undefined" || !shouldUseWorker(input.width * input.height)) {
    return Promise.resolve(runPlatformPreflightJob(input, options));
  }
  const worker = new Worker(
    new URL("./platform-preflight.worker.ts", import.meta.url),
  );
  return new Promise<PreflightReport>((resolve, reject) => {
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
