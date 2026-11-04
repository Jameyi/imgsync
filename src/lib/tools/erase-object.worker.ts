import type { EraseObjectInput } from "./erase-object.ts";

type WorkerJobRequest = {
  id: number;
  input: EraseObjectInput;
};

type WorkerJobResponse = {
  id: number;
  result?: Awaited<ReturnType<typeof import("../image-core/telea-inpaint.ts").inpaintFill>>;
  error?: string;
};

self.onmessage = async (event: MessageEvent<WorkerJobRequest>) => {
  const { id, input } = event.data;
  const response: WorkerJobResponse = { id };
  try {
    const { inpaintFill } = await import("../image-core/telea-inpaint.ts");
    response.result = await inpaintFill(input.source, input.mask, {
      radius: input.radius,
    });
  } catch (cause) {
    response.error = cause instanceof Error ? cause.message : String(cause);
  }
  self.postMessage(response);
};
