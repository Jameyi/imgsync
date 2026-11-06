import { lookupFormat, type ConvertFormat } from "./format-convert.ts";

export const MAX_BATCH_FILES = 30;

export const isBatchSizeOk = (count: number): boolean =>
  count >= 1 && count <= MAX_BATCH_FILES;

/**
 * Builds one output file name per source, keeping stems and swapping the
 * extension; name collisions get a -1, -2, … suffix so every result is unique.
 */
export const buildBatchOutputNames = (
  sourceNames: readonly string[],
  format: ConvertFormat,
): string[] => {
  const ext = lookupFormat(format)?.ext ?? ".bin";
  const used = new Set<string>();
  const counters = new Map<string, number>();
  return sourceNames.map((sourceName) => {
    const dot = sourceName.lastIndexOf(".");
    const stem = dot > 0 ? sourceName.slice(0, dot) : sourceName;
    const base = `${stem}${ext}`;
    const seen = counters.get(base) ?? 0;
    let name = base;
    if (seen > 0 || used.has(base)) {
      name = `${stem}-${seen + 1}${ext}`;
      let n = seen + 1;
      while (used.has(name)) {
        n += 1;
        name = `${stem}-${n}${ext}`;
      }
      counters.set(base, n);
    }
    used.add(name);
    return name;
  });
};

/** Archive name for the batch download, e.g. imgsync-batch-20261106.zip. */
export const buildZipArchiveName = (now: Date = new Date()): string => {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `imgsync-batch-${yyyy}${mm}${dd}.zip`;
};

export type BatchResult =
  | { ok: true; name: string; data: Uint8Array }
  | { ok: false; name: string; error: string };

export type BatchSummary = {
  succeeded: Array<{ name: string; data: Uint8Array }>;
  failed: Array<{ name: string; error: string }>;
};

/** Partitions raw per-file results; one failure never sinks the batch. */
export const summarizeBatch = (results: readonly BatchResult[]): BatchSummary => {
  const succeeded: BatchSummary["succeeded"] = [];
  const failed: BatchSummary["failed"] = [];
  for (const result of results) {
    if (result.ok) succeeded.push({ name: result.name, data: result.data });
    else failed.push({ name: result.name, error: result.error });
  }
  return { succeeded, failed };
};

export type BatchItem = {
  sourceName: string;
  source: PixelBufferLike;
};

type PixelBufferLike = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

export type BatchOptions = {
  format: ConvertFormat;
  quality: number;
  /** Single-file converter, mirroring the format-convert pipeline. */
  convert: (input: {
    source: PixelBufferLike;
    format: ConvertFormat;
    quality: number;
  }) => Promise<{ data: Uint8Array }>;
};

/** Runs every file through the converter in parallel; failures are captured per file. */
export const runBatchConvert = async (
  items: readonly BatchItem[],
  options: BatchOptions,
): Promise<BatchResult[]> => {
  const names = buildBatchOutputNames(
    items.map((item) => item.sourceName),
    options.format,
  );
  return Promise.all(
    items.map(async (item, i) => {
      try {
        const converted = await options.convert({
          source: item.source,
          format: options.format,
          quality: options.quality,
        });
        return { ok: true as const, name: names[i], data: converted.data };
      } catch (cause) {
        return {
          ok: false as const,
          name: names[i],
          error: cause instanceof Error ? cause.message : String(cause),
        };
      }
    }),
  );
};
