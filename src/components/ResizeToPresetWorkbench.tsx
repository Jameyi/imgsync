"use client";

import { useEffect, useRef, useState } from "react";
import type { ToolSpec } from "@/config/tools";
import { applyResizeToPreset } from "@/lib/tools/resize-to-preset";
import { cropToBox } from "@/lib/image-core/crop-to-box";
import {
  loadImageFromFiles,
  track,
  type LoadedImage,
} from "@/lib/tools/runtime";

type Phase = "idle" | "loaded" | "processing" | "error";
type Mode = "preset" | "crop";

type Preset = { label: string; width: number; height: number };

const PRESETS: readonly Preset[] = [
  { label: "Amazon main image — 2000×2000", width: 2000, height: 2000 },
  { label: "Shopify product — 2048×2048", width: 2048, height: 2048 },
  { label: "Instagram post — 1080×1080", width: 1080, height: 1080 },
  { label: "OG share image — 1200×630", width: 1200, height: 630 },
];

// selection rect in image pixel coordinates, always normalised (x0<=x1, y0<=y1)
type CropRect = { x0: number; y0: number; x1: number; y1: number };

type HandleId =
  | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w" | "move" | "new";

type DragState = {
  handle: HandleId;
  startX: number;
  startY: number;
  origin: CropRect;
};

const HANDLE_CURSORS: Record<HandleId, string> = {
  nw: "nwse-resize",
  se: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  move: "move",
  new: "crosshair",
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export default function ResizeToPresetWorkbench({
  tool,
}: {
  tool: ToolSpec;
}) {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [presetIndex, setPresetIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("preset");
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  // confirmed crop that the right-hand preview reflects; null = preview stale
  const [appliedBox, setAppliedBox] = useState<CropRect | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorText, setErrorText] = useState("");
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewURLRef = useRef<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

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
      setCropRect(null);
      setAppliedBox(null);
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
    setMode("preset");
    if (image) void process(image, PRESETS[index]);
  };

  const enterCropMode = () => {
    setMode("crop");
    setCropRect(null);
    setAppliedBox(null);
    // default selection: centred 60% of the image
    if (image) {
      const w = image.width;
      const h = image.height;
      setCropRect({
        x0: Math.round(w * 0.2),
        y0: Math.round(h * 0.2),
        x1: Math.round(w * 0.8) - 1,
        y1: Math.round(h * 0.8) - 1,
      });
    }
  };

  const applyCrop = () => {
    if (!image || !cropRect) return;
    const cropped = cropToBox(image.source, cropRect);
    render(cropped.data, cropped.width, cropped.height);
    setAppliedBox(cropRect);
    track({ tool: tool.slug, step: "tool_use" });
  };

  // Enter confirms the current selection while in crop mode
  useEffect(() => {
    if (mode !== "crop") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyCrop();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const imagePoint = (event: React.MouseEvent) => {
    const target = event.currentTarget;
    const el =
      target instanceof HTMLElement
        ? target.closest<HTMLElement>("[data-crop-area]")
        : null;
    if (!el || !image) return null;
    const rect = el.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * image.width;
    const y = ((event.clientY - rect.top) / rect.height) * image.height;
    return {
      x: clamp(Math.round(x), 0, image.width - 1),
      y: clamp(Math.round(y), 0, image.height - 1),
    };
  };

  const nextRect = (state: DragState, point: { x: number; y: number }): CropRect => {
    const { handle, startX, startY, origin } = state;
    if (handle === "new") {
      // drawing a fresh selection between start point and cursor
      return {
        x0: Math.min(startX, point.x),
        y0: Math.min(startY, point.y),
        x1: Math.max(startX, point.x),
        y1: Math.max(startY, point.y),
      };
    }
    const dx = point.x - startX;
    const dy = point.y - startY;
    const maxW = image ? image.width - 1 : 0;
    const maxH = image ? image.height - 1 : 0;
    const o = origin;
    switch (handle) {
      case "move":
        return {
          x0: clamp(o.x0 + dx, 0, maxW - (o.x1 - o.x0)),
          y0: clamp(o.y0 + dy, 0, maxH - (o.y1 - o.y0)),
          x1: clamp(o.x1 + dx, o.x1 - o.x0, maxW),
          y1: clamp(o.y1 + dy, o.y1 - o.y0, maxH),
        };
      case "nw":
        return { x0: clamp(o.x0 + dx, 0, o.x1 - 1), y0: clamp(o.y0 + dy, 0, o.y1 - 1), x1: o.x1, y1: o.y1 };
      case "ne":
        return { x0: o.x0, y0: clamp(o.y0 + dy, 0, o.y1 - 1), x1: clamp(o.x1 + dx, o.x0 + 1, maxW), y1: o.y1 };
      case "sw":
        return { x0: clamp(o.x0 + dx, 0, o.x1 - 1), y0: o.y0, x1: o.x1, y1: clamp(o.y1 + dy, o.y0 + 1, maxH) };
      case "se":
        return { x0: o.x0, y0: o.y0, x1: clamp(o.x1 + dx, o.x0 + 1, maxW), y1: clamp(o.y1 + dy, o.y0 + 1, maxH) };
      case "n":
        return { x0: o.x0, y0: clamp(o.y0 + dy, 0, o.y1 - 1), x1: o.x1, y1: o.y1 };
      case "s":
        return { x0: o.x0, y0: o.y0, x1: o.x1, y1: clamp(o.y1 + dy, o.y0 + 1, maxH) };
      case "e":
        return { x0: o.x0, y0: o.y0, x1: clamp(o.x1 + dx, o.x0 + 1, maxW), y1: o.y1 };
      case "w":
        return { x0: clamp(o.x0 + dx, 0, o.x1 - 1), y0: o.y0, x1: o.x1, y1: o.y1 };
    }
  };

  const onCropMouseDown = (handle: HandleId) => (event: React.MouseEvent) => {
    if (mode !== "crop" || !image || !cropRect) return;
    event.preventDefault();
    event.stopPropagation();
    const point = imagePoint(event);
    if (!point) return;
    // handles and move adjust the existing selection (opposite side fixed);
    // only a drag on the bare image area starts a brand-new box
    setDrag({ handle, startX: point.x, startY: point.y, origin: cropRect });
  };

  const onImageMouseDown = (event: React.MouseEvent) => {
    if (mode !== "crop" || !image) return;
    const point = imagePoint(event);
    if (!point) return;
    // ignore clicks inside the existing selection (move area handles those)
    if (
      cropRect &&
      point.x >= cropRect.x0 &&
      point.x <= cropRect.x1 &&
      point.y >= cropRect.y0 &&
      point.y <= cropRect.y1
    ) {
      return;
    }
    setDrag({
      handle: "new",
      startX: point.x,
      startY: point.y,
      origin: { x0: point.x, y0: point.y, x1: point.x, y1: point.y },
    });
    setCropRect({ x0: point.x, y0: point.y, x1: point.x, y1: point.y });
    setAppliedBox(null);
  };

  const onCropMouseMove = (event: React.MouseEvent) => {
    if (!drag || !image) return;
    const point = imagePoint(event);
    if (!point) return;
    setCropRect(nextRect(drag, point));
    setAppliedBox(null);
  };

  const onCropMouseUp = () => {
    setDrag(null);
  };

  const download = () => {
    if (!image) return;
    if (mode === "crop") {
      if (!appliedBox) return;
      const cropped = cropToBox(image.source, appliedBox);
      const canvas = document.createElement("canvas");
      canvas.width = cropped.width;
      canvas.height = cropped.height;
      const context = canvas.getContext("2d");
      if (!context) return;
      const frame = context.createImageData(cropped.width, cropped.height);
      frame.data.set(cropped.data);
      context.putImageData(frame, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download =
          (image.fileName.replace(/\.[^.]+$/, "") || "cropped") +
          `.crop-${cropped.width}x${cropped.height}.png`;
        anchor.click();
        URL.revokeObjectURL(url);
        track({ tool: tool.slug, step: "export_done" });
      }, "image/png");
      return;
    }
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
  const cropW = cropRect ? cropRect.x1 - cropRect.x0 + 1 : 0;
  const cropH = cropRect ? cropRect.y1 - cropRect.y0 + 1 : 0;
  const pct = (value: number, total: number) => `${(value / total) * 100}%`;

  return (
    <div data-workbench={tool.slug}>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
        {phase === "idle" && (
          <div className="p-6 sm:p-10">
            <label
              className="mx-auto flex max-w-xl cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-[var(--border)] px-8 py-16 text-center transition-colors hover:border-[var(--blue)]"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void onFiles(event.dataTransfer.files);
              }}
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--soft)] text-2xl checker">
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
                <div className="flex items-center justify-center bg-white p-2">
                  <div
                    data-crop-area
                    className="relative inline-block leading-none"
                    onMouseMove={onCropMouseMove}
                    onMouseUp={onCropMouseUp}
                    onMouseLeave={onCropMouseUp}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.previewURL}
                      alt={`Original ${image.fileName}`}
                      draggable={false}
                      className={`max-h-[320px] w-auto max-w-full bg-white object-contain ${mode === "crop" ? "cursor-crosshair" : ""}`}
                      onMouseDown={onImageMouseDown}
                    />
                    {mode === "crop" && cropRect && (
                      <>
                        {/* shaded outside + selection border */}
                        <div
                          className="pointer-events-none absolute border-2 border-[var(--blue)]"
                          style={{
                            left: pct(cropRect.x0, image.width),
                            top: pct(cropRect.y0, image.height),
                            width: pct(cropW, image.width),
                            height: pct(cropH, image.height),
                            boxShadow: "0 0 0 9999px rgba(255,255,255,0.55)",
                          }}
                        />
                        {/* move area (inside) */}
                        <div
                          className="absolute"
                          style={{
                            left: pct(cropRect.x0, image.width),
                            top: pct(cropRect.y0, image.height),
                            width: pct(cropW, image.width),
                            height: pct(cropH, image.height),
                            cursor: HANDLE_CURSORS.move,
                          }}
                          onMouseDown={onCropMouseDown("move")}
                        />
                        {/* corner handles */}
                        {(
                          [
                            ["nw", cropRect.x0, cropRect.y0],
                            ["ne", cropRect.x1, cropRect.y0],
                            ["sw", cropRect.x0, cropRect.y1],
                            ["se", cropRect.x1, cropRect.y1],
                          ] as const
                        ).map(([id, x, y]) => (
                          <div
                            key={id}
                            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-white bg-[var(--blue)]"
                            style={{
                              left: pct(x, image.width),
                              top: pct(y, image.height),
                              cursor: HANDLE_CURSORS[id],
                            }}
                            onMouseDown={onCropMouseDown(id)}
                          />
                        ))}
                        {/* edge strips */}
                        <div
                          className="absolute"
                          style={{
                            left: pct(cropRect.x0 + cropW / 4, image.width),
                            top: pct(cropRect.y0, image.height),
                            width: pct(cropW / 2, image.width),
                            height: pct(Math.max(6, cropH * 0.08), image.height),
                            transform: "translateY(-50%)",
                            cursor: HANDLE_CURSORS.n,
                          }}
                          onMouseDown={onCropMouseDown("n")}
                        />
                        <div
                          className="absolute"
                          style={{
                            left: pct(cropRect.x0 + cropW / 4, image.width),
                            top: pct(cropRect.y1, image.height),
                            width: pct(cropW / 2, image.width),
                            height: pct(Math.max(6, cropH * 0.08), image.height),
                            transform: "translateY(-50%)",
                            cursor: HANDLE_CURSORS.s,
                          }}
                          onMouseDown={onCropMouseDown("s")}
                        />
                        <div
                          className="absolute"
                          style={{
                            left: pct(cropRect.x0, image.width),
                            top: pct(cropRect.y0 + cropH / 4, image.height),
                            width: pct(Math.max(6, cropW * 0.08), image.width),
                            height: pct(cropH / 2, image.height),
                            transform: "translateX(-50%)",
                            cursor: HANDLE_CURSORS.w,
                          }}
                          onMouseDown={onCropMouseDown("w")}
                        />
                        <div
                          className="absolute"
                          style={{
                            left: pct(cropRect.x1, image.width),
                            top: pct(cropRect.y0 + cropH / 4, image.height),
                            width: pct(Math.max(6, cropW * 0.08), image.width),
                            height: pct(cropH / 2, image.height),
                            transform: "translateX(-50%)",
                            cursor: HANDLE_CURSORS.e,
                          }}
                          onMouseDown={onCropMouseDown("e")}
                        />
                      </>
                    )}
                  </div>
                </div>
                <figcaption className="border-t border-[var(--border)] px-4 py-2.5 text-[11px] text-[var(--muted)]">
                  {mode === "crop"
                    ? cropRect
                      ? `Crop — ${cropW}×${cropH} px · drag handles, edges or inside · Enter / Apply to confirm`
                      : "Drag on the image to select the crop area"
                    : `Original — ${image.fileName} · ${image.width}×${image.height}`}
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
                      : mode === "crop" && appliedBox
                        ? ` — cropped ${appliedBox.x1 - appliedBox.x0 + 1}×${appliedBox.y1 - appliedBox.y0 + 1}, native resolution`
                        : mode === "crop"
                          ? " — apply the crop to preview"
                          : ` — ${preset.width}×${preset.height}, white fill`}
                  </span>
                </figcaption>
              </figure>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-[var(--soft)] p-5">
              <div className="w-full sm:w-auto">
                {mode === "preset" ? (
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
                ) : (
                  <p className="text-[12px] font-semibold">
                    Custom crop — reshape with handles, then Apply
                  </p>
                )}
                <button
                  type="button"
                  className="mt-2 text-[11px] text-[var(--blue)] underline"
                  onClick={() =>
                    mode === "preset"
                      ? enterCropMode()
                      : (setMode("preset"),
                        setAppliedBox(null),
                        image && void process(image, PRESETS[presetIndex]))
                  }
                >
                  {mode === "preset"
                    ? "✂ Free crop instead"
                    : "← Back to platform presets"}
                </button>
              </div>
              <div className="flex gap-2.5">
                {mode === "crop" ? (
                  <>
                    <button
                      type="button"
                      className="button button-dark"
                      onClick={applyCrop}
                      disabled={!cropRect}
                    >
                      ✓ Apply crop
                    </button>
                    <button
                      type="button"
                      className="button button-outline"
                      onClick={download}
                      disabled={!appliedBox}
                    >
                      ⬇ Download cropped PNG
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="button button-dark"
                    onClick={download}
                    disabled={phase === "processing"}
                  >
                    ⬇ Download PNG ({preset.width}×{preset.height})
                  </button>
                )}
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => {
                    setImage(null);
                    setCropRect(null);
                    setAppliedBox(null);
                    setMode("preset");
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

      <p className="bench-foot mono-label">
        🔒 Runs locally — your image never leaves the browser. Images above 4
        megapixels are processed in a background worker.
      </p>
    </div>
  );
}
