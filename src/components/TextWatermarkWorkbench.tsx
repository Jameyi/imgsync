"use client";

import { useEffect, useRef, useState } from "react";
import type { ToolSpec } from "@/config/tools";
import { track } from "@/lib/tools/runtime";
import {
  applyTextWatermark,
  buildBlendOptions,
  buildStampSpec,
  buildWatermarkedFileName,
  renderTextStamp,
  type WatermarkPlacement,
} from "@/lib/tools/text-watermark";
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

const PLACEMENT_OPTIONS: ReadonlyArray<{ value: WatermarkPlacement; label: string }> = [
  { value: "center", label: "Center" },
  { value: "top-left", label: "Top left" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
  { value: "tile", label: "Tiled across image" },
];

export default function TextWatermarkWorkbench({
  tool,
}: {
  tool: ToolSpec;
}) {
  const [state, setState] = useState<{
    fileName: string;
    pixels: PixelBuffer;
    previewURL: string;
  } | null>(null);
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(32);
  const [colorHex, setColorHex] = useState("#ffffff");
  const [placement, setPlacement] = useState<WatermarkPlacement>("bottom-right");
  const [opacity, setOpacity] = useState(0.5);
  const [gap, setGap] = useState(40);
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

  const stamp = async () => {
    if (!state) return;
    setBusy(true);
    setErrorText("");
    track({ tool: tool.slug, step: "tool_use" });
    try {
      const spec = buildStampSpec({ text, fontSize, colorHex });
      if (!spec) {
        setErrorText("Enter watermark text and a valid hex color.");
        return;
      }
      const stampPixels = await renderTextStamp(spec);
      const watermarked = await applyTextWatermark({
        source: state.pixels,
        stamp: stampPixels,
        options: buildBlendOptions({ placement, opacity, gap, angle: -30 }),
      });
      const blob = new Blob([watermarked.data.slice().buffer], {
        type: "image/png",
      });
      const url = URL.createObjectURL(blob);
      if (result) URL.revokeObjectURL(result.url);
      setResult({ url, size: watermarked.data.byteLength });
      track({ tool: tool.slug, step: "export_done" });
    } catch (cause) {
      setErrorText(
        cause instanceof Error ? cause.message : "Watermarking failed.",
      );
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
          {state
            ? `${state.fileName} — ${state.pixels.width}×${state.pixels.height}`
            : "Drop an image to watermark"}
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
          accept="image/*"
          hidden
          onChange={(event) => void loadFile(event.target.files)}
        />
      </div>

      {state && (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="wm-text" className="mono-label block">
                WATERMARK TEXT
              </label>
              <input
                id="wm-text"
                type="text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="© your name"
                className="mt-2 w-full"
              />
            </div>
            <div>
              <label
                htmlFor="wm-fontsize"
                className="mono-label flex items-center justify-between"
              >
                <span>FONT SIZE</span>
                <span>{fontSize}px</span>
              </label>
              <input
                id="wm-fontsize"
                type="range"
                min={10}
                max={120}
                value={fontSize}
                onChange={(event) => setFontSize(Number(event.target.value))}
                className="mt-2 w-full"
              />
            </div>
            <div>
              <label htmlFor="wm-color" className="mono-label block">
                TEXT COLOR (hex)
              </label>
              <input
                id="wm-color"
                type="text"
                value={colorHex}
                onChange={(event) => setColorHex(event.target.value)}
                placeholder="#ffffff"
                className="mt-2 w-full"
              />
            </div>
            <div>
              <label htmlFor="wm-placement" className="mono-label block">
                PLACEMENT
              </label>
              <select
                id="wm-placement"
                value={placement}
                onChange={(event) =>
                  setPlacement(event.target.value as WatermarkPlacement)
                }
                className="mt-2 w-full"
              >
                {PLACEMENT_OPTIONS.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="wm-opacity"
                className="mono-label flex items-center justify-between"
              >
                <span>OPACITY</span>
                <span>{Math.round(opacity * 100)}%</span>
              </label>
              <input
                id="wm-opacity"
                type="range"
                min={5}
                max={100}
                value={Math.round(opacity * 100)}
                onChange={(event) =>
                  setOpacity(Number(event.target.value) / 100)
                }
                className="mt-2 w-full"
              />
            </div>
            {placement === "tile" && (
              <div>
                <label
                  htmlFor="wm-gap"
                  className="mono-label flex items-center justify-between"
                >
                  <span>TILE SPACING</span>
                  <span>{gap}px</span>
                </label>
                <input
                  id="wm-gap"
                  type="range"
                  min={0}
                  max={200}
                  value={gap}
                  onChange={(event) => setGap(Number(event.target.value))}
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
            onClick={() => void stamp()}
          >
            {busy ? "Stamping…" : "Apply watermark and download PNG"}
          </button>

          {result && (
            <div className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="Watermarked result"
                className="max-h-64 w-auto border border-[var(--muted)]"
              />
              <a
                href={result.url}
                download={buildWatermarkedFileName(state.fileName)}
                className="button button-outline mt-2 inline-block"
              >
                Download {buildWatermarkedFileName(state.fileName)} (
                {formatKB(result.size)})
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
