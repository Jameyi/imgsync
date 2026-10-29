"use client";

import { useEffect, useRef, useState } from "react";
import type { ToolSpec } from "@/config/tools";
import { loadImageFromFiles, track } from "@/lib/tools/runtime";
import {
  applyCompressQuality,
  createQualityEncoder,
  type EncodedImage,
} from "@/lib/tools/compress-quality";

const formatKB = (bytes: number): string =>
  `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default function CompressQualityWorkbench({
  tool,
}: {
  tool: ToolSpec;
}) {
  const [source, setSource] = useState<{
    width: number;
    height: number;
    data: Uint8ClampedArray;
  } | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [quality, setQuality] = useState(0.8);
  const [result, setResult] = useState<EncodedImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    track({ tool: tool.slug, step: "visit" });
    return () => {
      if (previewURL) URL.revokeObjectURL(previewURL);
    };
  }, [tool.slug, previewURL]);

  const loadFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorText("");
    try {
      const [loaded] = await loadImageFromFiles([files[0]]);
      setSource(loaded.source);
      setFileName(loaded.fileName);
      setPreviewURL(loaded.previewURL);
      setResult(null);
      setQuality(0.8);
    } catch (cause) {
      setErrorText(
        cause instanceof Error ? cause.message : "Could not read that file.",
      );
    }
  };

  // Live size preview on slider change (debounced via busy flag).
  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const encode = createQualityEncoder(source);
          const encoded = await encode(quality);
          if (!cancelled) setResult(encoded);
        } catch {
          /* preview failures stay silent; export surfaces errors */
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [source, quality]);

  const exportJPEG = async () => {
    if (!source) return;
    setBusy(true);
    setErrorText("");
    track({ tool: tool.slug, step: "tool_use" });
    try {
      const encoded = await applyCompressQuality({ source }, quality);
      const blob = new Blob([encoded.data.slice().buffer], {
        type: "image/jpeg",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${fileName.replace(/\.[^.]+$/, "")}-q${Math.round(
        quality * 100,
      )}.jpg`;
      anchor.click();
      URL.revokeObjectURL(url);
      track({ tool: tool.slug, step: "export_done" });
    } catch (cause) {
      setErrorText(cause instanceof Error ? cause.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  };

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
          {source
            ? `${fileName} — ${source.width}×${source.height}`
            : "Drop an image to compress"}
        </p>
        <button
          type="button"
          className="button button-outline mt-3"
          onClick={() => inputRef.current?.click()}
        >
          {source ? "Replace image" : "Choose file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => void loadFile(event.target.files)}
        />
      </div>

      {source && (
        <>
          <div className="mt-4">
            <label
              htmlFor="quality-slider"
              className="mono-label flex items-center justify-between"
            >
              <span>QUALITY</span>
              <span>{Math.round(quality * 100)}%</span>
            </label>
            <input
              id="quality-slider"
              type="range"
              min={5}
              max={100}
              value={Math.round(quality * 100)}
              onChange={(event) =>
                setQuality(Number(event.target.value) / 100)
              }
              className="mt-2 w-full"
            />
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Live size:{" "}
              <b className="text-[var(--foreground)]">
                {result ? formatKB(result.data.byteLength) : "…"}
              </b>
            </p>
          </div>

          {errorText && (
            <p role="alert" className="mt-3 text-[12px] text-red-600">
              {errorText}
            </p>
          )}

          <button
            type="button"
            className="button button-dark mt-4 w-full"
            disabled={busy || !result}
            onClick={() => void exportJPEG()}
          >
            {busy
              ? "Encoding…"
              : `Download JPEG (${result ? formatKB(result.data.byteLength) : "…"})`}
          </button>
        </>
      )}
    </div>
  );
}
