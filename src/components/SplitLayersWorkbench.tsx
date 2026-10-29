"use client";

import { useEffect, useRef, useState } from "react";
import type { ToolSpec } from "@/config/tools";
import { loadImageFromFiles, track } from "@/lib/tools/runtime";
import {
  applySplitLayers,
  type SplitLayersResult,
} from "@/lib/tools/split-layers";
import { buildPsd } from "@/lib/image-core/psdExport";

export default function SplitLayersWorkbench({ tool }: { tool: ToolSpec }) {
  const [fileName, setFileName] = useState("");
  const [source, setSource] = useState<{
    width: number;
    height: number;
    data: Uint8ClampedArray;
  } | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [result, setResult] = useState<SplitLayersResult | null>(null);
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
    } catch (cause) {
      setErrorText(
        cause instanceof Error ? cause.message : "Could not read that file.",
      );
    }
  };

  const split = async () => {
    if (!source) return;
    setBusy(true);
    setErrorText("");
    track({ tool: tool.slug, step: "tool_use" });
    try {
      const splitResult = await applySplitLayers({ source });
      setResult(splitResult);
    } catch (cause) {
      setErrorText(cause instanceof Error ? cause.message : "Split failed.");
    } finally {
      setBusy(false);
    }
  };

  const renderLayerPreview = (
    buffer: { width: number; height: number; data: Uint8ClampedArray },
  ): string => {
    const canvas = document.createElement("canvas");
    canvas.width = buffer.width;
    canvas.height = buffer.height;
    const ctx = canvas.getContext("2d")!;
    const imageData = new ImageData(
      new Uint8ClampedArray(buffer.data),
      buffer.width,
      buffer.height,
    );
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  };

  const exportPsd = () => {
    if (!result) return;
    try {
      const buffer = buildPsd([
        { name: "Subject", imageData: result.subject },
        { name: "Background", imageData: result.background },
      ]);
      const blob = new Blob([buffer], { type: "image/vnd.adobe.photoshop" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${fileName.replace(/\.[^.]+$/, "")}-layers.psd`;
      anchor.click();
      URL.revokeObjectURL(url);
      track({ tool: tool.slug, step: "export_done" });
    } catch (cause) {
      setErrorText(cause instanceof Error ? cause.message : "PSD export failed.");
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
            : "Drop one photo — plain-color backdrops split best"}
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

      {errorText && (
        <p role="alert" className="mt-3 text-[12px] text-red-600">
          {errorText}
        </p>
      )}

      {source && !result && (
        <button
          type="button"
          className="button button-dark mt-4 w-full"
          disabled={busy}
          onClick={() => void split()}
        >
          {busy ? "Splitting…" : "Split into subject + background"}
        </button>
      )}

      {result && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["Subject", result.subject],
                ["Background", result.background],
              ] as const
            ).map(([label, buffer]) => (
              <figure key={label} className="rounded border border-[var(--border)] p-2">
                <figcaption className="mono-label mb-1">
                  {label.toUpperCase()}
                </figcaption>
                {/* previewURL checked pattern via inline style */}
                <img
                  src={renderLayerPreview(buffer)}
                  alt={`${label} layer preview`}
                  className="w-full rounded"
                  style={{
                    backgroundImage:
                      "repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 50% / 12px 12px",
                  }}
                />
              </figure>
            ))}
          </div>
          <button
            type="button"
            className="button button-dark mt-4 w-full"
            onClick={exportPsd}
          >
            Download 2-layer PSD
          </button>
          <button
            type="button"
            className="button button-outline mt-2 w-full"
            onClick={() => setResult(null)}
          >
            Start over
          </button>
        </div>
      )}
    </div>
  );
}
