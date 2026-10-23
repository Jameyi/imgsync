import { runCompressToSizeJob, type CompressToSizeInput } from "./compress-to-size.ts";
import type { CompressToSizeResult } from "../image-core/compress-to-size.ts";

type WorkerJobRequest = {
  id: number;
  input: CompressToSizeInput;
};

type WorkerJobResponse = {
  id: number;
  result?: CompressToSizeResult;
  error?: string;
};

self.addEventListener("message", (event: MessageEvent<WorkerJobRequest>) => {
  const { id, input } = event.data;
  runCompressToSizeJob(input)
    .then((result) => self.postMessage({ id, result } as WorkerJobResponse))
    .catch((cause: unknown) =>
      self.postMessage({
        id,
        error: cause instanceof Error ? cause.message : String(cause),
      }),
    );
});
