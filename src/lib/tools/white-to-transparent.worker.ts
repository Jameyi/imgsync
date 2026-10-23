import type { PixelBuffer } from "../image-core/types.ts";
import { runWhiteToTransparentJob } from "./white-to-transparent.ts";

type WorkerJobRequest = {
  id: number;
  input: PixelBuffer;
  options?: Parameters<typeof runWhiteToTransparentJob>[1];
};

type WorkerJobResponse = {
  id: number;
  result?: PixelBuffer;
  error?: string;
};

self.addEventListener("message", (event: MessageEvent<WorkerJobRequest>) => {
  const { id, input, options } = event.data;
  const response: WorkerJobResponse = { id };
  try {
    response.result = runWhiteToTransparentJob(input, options);
  } catch (cause) {
    response.error = cause instanceof Error ? cause.message : String(cause);
  }
  self.postMessage(response);
});
