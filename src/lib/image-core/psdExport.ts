import { writePsd } from "ag-psd";
import type { PixelBuffer } from "./types.ts";

export type PsdLayerInput = {
  name: string;
  imageData: PixelBuffer;
  offset?: { x: number; y: number };
  visible?: boolean;
};

export type PsdExportOptions = {
  /** Canvas size; defaults to the largest layer's bounding size. */
  width?: number;
  height?: number;
};

export const PSD_MAGIC = "8BPS";

/** Validates inputs and builds a layered PSD file as an ArrayBuffer. */
export const buildPsd = (
  layers: readonly PsdLayerInput[],
  options: PsdExportOptions = {},
): ArrayBuffer => {
  if (layers.length === 0) {
    throw new Error("Cannot export an empty PSD: provide at least one layer");
  }

  const width = options.width ?? Math.max(...layers.map((l) => l.imageData.width));
  const height = options.height ?? Math.max(...layers.map((l) => l.imageData.height));

  const children = layers.map((layer) => ({
    name: layer.name,
    hidden: layer.visible === false,
    left: layer.offset?.x ?? 0,
    top: layer.offset?.y ?? 0,
    // ag-psd fills missing canvas from imageData; canvas requires DOM, so we
    // hand it raw pixel data via imageData-friendly fields instead.
    imageData: {
      width: layer.imageData.width,
      height: layer.imageData.height,
      data: new Uint8Array(layer.imageData.data.buffer.slice(0)),
    },
  }));

  const buffer = writePsd(
    {
      width,
      height,
      children,
    },
    // No composite canvas is provided (DOM-free): Photoshop tolerates a PSD
    // without composite image data. No trimming — trimming would route
    // through ag-psd's canvas-based cropper, which needs DOM.
    { generateThumbnail: false, noBackground: true },
  );
  return buffer;
};

/** True when the buffer starts with the PSD magic bytes ("8BPS"). */
export const hasPsdMagic = (buffer: ArrayBuffer): boolean => {
  if (buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer, 0, 4);
  return (
    bytes[0] === 0x38 && // "8"
    bytes[1] === 0x42 && // "B"
    bytes[2] === 0x50 && // "P"
    bytes[3] === 0x53 // "S"
  );
};
