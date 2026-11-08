import { runMockupJob } from "./device-frame.ts";

type WorkerJobRequest = { id: number; input: Parameters<typeof runMockupJob>[0] };

type WorkerJobResponse = {
  id: number;
  result?: Awaited<ReturnType<typeof runMockupJob>>;
  error?: string;
};

self.addEventListener("message", (event: MessageEvent<WorkerJobRequest>) => {
  const { id, input } = event.data;
  const response: WorkerJobResponse = { id };
  runMockupJob(input)
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
