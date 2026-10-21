"use client";

import { useEffect, useRef, useState } from "react";
import type { ToolSpec } from "@/config/tools";
import { applyResizeToPreset } from "@/lib/tools/resize-to-preset";
import {
  loadImageFromFiles,
  track,
  type LoadedImage,
} from "@/lib/tools/runtime";

type Phase = "idle" | "loaded" | "processing" | "error";

type Preset = { label: string; width: number; height: number };

const PRESETS: readonly Preset[] = [
  { label: "Amazon main image — 2000×2000", width: 2000, height: 2000 },
  { label: "Shopify product — 2048×2048", width: 2048, height: 2048 },
  { label: "Instagram post — 1080×1080", width: 1080, height: 1080 },
  { label: "OG share image — 1200×630", width: 1200, height: 630 },
];

export default function ResizeToPresetWorkbench({
  tool,
}: {
  tool: ToolSpec;
}) {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [presetIndex, setPresetIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorText, setErrorText] = useState("");
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewURLRef = useRef<string | null>(null);

  useEffect(() => {
    track({ tool: tool.slug, step: "visit" });
    return () => {
      if (previewURLRef.current) URL.revokeObjectURL(previewURLRef.current);
    };
  }, [tool.slug]);

  const render = (data: Uint8ClampedArray, width: number, height: number) => {
    const canvas = resultCanvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    const frame = context.createImageData(width, height);
    frame.data.set(data);
    context.putImageData(frame, 0, 0);
  };

  const process = async (source: LoadedImage, preset: Preset) => {
    setPhase("processing");
    setErrorText("");
    track({ tool: tool.slug, step: "tool_use" });
    try {
      const result = await applyResizeToPreset(source.source, {
        width: preset.width,
        height: preset.height,
      });
      render(result.data, result.width, result.height);
      setPhase("loaded");
    } catch (cause) {
      setErrorText(cause instanceof Error ? cause.message : String(cause));
      setPhase("error");
    }
  };

  const onFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setErrorText("");
    try {
      const [loaded] = await loadImageFromFiles([file]);
      if (previewURLRef.current) URL.revokeObjectURL(previewURLRef.current);
      previewURLRef.current = loaded.previewURL;
      setImage(loaded);
      await process(loaded, PRESETS[presetIndex]);
    } catch (cause) {
      setErrorText(
        cause instanceof Error
          ? `Could not decode this image: ${cause.message}`
          : "Could not decode this image.",
      );
      setPhase("error");
    }
  };

  const onPresetChange = (index: number) => {
    setPresetIndex(index);
    if (image) void process(image, PRESETS[index]);
  };

  const download = () => {
    const canvas = resultCanvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const preset = PRESETS[presetIndex];
      anchor.download =
        (image
          ? image.fileName.replace(/\.[^.]+$/, "")
          : "resized") + `.${preset.width}x${preset.height}.png`;
      anchor.click();
      URL.revokeObjectURL(url);
      track({ tool: tool.slug, step: "export_done" });
    }, "image/png");
  };

  const preset = PRESETS[presetIndex];

  return (
    <div data-workbench={tool.slug}>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
        {phase === "idle" && (
          <div className="p-6 sm:p-10">
            <label className="mx-auto flex max-w-xl cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-[var(--border)] px-8 py-16 text-center transition-colors hover:border-[var(--blue)]">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--soft)] text-2xl">
                📐
              </span>
              <span className="mt-4 text-[15px] font-semibold">
                Drop your product photo
              </span>
              <span className="mt-1.5 text-[12px]">
                or click to browse — PNG, JPEG, WebP
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => void onFiles(event.target.files)}
              />
            </label>
          </div>
        )}

        {image && (
          <div className="p-6 sm:p-10">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <figure className="overflow-hidden rounded-lg border border-[var(--border)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.previewURL}
                  alt={`Original ${image.fileName}`}
                  className="max-h-[320px] w-full bg-white object-contain"
                />
                <figcaption className="border-t border-[var(--border)] px-4 py-2.5 text-[11px] text-[var(--muted)]">
                  Original — {image.fileName} · {image.width}×{image.height}
                </figcaption>
              </figure>
              <figure className="overflow-hidden rounded-lg border-2 border-[var(--blue)]">
                <div className="flex items-center justify-center bg-white">
                  <canvas ref={resultCanvasRef} className="max-h-[320px] w-auto max-w-full" />
                </div>
                <figcaption className="border-t border-[var(--border)] bg-[var(--soft)] px-4 py-2.5 text-[11px]">
                  <span className="font-semibold text-[var(--blue)]">Result</span>
                  <span className="text-[var(--muted)]">
                    {phase === "processing"
                      ? " — resizing…"
                      : ` — ${preset.width}×${preset.height}, white fill`}
                  </span>
                </figcaption>
              </figure>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-[var(--soft)] p-5">
              <div className="w-full sm:w-auto">
                <label className="flex items-center justify-between gap-6 text-[12px] font-semibold sm:gap-10">
                  <span>Platform preset</span>
                  <select
                    value={presetIndex}
                    onChange={(event) => onPresetChange(Number(event.target.value))}
                    className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[12px]"
                    aria-label="Platform preset"
                  >
                    {PRESETS.map((p, index) => (
                      <option key={p.label} value={index}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  className="button button-dark"
                  onClick={download}
                  disabled={phase === "processing"}
                >
                  ⬇ Download PNG ({preset.width}×{preset.height})
                </button>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => {
                    setImage(null);
                    setPhase("idle");
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {phase === "error" && (
        <p className="callout mt-4" role="alert">
          {errorText || "Something went wrong resizing this image."}
        </p>
      )}

      <p className="mt-4 text-[11px] text-[var(--muted)]">
        🔒 Runs locally — your image never leaves the browser. Images above 4
        megapixels are processed in a background worker.
      </p>
    </div>
  );
}
