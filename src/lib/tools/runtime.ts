import type { PixelBuffer } from "../image-core/types.ts";

export const MAX_SINGLE_THREAD_PIXELS = 4_000_000;

export const shouldUseWorker = (totalPixels: number): boolean =>
  totalPixels >= MAX_SINGLE_THREAD_PIXELS;

export type TrackStep = "visit" | "tool_use" | "export_done" | "promo_click";

export type TrackEvent = {
  tool: string;
  step: TrackStep;
  meta?: Record<string, string | number | boolean>;
};

type Transport = (event: TrackEvent) => void;

const noop: Transport = () => {};

let transport: Transport = noop;

export const setTrackTransport = (next?: Transport): void => {
  transport = next ?? noop;
};

export const track = (event: TrackEvent): void => {
  transport(event);
};

export type LoadedImage = {
  fileName: string;
  width: number;
  height: number;
  source: PixelBuffer;
  previewURL: string;
  fileSizeBytes: number;
};

export const loadImageFromFiles = async (
  files: readonly File[],
): Promise<LoadedImage[]> =>
  Promise.all(
    files.map(async (file) => {
      const bitmap = await createImageBitmap(file);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
      context.drawImage(bitmap, 0, 0);
      const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);
      bitmap.close();
      return {
        fileName: file.name,
        width: imageData.width,
        height: imageData.height,
        source: { width: imageData.width, height: imageData.height, data: imageData.data },
        previewURL: URL.createObjectURL(file),
        fileSizeBytes: file.size,
      };
    }),
  );
