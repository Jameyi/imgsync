"use client";

import { useEffect, useRef, useState } from "react";
import type { ToolSpec } from "@/config/tools";
import { track } from "@/lib/tools/runtime";
import {
  applySmoothEdges,
  buildSmoothFileName,
  isEligibleForSmooth,
  STRENGTH_LEVELS,
  type SmoothStrength,
} from "@/lib/tools/smooth-edges";
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

const passesByStrength = (strength: SmoothStrength): number =>
  STRENGTH_LEVELS.find((level) => level.value === strength)?.passes ?? 1;

export default function SmoothEdgesWorkbench({
  tool,
}: {
  tool: ToolSpec;
}) {
  const [state, setState] = useState<{
    fileName: string;
    pixels: PixelBuffer;
    previewURL: string;
  } | null>(null);
  const [ineligible, setIneligible] = useState(false);
  const [strength, setStrength] = useState<SmoothStrength>("standard");
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);
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
      if (!isEligibleForSmooth({ name: file.name, type: file.type })) {
        setIneligible(true);
        setState(null);
        return;
      }
      setIneligible(false);
      const pixels = await decodeImage(file);
      setState({
        fileName: file.name,
        pixels,
        previewURL: URL.createObjectURL(file),
      });
    } catch (cause) {
      setErrorText(
        cause instanceof Error ? cause.message : "Could not read that file.",
      );
    }
  };

  const smooth = async () => {
    if (!state) return;
    setBusy(true);
    setErrorText("");
    track({ tool: tool.slug, step: "tool_use" });
    try {
      const smoothed = await applySmoothEdges({
        source: state.pixels,
        passes: passesByStrength(strength),
      });
      const blob = new Blob([smoothed.data.slice().buffer], {
        type: "image/png",
      });
      const url = URL.createObjectURL(blob);
      if (result) URL.revokeObjectURL(result.url);
      setResult({ url, size: smoothed.data.byteLength });
      track({ tool: tool.slug, step: "export_done" });
    } catch (cause) {
      setErrorText(cause instanceof Error ? cause.message : "Smoothing failed.");
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
            ? "That file is not a PNG — JPEG has no alpha channel to smooth."
            : state
              ? `${state.fileName} — ${state.pixels.width}×${state.pixels.height}`
              : "Drop a transparent PNG with jagged edges"}
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
          accept="image/png,.png"
          hidden
          onChange={(event) => void loadFile(event.target.files)}
        />
      </div>

      {ineligible && (
        <p className="mt-3 text-[12px] text-[var(--muted)]">
          Edge smoothing works on the alpha channel, so it needs a PNG with
          transparency. JPEG photos have no alpha to smooth.
        </p>
      )}

      {state && (
        <>
          <div className="mt-4">
            <label htmlFor="strength-select" className="mono-label block">
              STRENGTH
            </label>
            <select
              id="strength-select"
              value={strength}
              onChange={(event) =>
                setStrength(event.target.value as SmoothStrength)
              }
              className="mt-2 w-full"
            >
              {STRENGTH_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label} ({level.passes} pass{level.passes > 1 ? "es" : ""})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Colours stay untouched — only edge alpha becomes a gradient.
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
            disabled={busy}
            onClick={() => void smooth()}
          >
            {busy ? "Smoothing…" : "Smooth edges and download PNG"}
          </button>

          {result && (
            <div className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="Smoothed result"
                className="max-h-64 w-auto border border-[var(--muted)]"
              />
              <a
                href={result.url}
                download={buildSmoothFileName(state.fileName)}
                className="button button-outline mt-2 inline-block"
              >
                Download {buildSmoothFileName(state.fileName)} (
                {Math.max(1, Math.round(result.size / 1024))} KB)
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
