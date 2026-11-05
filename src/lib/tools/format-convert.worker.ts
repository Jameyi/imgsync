import { runConvertJob } from "./format-convert.ts";

type WorkerJobRequest = { id: number; input: Parameters<typeof runConvertJob>[0] };

type WorkerJobResponse = {
  id: number;
  result?: Awaited<ReturnType<typeof runConvertJob>>;
  error?: string;
};

self.addEventListener("message", (event: MessageEvent<WorkerJobRequest>) => {
  const { id, input } = event.data;
  const response: WorkerJobResponse = { id };
  runConvertJob(input)
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
