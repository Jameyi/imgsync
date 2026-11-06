"use client";

import { useEffect, useRef, useState } from "react";
import type { ToolSpec } from "@/config/tools";
import { track } from "@/lib/tools/runtime";
import {
  applyFixOrientation,
  buildFixedFileName,
  isEligibleForExif,
  resolveFixDecision,
} from "@/lib/tools/fix-orientation";
import { readExifOrientation } from "@/lib/image-core/exif";
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

export default function FixOrientationWorkbench({
  tool,
}: {
  tool: ToolSpec;
}) {
  const [state, setState] = useState<{
    fileName: string;
    pixels: PixelBuffer;
    bytes: Uint8Array;
    previewURL: string;
    fileSizeBytes: number;
  } | null>(null);
  const [ineligible, setIneligible] = useState(false);
  const [result, setResult] = useState<{
    url: string;
    size: number;
    rotated: boolean;
    width: number;
    height: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    track({ tool: tool.slug, step: "visit" });
    return () => {
      if (state?.previewURL) URL.revokeObjectURL(state.previewURL);
      if (result) URL.revokeObjectURL(result.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool.slug]);

  const loadFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorText("");
    setResult(null);
    try {
      const file = files[0];
      if (!isEligibleForExif({ name: file.name, type: file.type })) {
        setIneligible(true);
        setState(null);
        return;
      }
      setIneligible(false);
      const pixels = await decodeImage(file);
      setState({
        fileName: file.name,
        pixels,
        bytes: new Uint8Array(await file.arrayBuffer()),
        previewURL: URL.createObjectURL(file),
        fileSizeBytes: file.size,
      });
    } catch (cause) {
      setErrorText(
        cause instanceof Error ? cause.message : "Could not read that file.",
      );
    }
  };

  const fix = async () => {
    if (!state) return;
    setBusy(true);
    setErrorText("");
    track({ tool: tool.slug, step: "tool_use" });
    try {
      const orientation = readExifOrientation(state.bytes);
      const decision = resolveFixDecision(orientation);
      const fixed = await applyFixOrientation({
        source: state.pixels,
        orientation,
      });
      const blob = new Blob([fixed.data.slice().buffer], {
        type: "image/jpeg",
      });
      const url = URL.createObjectURL(blob);
      if (result) URL.revokeObjectURL(result.url);
      setResult({
        url,
        size: fixed.data.byteLength,
        rotated: fixed.rotated,
        width: fixed.width,
        height: fixed.height,
      });
      void decision;
      track({ tool: tool.slug, step: "export_done" });
    } catch (cause) {
      setErrorText(cause instanceof Error ? cause.message : "Fix failed.");
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
          {ineligible
            ? "That file is not a JPEG — EXIF orientation only exists in JPEG photos."
            : state
              ? `${state.fileName} — ${state.pixels.width}×${state.pixels.height} · ${formatKB(state.fileSizeBytes)}`
              : "Drop a JPEG photo to straighten"}
        </p>
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
          accept="image/jpeg,.jpg,.jpeg"
          hidden
          onChange={(event) => void loadFile(event.target.files)}
        />
      </div>

      {ineligible && (
        <p className="mt-3 text-[12px] text-[var(--muted)]">
          PNG and WebP files store orientation differently or not at all —
          convert them here first, then fix orientation if the source was JPEG.
        </p>
      )}

      {state && (
        <>
          {errorText && (
            <p role="alert" className="mt-3 text-[12px] text-red-600">
              {errorText}
            </p>
          )}
          <button
            type="button"
            className="button button-dark mt-4 w-full"
            disabled={busy}
            onClick={() => void fix()}
          >
            {busy ? "Fixing…" : "Read EXIF and export upright JPEG"}
          </button>
          {result && (
            <div className="mt-4">
              <p className="text-[12px] text-[var(--muted)]">
                {result.rotated
                  ? `Rotated to ${result.width}×${result.height}.`
                  : "No rotation was needed — the photo was already upright."}{" "}
                Export size: <b>{formatKB(result.size)}</b>
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="Fixed result"
                className="mt-2 max-h-64 w-auto border border-[var(--muted)]"
              />
              <a
                href={result.url}
                download={buildFixedFileName(state.fileName)}
                className="button button-outline mt-2 inline-block"
              >
                Download {buildFixedFileName(state.fileName)}
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
