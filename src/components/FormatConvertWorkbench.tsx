"use client";

import { useEffect, useRef, useState } from "react";
import type { ToolSpec } from "@/config/tools";
import { track } from "@/lib/tools/runtime";
import {
  applyFormatConvert,
  buildOutputFileName,
  FORMATS,
  lookupFormat,
  type ConvertFormat,
} from "@/lib/tools/format-convert";
import {
  applyExifOrientation,
  readExifOrientation,
} from "@/lib/image-core/exif";

const formatKB = (bytes: number): string =>
  `${Math.max(1, Math.round(bytes / 1024))} KB`;

type SourceState = {
  fileName: string;
  source: { width: number; height: number; data: Uint8ClampedArray };
  previewURL: string;
  fileSizeBytes: number;
  exifApplied: boolean;
};

export default function FormatConvertWorkbench({
  tool,
}: {
  tool: ToolSpec;
}) {
  const [state, setState] = useState<SourceState | null>(null);
  const [format, setFormat] = useState<ConvertFormat>("jpeg");
  const [quality, setQuality] = useState(0.9);
  const [resultSize, setResultSize] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    track({ tool: tool.slug, step: "visit" });
    return () => {
      if (state?.previewURL) URL.revokeObjectURL(state.previewURL);
    };
  }, [tool.slug, state?.previewURL]);

  const loadFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorText("");
    try {
      const file = files[0];
      const bitmap = await createImageBitmap(file);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
      context.drawImage(bitmap, 0, 0);
      const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);
      bitmap.close();
      // Auto-straighten per EXIF orientation (phone photos).
      const bytes = new Uint8Array(await file.arrayBuffer());
      const orientation = readExifOrientation(bytes);
      const pixels =
        orientation && orientation !== 1
          ? applyExifOrientation(
              {
                width: imageData.width,
                height: imageData.height,
                data: imageData.data,
              },
              orientation,
            )
          : {
              width: imageData.width,
              height: imageData.height,
              data: imageData.data,
            };
      setResultSize(null);
      setState({
        fileName: file.name,
        source: pixels,
        previewURL: URL.createObjectURL(file),
        fileSizeBytes: file.size,
        exifApplied: (orientation ?? 1) !== 1,
      });
    } catch (cause) {
      setErrorText(
        cause instanceof Error ? cause.message : "Could not read that file.",
      );
    }
  };

  // Live size preview on control change (debounced).
  useEffect(() => {
    if (!state) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const spec = lookupFormat(format);
          if (!spec) return;
          const converted = await applyFormatConvert({
            source: state.source,
            format,
            quality,
          });
          if (!cancelled) setResultSize(converted.data.byteLength);
        } catch {
          /* preview failures stay silent; export surfaces errors */
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [state, format, quality]);

  const exportImage = async () => {
    if (!state) return;
    setBusy(true);
    setErrorText("");
    track({ tool: tool.slug, step: "tool_use" });
    try {
      const converted = await applyFormatConvert({
        source: state.source,
        format,
        quality,
      });
      const blob = new Blob([converted.data.slice().buffer], {
        type: converted.mime,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = buildOutputFileName(state.fileName, format);
      anchor.click();
      URL.revokeObjectURL(url);
      track({ tool: tool.slug, step: "export_done" });
    } catch (cause) {
      setErrorText(cause instanceof Error ? cause.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  };

  const spec = lookupFormat(format);

  return (
    <div>
      <div
        className="dropzone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void loadFile(event.dataTransfer.files);
        }}
      >
        <p className="dropzone-title">
          {state
            ? `${state.fileName} — ${state.source.width}×${state.source.height} · ${formatKB(state.fileSizeBytes)}`
            : "Drop an image to convert"}
        </p>
        {state?.exifApplied && (
          <p className="mt-1 text-[11px] text-[var(--muted)]">
            Auto-straightened from EXIF orientation.
          </p>
        )}
        <button
          type="button"
          className="button button-outline mt-3"
          onClick={() => inputRef.current?.click()}
        >
          {state ? "Replace image" : "Choose file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => void loadFile(event.target.files)}
        />
      </div>

      {state && (
        <>
          <div className="mt-4">
            <label
              htmlFor="format-select"
              className="mono-label block"
            >
              CONVERT TO
            </label>
            <select
              id="format-select"
              value={format}
              onChange={(event) => setFormat(event.target.value as ConvertFormat)}
              className="mt-2 w-full"
            >
              {Object.keys(FORMATS).map((name) => (
                <option key={name} value={name}>
                  {FORMATS[name as ConvertFormat].mime.replace("image/", "").toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {spec?.lossy && (
            <div className="mt-3">
              <label
                htmlFor="convert-quality"
                className="mono-label flex items-center justify-between"
              >
                <span>QUALITY</span>
                <span>{Math.round(quality * 100)}%</span>
              </label>
              <input
                id="convert-quality"
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

          <p className="mt-3 text-[11px] text-[var(--muted)]">
            Converted size:{" "}
            <b className="text-[var(--foreground)]">
              {resultSize ? formatKB(resultSize) : "…"}
            </b>{" "}
            (was {formatKB(state.fileSizeBytes)})
          </p>

          {errorText && (
            <p role="alert" className="mt-3 text-[12px] text-red-600">
              {errorText}
            </p>
          )}

          <button
            type="button"
            className="button button-dark mt-4 w-full"
            disabled={busy}
            onClick={() => void exportImage()}
          >
            {busy
              ? "Encoding…"
              : `Download ${spec?.ext.replace(".", "").toUpperCase() ?? ""}`}
          </button>
        </>
      )}
    </div>
  );
}
