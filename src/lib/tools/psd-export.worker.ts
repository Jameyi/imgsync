import { buildPsd } from "../image-core/psdExport.ts";
import type { PsdLayerInput, PsdExportOptions } from "./psd-export.ts";

type WorkerJobRequest = {
  id: number;
  layers: readonly PsdLayerInput[];
  options?: PsdExportOptions;
};

type WorkerJobResponse = {
  id: number;
  result?: ArrayBuffer;
  error?: string;
};

self.addEventListener("message", (event: MessageEvent<WorkerJobRequest>) => {
  const { id, layers, options } = event.data;
  const response: WorkerJobResponse = { id };
  try {
    response.result = buildPsd(layers, options);
  } catch (cause) {
    response.error = cause instanceof Error ? cause.message : String(cause);
  }
  self.postMessage(response);
});
