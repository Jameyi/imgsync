import { splitLayers } from "../image-core/split-layers.ts";
import type { SplitLayersInput } from "./split-layers.ts";

type WorkerJobRequest = {
  id: number;
  input: SplitLayersInput;
};

type WorkerJobResponse = {
  id: number;
  result?: ReturnType<typeof splitLayers>;
  error?: string;
};

self.addEventListener("message", (event: MessageEvent<WorkerJobRequest>) => {
  const { id, input } = event.data;
  const response: WorkerJobResponse = { id };
  try {
    response.result = splitLayers(input.source);
  } catch (cause) {
    response.error = cause instanceof Error ? cause.message : String(cause);
  }
  self.postMessage(response);
});
