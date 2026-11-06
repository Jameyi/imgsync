import type { PixelBuffer } from "../image-core/types.ts";
import {
  compositeOnBackdrop,
  resolvePlacementAnchor,
  resizeInto,
  type Placement,
  type ResizeMode,
} from "../image-core/composite.ts";

export type { Placement, ResizeMode };
export { resolvePlacementAnchor };

export const PLACEMENTS: ReadonlyArray<{ value: Placement; label: string }> = [
  { value: "top-left", label: "Top left" },
  { value: "top", label: "Top" },
  { value: "top-right", label: "Top right" },
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom", label: "Bottom" },
  { value: "bottom-right", label: "Bottom right" },
];

export const FIT_MODES: readonly ResizeMode[] = ["cover", "contain", "stretch"];

export type CompositeJobInput = {
  background: PixelBuffer;
  foreground: PixelBuffer;
  fitMode: ResizeMode;
  placement: Placement;
  scalePercent: number;
};

export type CompositedImage = {
  data: Uint8Array;
  width: number;
  height: number;
};

const encodePng = async (image: PixelBuffer): Promise<Uint8Array> => {
  const canvas = new OffscreenCanvas(image.width, image.height);
  const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  const pixels = context.createImageData(image.width, image.height);
  pixels.data.set(image.data);
  context.putImageData(pixels, 0, 0);
  const blob = await canvas.convertToBlob({ type: "image/png" });
  return new Uint8Array(await blob.arrayBuffer());
};

/**
 * Composites the foreground onto the background: the foreground first fits
 * the backdrop box per `fitMode`, is scaled by `scalePercent`, then placed
 * per `placement`. Output keeps the backdrop's size and is PNG-encoded.
 */
export const runCompositeJob = async (
  input: CompositeJobInput,
): Promise<CompositedImage> => {
  const { background, foreground, fitMode, placement, scalePercent } = input;
  const fitted = resizeInto(foreground, background.width, background.height, fitMode);
  const scaledW = Math.max(1, Math.round((background.width * scalePercent) / 100));
  const scaledH = Math.max(1, Math.round((background.height * scalePercent) / 100));
  const scaled = resizeInto(fitted, scaledW, scaledH, "stretch");
  const composited = compositeOnBackdrop(scaled, background, { placement });
  return {
    data: await encodePng(composited),
    width: composited.width,
    height: composited.height,
  };
};

type WorkerJobRequest = { id: number; input: CompositeJobInput };
type WorkerJobResponse = {
  id: number;
  result?: CompositedImage;
  error?: string;
};

export const applyImageComposite = (
  input: CompositeJobInput,
): Promise<CompositedImage> => {
  if (typeof Worker === "undefined") {
    return runCompositeJob(input);
  }
  const worker = new Worker(new URL("./image-composite.worker.ts", import.meta.url));
  return new Promise<CompositedImage>((resolve, reject) => {
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
