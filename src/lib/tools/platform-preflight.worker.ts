import type { PixelBuffer } from "../image-core/types.ts";
import {
  runPlatformPreflightJob,
  type PlatformPreflightJobOptions,
} from "./platform-preflight.ts";

type WorkerJobRequest = {
  id: number;
  input: PixelBuffer;
  options?: PlatformPreflightJobOptions;
};

type WorkerJobResponse = {
  id: number;
  result?: import("../image-core/platform-preflight.ts").PreflightReport;
  error?: string;
};

self.addEventListener("message", (event: MessageEvent<WorkerJobRequest>) => {
  const { id, input, options } = event.data;
  const response: WorkerJobResponse = { id };
  try {
    response.result = runPlatformPreflightJob(input, options);
  } catch (cause) {
    response.error = cause instanceof Error ? cause.message : String(cause);
  }
  self.postMessage(response);
});
