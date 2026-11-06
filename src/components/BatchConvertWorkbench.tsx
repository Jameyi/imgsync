"use client";

import { useEffect, useRef, useState } from "react";
import type { ToolSpec } from "@/config/tools";
import { track } from "@/lib/tools/runtime";
import {
  buildZipArchiveName,
  isBatchSizeOk,
  MAX_BATCH_FILES,
  runBatchConvert,
  summarizeBatch,
  type BatchResult,
} from "@/lib/tools/batch-convert";
import {
  applyFormatConvert,
  lookupFormat,
  type ConvertFormat,
} from "@/lib/tools/format-convert";
import { buildZip } from "@/lib/image-core/zip";
import type { PixelBuffer } from "@/lib/image-core/types";

const decodeImage = async (file: File): Promise<PixelBuffer> => {
  const bitmap = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  context.drawImage(bitmap, 0, 0);
  const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);
  bitmap.close();
  return {
    width: imageData.width,
    height: imageData.height,
    data: imageData.data,
  };
};

const formatKB = (bytes: number): string =>
  `${Math.max(1, Math.round(bytes / 1024))} KB`;

type ItemState = {
  file: File;
  pixels: PixelBuffer | null;
  status: "pending" | "done" | "failed" | "error";
  message?: string;
};

export default function BatchConvertWorkbench({
  tool,
}: {
  tool: ToolSpec;
}) {
  const [items, setItems] = useState<ItemState[]>([]);
  const [format, setFormat] = useState<ConvertFormat>("webp");
  const [quality, setQuality] = useState(0.85);
  const [zipResult, setZipResult] = useState<{ url: string; size: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    track({ tool: tool.slug, step: "visit" });
    return () => {
      if (zipResult) URL.revokeObjectURL(zipResult.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool.slug]);

  const loadFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorText("");
    setZipResult(null);
    const list = Array.from(files);
    if (!isBatchSizeOk(list.length)) {
      setErrorText(
        `Batch limit is ${MAX_BATCH_FILES} files — you dropped ${list.length}. Split the drop and run a second batch.`,
      );
      return;
    }
    setItems(
      list.map((file) => ({ file, pixels: null, status: "pending" as const })),
    );
  };

  const runBatch = async () => {
    if (items.length === 0) return;
    setBusy(true);
    setErrorText("");
    track({ tool: tool.slug, step: "tool_use" });
    try {
      const decoded = await Promise.all(
        items.map(async (item) => ({
          sourceName: item.file.name,
          source: await decodeImage(item.file),
        })),
      );
      setItems((prev) =>
        prev.map((item) => ({ ...item, status: "pending" as const })),
      );
      const results = await runBatchConvert(decoded, {
        format,
        quality,
        convert: applyFormatConvert,
      });
      setResultStates(results, decoded.map((item) => item.sourceName));
      const summary = summarizeBatch(results);
      if (summary.succeeded.length > 0) {
        const zipBytes = new Uint8Array(
          buildZip(
            summary.succeeded.map((entry) => ({ name: entry.name, data: entry.data })),
          ),
        );
        const blob = new Blob([zipBytes.slice().buffer], { type: "application/zip" });
        const url = URL.createObjectURL(blob);
        if (zipResult) URL.revokeObjectURL(zipResult.url);
        setZipResult({ url, size: zipBytes.byteLength });
        track({ tool: tool.slug, step: "export_done" });
      }
    } catch (cause) {
      setErrorText(
        cause instanceof Error ? cause.message : "Batch failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const setResultStates = (results: BatchResult[], sourceNames: string[]) => {
    setItems(
      sourceNames.map((sourceName, i) => {
        const result = results[i];
        return {
          file: items[i]?.file ?? (null as unknown as File),
          pixels: null,
          status: result.ok ? ("done" as const) : ("failed" as const),
          message: result.ok ? undefined : result.error,
        };
      }),
    );
  };

  const spec = lookupFormat(format);

  return (
    <div>
      <div
        className="dropzone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          loadFiles(event.dataTransfer.files);
        }}
      >
        <p className="dropzone-title">
          {items.length > 0
            ? `${items.length} file${items.length > 1 ? "s" : ""} queued (limit ${MAX_BATCH_FILES})`
            : `Drop up to ${MAX_BATCH_FILES} images to convert`}
        </p>
        <button
          type="button"
          className="button button-outline mt-3"
          onClick={() => inputRef.current?.click()}
        >
          Choose files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => loadFiles(event.target.files)}
        />
      </div>

      {items.length > 0 && (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="batch-format" className="mono-label block">
                CONVERT TO
              </label>
              <select
                id="batch-format"
                value={format}
                onChange={(event) => setFormat(event.target.value as ConvertFormat)}
                className="mt-2 w-full"
              >
                {(["jpeg", "png", "webp"] as const).map((name) => (
                  <option key={name} value={name}>
                    {name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            {spec?.lossy && (
              <div>
                <label
                  htmlFor="batch-quality"
                  className="mono-label flex items-center justify-between"
                >
                  <span>QUALITY</span>
                  <span>{Math.round(quality * 100)}%</span>
                </label>
                <input
                  id="batch-quality"
                  type="range"
                  min={5}
                  max={100}
                  value={Math.round(quality * 100)}
                  onChange={(event) =>
                    setQuality(Number(event.target.value) / 100)
                  }
                  className="mt-2 w-full"
                />
              </div>
            )}
          </div>

          {errorText && (
            <p role="alert" className="mt-3 text-[12px] text-red-600">
              {errorText}
            </p>
          )}

          <button
            type="button"
            className="button button-dark mt-4 w-full"
            disabled={busy}
            onClick={() => void runBatch()}
          >
            {busy
              ? "Converting…"
              : `Convert ${items.length} file${items.length > 1 ? "s" : ""} → ${spec?.ext ?? ""}`}
          </button>

          {zipResult && (
            <a
              href={zipResult.url}
              download={buildZipArchiveName()}
              className="button button-dark mt-3 inline-block w-full text-center"
            >
              Download zip ({formatKB(zipResult.size)})
            </a>
          )}

          <ul className="mt-4 space-y-1 text-[12px]">
            {items.map((item, i) => (
              <li key={`${item.file.name}-${i}`} className="flex items-center gap-2">
                <span
                  className={
                    item.status === "done"
                      ? "text-green-600"
                      : item.status === "failed"
                        ? "text-red-600"
                        : "text-[var(--muted)]"
                  }
                >
                  {item.status === "done"
                    ? "✓"
                    : item.status === "failed"
                      ? "✗"
                      : "•"}
                </span>
                <span className="truncate">{item.file.name}</span>
                {item.message && (
                  <span className="text-[var(--muted)]">— {item.message}</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
