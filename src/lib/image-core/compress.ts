import type { EncodedImage } from "./compress-to-size.ts";

export type QualityEncoder = (quality: number) => Promise<EncodedImage>;

export type CompressOptions = {
  quality: number; // 0..1
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Encodes the source at a direct quality value (clamped to [0, 1]). */
export const encodeAtQuality = async (
  encode: QualityEncoder,
  quality: number,
): Promise<EncodedImage> => encode(clamp01(quality));
