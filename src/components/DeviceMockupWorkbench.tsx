"use client";

import { useEffect, useRef, useState } from "react";
import type { ToolSpec } from "@/config/tools";
import { track } from "@/lib/tools/runtime";
import {
  applyDeviceMockup,
  buildFrameOptions,
  buildMockupFileName,
  DEVICE_PRESETS,
  type DevicePreset,
} from "@/lib/tools/device-frame";
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

export default function DeviceMockupWorkbench({
  tool,
}: {
  tool: ToolSpec;
}) {
  const [state, setState] = useState<{
    fileName: string;
    pixels: PixelBuffer;
    previewURL: string;
  } | null>(null);
  const [preset, setPreset] = useState<DevicePreset>("phone");
  const [bezelWidth, setBezelWidth] = useState(10);
  const [screenRadius, setScreenRadius] = useState(28);
  const [padding, setPadding] = useState(24);
  const [bezelHex, setBezelHex] = useState("#1a1a1a");
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

  const pickPreset = (value: DevicePreset) => {
    setPreset(value);
    const found = DEVICE_PRESETS.find((entry) => entry.value === value);
    if (found) {
      setBezelWidth(found.bezelWidth);
      setScreenRadius(found.screenRadius);
    }
  };

  const makeMockup = async () => {
    if (!state) return;
    setBusy(true);
    setErrorText("");
    track({ tool: tool.slug, step: "tool_use" });
    try {
      const options = buildFrameOptions({
        bezelWidth,
        bezelColorHex: bezelHex,
        screenRadius,
        padding,
        backgroundHex:
          backgroundMode === "white" ? "#ffffff" : null,
      });
      if (!options) {
        setErrorText("Enter a valid hex color for the shell.");
        return;
      }
      const mockup = await applyDeviceMockup({ source: state.pixels, options });
      const blob = new Blob([mockup.data.slice().buffer], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      if (result) URL.revokeObjectURL(result.url);
      setResult({ url, size: mockup.data.byteLength });
      track({ tool: tool.slug, step: "export_done" });
    } catch (cause) {
      setErrorText(
        cause instanceof Error ? cause.message : "Mockup generation failed.",
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
            : "Drop a screenshot to mock up"}
        </p>
        <button
          type="button"
          className="button button-outline mt-3"
          onClick={() => inputRef.current?.click()}
        >
          {state ? "Replace screenshot" : "Choose file"}
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
              <label htmlFor="device-preset" className="mono-label block">
                DEVICE
              </label>
              <select
                id="device-preset"
                value={preset}
                onChange={(event) =>
                  pickPreset(event.target.value as DevicePreset)
                }
                className="mt-2 w-full"
              >
                {DEVICE_PRESETS.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="bezel-color" className="mono-label block">
                SHELL COLOR (hex)
              </label>
              <input
                id="bezel-color"
                type="text"
                value={bezelHex}
                onChange={(event) => setBezelHex(event.target.value)}
                placeholder="#1a1a1a"
                className="mt-2 w-full"
              />
            </div>
            <div>
              <label
                htmlFor="bezel-slider"
                className="mono-label flex items-center justify-between"
              >
                <span>BEZEL</span>
                <span>{bezelWidth}px</span>
              </label>
              <input
                id="bezel-slider"
                type="range"
                min={0}
                max={60}
                value={bezelWidth}
                onChange={(event) => setBezelWidth(Number(event.target.value))}
                className="mt-2 w-full"
              />
            </div>
            <div>
              <label
                htmlFor="radius-slider"
                className="mono-label flex items-center justify-between"
              >
                <span>SCREEN RADIUS</span>
                <span>{screenRadius}px</span>
              </label>
              <input
                id="radius-slider"
                type="range"
                min={0}
                max={80}
                value={screenRadius}
                onChange={(event) => setScreenRadius(Number(event.target.value))}
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
              <label htmlFor="bg-mode" className="mono-label block">
                BACKGROUND
              </label>
              <select
                id="bg-mode"
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
            onClick={() => void makeMockup()}
          >
            {busy ? "Framing…" : "Generate mockup and download PNG"}
          </button>

          {result && (
            <div className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="Device mockup result"
                className="max-h-64 w-auto border border-[var(--muted)]"
              />
              <a
                href={result.url}
                download={buildMockupFileName(state.fileName)}
                className="button button-outline mt-2 inline-block"
              >
                Download {buildMockupFileName(state.fileName)} (
                {formatKB(result.size)})
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
