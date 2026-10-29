import type { PixelBuffer } from "../image-core/types.ts";
import { runCompressQualityJob } from "./compress-quality.ts";

type WorkerJobRequest = {
  id: number;
  input: { source: PixelBuffer };
  quality: number;
};

type WorkerJobResponse = {
  id: number;
  result?: Awaited<ReturnType<typeof runCompressQualityJob>>;
  error?: string;
};

self.addEventListener("message", (event: MessageEvent<WorkerJobRequest>) => {
  const { id, input, quality } = event.data;
  const response: WorkerJobResponse = { id };
  runCompressQualityJob(input, quality)
    .then((result) => {
      response.result = result;
    })
    .catch((cause: unknown) => {
      response.error = cause instanceof Error ? cause.message : String(cause);
    })
    .finally(() => {
      self.postMessage(response);
    });
});
