"use client";

import { useEffect, useRef, useState } from "react";
import type { ToolSpec } from "@/config/tools";
import { track } from "@/lib/tools/runtime";
import {
  applyRoundedCorners,
  buildFramedFileName,
  hexToRgb,
  SHADOW_PRESETS,
  type FrameOptions,
  type Rgb,
  type ShadowPreset,
} from "@/lib/tools/rounded-corners";
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

export default function RoundedCornersWorkbench({
  tool,
}: {
  tool: ToolSpec;
}) {
  const [state, setState] = useState<{
    fileName: string;
    pixels: PixelBuffer;
    previewURL: string;
  } | null>(null);
  const [radius, setRadius] = useState(24);
  const [padding, setPadding] = useState(24);
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderHex, setBorderHex] = useState("#ffffff");
  const [shadowPreset, setShadowPreset] = useState<ShadowPreset>("soft");
  const [shadowHex, setShadowHex] = useState("#000000");
  const [backgroundMode, setBackgroundMode] = useState<"transparent" | "white">(
    "transparent",
  );
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

  const buildOptions = (): FrameOptions | string => {
    const borderColor = borderWidth > 0 ? hexToRgb(borderHex) : null;
    if (borderWidth > 0 && !borderColor) return "Invalid border color hex.";
    const preset = SHADOW_PRESETS.find((entry) => entry.value === shadowPreset);
    const shadow =
      preset && preset.blurPasses > 0
        ? (() => {
            const color = hexToRgb(shadowHex);
            if (!color) return "invalid-shadow" as const;
            return {
              color: color as Rgb,
              blurPasses: preset.blurPasses,
              offsetX: 0,
              offsetY: 6,
            };
          })()
        : null;
    if (shadow === "invalid-shadow") return "Invalid shadow color hex.";
    return {
      radius,
      padding: shadow ? padding + 6 : padding,
      borderWidth,
      borderColor: borderColor ?? undefined,
      shadow: shadow ?? undefined,
      background: backgroundMode === "white" ? { r: 255, g: 255, b: 255 } : null,
    };
  };

  const frame = async () => {
    if (!state) return;
    setBusy(true);
    setErrorText("");
    track({ tool: tool.slug, step: "tool_use" });
    try {
      const options = buildOptions();
      if (typeof options === "string") {
        setErrorText(options);
        return;
      }
      const framed = await applyRoundedCorners({ source: state.pixels, options });
      const blob = new Blob([framed.data.slice().buffer], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      if (result) URL.revokeObjectURL(result.url);
      setResult({ url, size: framed.data.byteLength });
      track({ tool: tool.slug, step: "export_done" });
    } catch (cause) {
      setErrorText(cause instanceof Error ? cause.message : "Framing failed.");
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
            : "Drop an image to frame"}
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
            <div>
              <label
                htmlFor="radius-slider"
                className="mono-label flex items-center justify-between"
              >
                <span>CORNER RADIUS</span>
                <span>{radius}px</span>
              </label>
              <input
                id="radius-slider"
                type="range"
                min={0}
                max={200}
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value))}
                className="mt-2 w-full"
              />
            </div>
            <div>
              <label
                htmlFor="padding-slider"
                className="mono-label flex items-center justify-between"
              >
                <span>CANVAS PADDING</span>
                <span>{padding}px</span>
              </label>
              <input
                id="padding-slider"
                type="range"
                min={0}
                max={120}
                value={padding}
                onChange={(event) => setPadding(Number(event.target.value))}
                className="mt-2 w-full"
              />
            </div>
            <div>
              <label
                htmlFor="border-width"
                className="mono-label flex items-center justify-between"
              >
                <span>BORDER WIDTH</span>
                <span>{borderWidth}px</span>
              </label>
              <input
                id="border-width"
                type="range"
                min={0}
                max={16}
                value={borderWidth}
                onChange={(event) => setBorderWidth(Number(event.target.value))}
                className="mt-2 w-full"
              />
            </div>
            <div>
              <label htmlFor="border-color" className="mono-label block">
                BORDER COLOR
              </label>
              <input
                id="border-color"
                type="text"
                value={borderHex}
                onChange={(event) => setBorderHex(event.target.value)}
                placeholder="#ffffff"
                className="mt-2 w-full"
              />
            </div>
            <div>
              <label htmlFor="shadow-preset" className="mono-label block">
                SHADOW
              </label>
              <select
                id="shadow-preset"
                value={shadowPreset}
                onChange={(event) =>
                  setShadowPreset(event.target.value as ShadowPreset)
                }
                className="mt-2 w-full"
              >
                {SHADOW_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="shadow-color" className="mono-label block">
                SHADOW COLOR
              </label>
              <input
                id="shadow-color"
                type="text"
                value={shadowHex}
                onChange={(event) => setShadowHex(event.target.value)}
                placeholder="#000000"
                className="mt-2 w-full"
              />
            </div>
            <div>
              <label htmlFor="background-mode" className="mono-label block">
                BACKGROUND
              </label>
              <select
                id="background-mode"
                value={backgroundMode}
                onChange={(event) =>
                  setBackgroundMode(
                    event.target.value as "transparent" | "white",
                  )
                }
                className="mt-2 w-full"
              >
                <option value="transparent">Transparent</option>
                <option value="white">White</option>
              </select>
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
            onClick={() => void frame()}
          >
            {busy ? "Framing…" : "Apply frame and download PNG"}
          </button>

          {result && (
            <div className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="Framed result"
                className="max-h-64 w-auto border border-[var(--muted)]"
              />
              <a
                href={result.url}
                download={buildFramedFileName(state.fileName)}
                className="button button-outline mt-2 inline-block"
              >
                Download {buildFramedFileName(state.fileName)} (
                {formatKB(result.size)})
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
