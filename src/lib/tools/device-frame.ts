import type { PixelBuffer } from "../image-core/types.ts";
import {
  frameDevice,
  type DeviceFrameOptions,
  type Rgb,
} from "../image-core/device-frame.ts";
import { hexToRgb } from "../image-core/color.ts";

export type { DeviceFrameOptions, Rgb };

export type DevicePreset = "phone" | "tablet";

export const DEVICE_PRESETS: ReadonlyArray<{
  value: DevicePreset;
  label: string;
  bezelWidth: number;
  screenRadius: number;
}> = [
  { value: "phone", label: "Phone", bezelWidth: 10, screenRadius: 28 },
  { value: "tablet", label: "Tablet", bezelWidth: 24, screenRadius: 36 },
];

export type FrameOptionsInput = {
  bezelWidth: number;
  bezelColorHex: string;
  screenRadius: number;
  padding: number;
  backgroundHex: string | null;
};

/**
 * Builds the seam options from UI input. Invalid hex colors resolve to null
 * before any pixel work starts.
 */
export const buildFrameOptions = (
  input: FrameOptionsInput,
): DeviceFrameOptions | null => {
  const bezelColor = hexToRgb(input.bezelColorHex);
  if (!bezelColor) return null;
  let background: Rgb | null = null;
  if (input.backgroundHex !== null) {
    background = hexToRgb(input.backgroundHex);
    if (!background) return null;
  }
  return {
    bezelWidth: Math.max(0, Math.floor(input.bezelWidth)),
    bezelColor,
    screenRadius: Math.max(0, Math.floor(input.screenRadius)),
    padding: Math.max(0, Math.floor(input.padding)),
    background,
  };
};

/** Appends the -mockup suffix and keeps the .png extension. */
export const buildMockupFileName = (sourceName: string): string => {
  const dot = sourceName.lastIndexOf(".");
  const stem = dot > 0 ? sourceName.slice(0, dot) : sourceName;
  return `${stem}-mockup.png`;
};

export type MockupJobInput = {
  source: PixelBuffer;
  options: DeviceFrameOptions;
};

export type MockupImage = {
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

export const runMockupJob = async (
  input: MockupJobInput,
): Promise<MockupImage> => {
  const framed = frameDevice(input.source, input.options);
  return {
    data: await encodePng(framed),
    width: framed.width,
    height: framed.height,
  };
};

type WorkerJobRequest = { id: number; input: MockupJobInput };
type WorkerJobResponse = {
  id: number;
  result?: MockupImage;
  error?: string;
};

export const applyDeviceMockup = (
  input: MockupJobInput,
): Promise<MockupImage> => {
  if (typeof Worker === "undefined") {
    return runMockupJob(input);
  }
  const worker = new Worker(new URL("./device-frame.worker.ts", import.meta.url));
  return new Promise<MockupImage>((resolve, reject) => {
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
