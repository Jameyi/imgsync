"use client";

import { useEffect, useRef, useState } from "react";
import type { ToolSpec } from "@/config/tools";
import { track } from "@/lib/tools/runtime";
import {
  applyImageComposite,
  FIT_MODES,
  PLACEMENTS,
  type Placement,
  type ResizeMode,
} from "@/lib/tools/image-composite";
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

type Slot = {
  file: File | null;
  pixels: PixelBuffer | null;
  previewURL: string | null;
};

export default function ImageCompositeWorkbench({
  tool,
}: {
  tool: ToolSpec;
}) {
  const [background, setBackground] = useState<Slot>({
    file: null,
    pixels: null,
    previewURL: null,
  });
  const [foreground, setForeground] = useState<Slot>({
    file: null,
    pixels: null,
    previewURL: null,
  });
  const [fitMode, setFitMode] = useState<ResizeMode>("contain");
  const [placement, setPlacement] = useState<Placement>("center");
  const [scalePercent, setScalePercent] = useState(80);
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState("");
  const bgInputRef = useRef<HTMLInputElement>(null);
  const fgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    track({ tool: tool.slug, step: "visit" });
    return () => {
      if (background.previewURL) URL.revokeObjectURL(background.previewURL);
      if (foreground.previewURL) URL.revokeObjectURL(foreground.previewURL);
      if (result) URL.revokeObjectURL(result.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool.slug]);

  const loadInto = async (
    files: FileList | null,
    setSlot: React.Dispatch<React.SetStateAction<Slot>>,
  ) => {
    if (!files || files.length === 0) return;
    setErrorText("");
    try {
      const file = files[0];
      const pixels = await decodeImage(file);
      setSlot((prev) => {
        if (prev.previewURL) URL.revokeObjectURL(prev.previewURL);
        return { file, pixels, previewURL: URL.createObjectURL(file) };
      });
      setResult(null);
    } catch (cause) {
      setErrorText(
        cause instanceof Error ? cause.message : "Could not read that file.",
      );
    }
  };

  const compose = async () => {
    if (!background.pixels || !foreground.pixels) return;
    setBusy(true);
    setErrorText("");
    track({ tool: tool.slug, step: "tool_use" });
    try {
      const composed = await applyImageComposite({
        background: background.pixels,
        foreground: foreground.pixels,
        fitMode,
        placement,
        scalePercent,
      });
      const blob = new Blob([composed.data.slice().buffer], {
        type: "image/png",
      });
      const url = URL.createObjectURL(blob);
      if (result) URL.revokeObjectURL(result.url);
      setResult({ url, size: composed.data.byteLength });
      track({ tool: tool.slug, step: "export_done" });
    } catch (cause) {
      setErrorText(
        cause instanceof Error ? cause.message : "Composition failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const slotBlock = (
    slot: Slot,
    inputRef: React.RefObject<HTMLInputElement | null>,
    onFiles: (files: FileList | null) => void,
    title: string,
    accept: string,
  ) => (
    <div
      className="dropzone"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onFiles(event.dataTransfer.files);
      }}
    >
      <p className="dropzone-title">
        {slot.pixels
          ? `${slot.file?.name} — ${slot.pixels.width}×${slot.pixels.height}`
          : title}
      </p>
      <button
        type="button"
        className="button button-outline mt-3"
        onClick={() => inputRef.current?.click()}
      >
        {slot.pixels ? "Replace" : "Choose file"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => onFiles(event.target.files)}
      />
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {slotBlock(
          background,
          bgInputRef,
          (files) => void loadInto(files, setBackground),
          "Drop the BACKDROP image (sets output size)",
          "image/*",
        )}
        {slotBlock(
          foreground,
          fgInputRef,
          (files) => void loadInto(files, setForeground),
          "Drop the FOREGROUND image (transparent PNG works best)",
          "image/*",
        )}
      </div>

      {background.pixels && foreground.pixels && (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="fit-mode" className="mono-label block">
                FOREGROUND FIT
              </label>
              <select
                id="fit-mode"
                value={fitMode}
                onChange={(event) => setFitMode(event.target.value as ResizeMode)}
                className="mt-2 w-full"
              >
                {FIT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="placement" className="mono-label block">
                PLACEMENT
              </label>
              <select
                id="placement"
                value={placement}
                onChange={(event) =>
                  setPlacement(event.target.value as Placement)
                }
                className="mt-2 w-full"
              >
                {PLACEMENTS.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="scale-slider"
                className="mono-label flex items-center justify-between"
              >
                <span>SCALE</span>
                <span>{scalePercent}%</span>
              </label>
              <input
                id="scale-slider"
                type="range"
                min={10}
                max={100}
                value={scalePercent}
                onChange={(event) =>
                  setScalePercent(Number(event.target.value))
                }
                className="mt-2 w-full"
              />
            </div>
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
            onClick={() => void compose()}
          >
            {busy ? "Composing…" : "Compose and download PNG"}
          </button>

          {result && (
            <div className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="Composed result"
                className="max-h-64 w-auto border border-[var(--muted)]"
              />
              <a
                href={result.url}
                download={`${background.file?.name.replace(/\.[^.]+$/, "") ?? "composite"}-composed.png`}
                className="button button-outline mt-2 inline-block"
                onClick={() =>
                  track({ tool: tool.slug, step: "export_done" })
                }
              >
                Download PNG ({Math.max(1, Math.round(result.size / 1024))} KB)
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
