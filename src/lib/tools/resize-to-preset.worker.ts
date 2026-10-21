import type { PixelBuffer } from "../image-core/types.ts";
import {
  runResizeToPresetJob,
  type ResizeToPresetJobOptions,
} from "./resize-to-preset.ts";

type WorkerJobRequest = {
  id: number;
  input: PixelBuffer;
  options: ResizeToPresetJobOptions;
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
    response.result = runResizeToPresetJob(input, options);
  } catch (cause) {
    response.error = cause instanceof Error ? cause.message : String(cause);
  }
  self.postMessage(response);
});
