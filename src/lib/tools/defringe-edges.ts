import { defringeEdges } from "../image-core/defringe-edges.ts";
import { shouldUseWorker } from "./runtime.ts";
import type { PixelBuffer } from "../image-core/types.ts";

export const runDefringeEdgesJob = (input: PixelBuffer): PixelBuffer =>
  defringeEdges(input);

type WorkerJobRequest = {
  id: number;
  input: PixelBuffer;
};

type WorkerJobResponse = {
  id: number;
  result?: PixelBuffer;
  error?: string;
};

export const applyDefringeEdges = (input: PixelBuffer): Promise<PixelBuffer> => {
  if (typeof Worker === "undefined" || !shouldUseWorker(input.width * input.height)) {
    return Promise.resolve(runDefringeEdgesJob(input));
  }
  const worker = new Worker(
    new URL("./defringe-edges.worker.ts", import.meta.url),
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
