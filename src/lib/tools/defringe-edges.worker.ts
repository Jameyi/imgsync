import type { PixelBuffer } from "../image-core/types.ts";
import { runDefringeEdgesJob } from "./defringe-edges.ts";

type WorkerJobRequest = {
  id: number;
  input: PixelBuffer;
};

type WorkerJobResponse = {
  id: number;
  result?: PixelBuffer;
  error?: string;
};

self.addEventListener("message", (event: MessageEvent<WorkerJobRequest>) => {
  const { id, input } = event.data;
  const response: WorkerJobResponse = { id };
  try {
    response.result = runDefringeEdgesJob(input);
  } catch (cause) {
    response.error = cause instanceof Error ? cause.message : String(cause);
  }
  self.postMessage(response);
});
