export type EncodedImage = {
  data: Uint8Array;
  width: number;
  height: number;
};

export type SizeEncoder = (
  quality: number,
  scale: number,
) => Promise<EncodedImage>;

export type CompressToSizeOptions = {
  targetBytes: number;
};

export type CompressToSizeResult = EncodedImage & {
  hasHitTarget: boolean;
};

const BISECTION_ROUNDS = 7;
const SCALE_STEP = 0.5;
const MIN_SCALED_SIDE = 1;

export const compressToSize = async (
  encode: SizeEncoder,
  options: CompressToSizeOptions,
): Promise<CompressToSizeResult> => {
  const { targetBytes } = options;
  let scale = 1;
  let best: EncodedImage | undefined;
  let closest: EncodedImage | undefined;
  for (;;) {
    let low = 0;
    let high = 1;
    let smallestSide = Infinity;
    for (let round = 0; round < BISECTION_ROUNDS; round++) {
      const quality = (low + high) / 2;
      const encoded = await encode(quality, scale);
      smallestSide = Math.min(smallestSide, encoded.width, encoded.height);
      const bytes = encoded.data.byteLength;
      if (bytes < (closest?.data.byteLength ?? Infinity)) closest = encoded;
      if (bytes <= targetBytes && (best === undefined || bytes > best.data.byteLength)) {
        best = encoded;
      }
      if (bytes <= targetBytes) low = quality;
      else high = quality;
    }
    if (best) return { ...best, hasHitTarget: true };
    if (smallestSide <= MIN_SCALED_SIDE) break;
    scale *= SCALE_STEP;
  }
  return { ...closest!, hasHitTarget: false };
};
