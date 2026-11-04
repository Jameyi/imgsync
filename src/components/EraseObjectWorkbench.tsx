"use client";

import { useEffect, useRef, useState } from "react";
import type { ToolSpec } from "@/config/tools";
import { loadImageFromFiles, track } from "@/lib/tools/runtime";
import { applyEraseObject } from "@/lib/tools/erase-object";
import { stampBrush } from "@/lib/image-core/brush";
import type { MaskData } from "@/lib/image-core/telea-inpaint";
import type { PixelBuffer } from "@/lib/image-core/types";

const BRUSH_SIZES = [8, 16, 32];

export default function EraseObjectWorkbench({
  tool,
}: {
  tool: ToolSpec;
}) {
  const [fileName, setFileName] = useState("");
  const [source, setSource] = useState<PixelBuffer | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [brushRadius, setBrushRadius] = useState(16);
  // History of mask snapshots — index 0 is always the empty mask; undo pops.
  const [history, setHistory] = useState<MaskData[]>([]);
  const [result, setResult] = useState<PixelBuffer | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [painted, setPainted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Scratch canvas for drawing the semi-transparent red overlay.
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const paintingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    track({ tool: tool.slug, step: "visit" });
    return () => {
      if (previewURL) URL.revokeObjectURL(previewURL);
    };
  }, [tool.slug, previewURL]);

  const currentMask = history.length > 0 ? history[history.length - 1] : null;

  const loadFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorText("");
    try {
      const [loaded] = await loadImageFromFiles([files[0]]);
      setSource(loaded.source);
      setFileName(loaded.fileName);
      setPreviewURL(loaded.previewURL);
      setResult(null);
      setHistory([{
        width: loaded.source.width,
        height: loaded.source.height,
        data: new Uint8Array(loaded.source.width * loaded.source.height),
      }]);
      setPainted(false);
    } catch (cause) {
      setErrorText(
        cause instanceof Error ? cause.message : "Could not read that file.",
      );
    }
  };

  // Paint the source image + red mask overlay onto the visible canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source || !currentMask) return;
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(
      new ImageData(new Uint8ClampedArray(source.data), source.width, source.height),
      0,
      0,
    );
    // Overlay: erase-marked pixels tinted red at 45% alpha.
    const overlay = overlayRef.current ?? document.createElement("canvas");
    overlayRef.current = overlay;
    overlay.width = source.width;
    overlay.height = source.height;
    const octx = overlay.getContext("2d")!;
    const overlayData = octx.createImageData(source.width, source.height);
    let marked = 0;
    for (let p = 0; p < currentMask.data.length; p++) {
      if (currentMask.data[p] === 255) {
        const j = p * 4;
        overlayData.data[j] = 255;
        overlayData.data[j + 1] = 40;
        overlayData.data[j + 2] = 40;
        overlayData.data[j + 3] = 115;
        marked++;
      }
    }
    octx.putImageData(overlayData, 0, 0);
    ctx.drawImage(overlay, 0, 0);
    setPainted(marked > 0);
  }, [source, currentMask]);

  const toCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.round(((event.clientX - rect.left) / rect.width) * source!.width),
      y: Math.round(((event.clientY - rect.top) / rect.height) * source!.height),
    };
  };

  const paint = (x: number, y: number) => {
    if (!currentMask) return;
    // Interpolate between last pointer position and current so fast strokes
    // stay continuous.
    const last = lastPointRef.current;
    const steps = last
      ? Math.max(1, Math.ceil(Math.hypot(x - last.x, y - last.y) / (brushRadius / 2)))
      : 1;
    let mask = currentMask;
    for (let s = 1; s <= steps; s++) {
      const sx = last ? Math.round(last.x + ((x - last.x) * s) / steps) : x;
      const sy = last ? Math.round(last.y + ((y - last.y) * s) / steps) : y;
      mask = stampBrush(mask, sx, sy, brushRadius);
    }
    lastPointRef.current = { x, y };
    // Coalesce the stroke: replace trailing stamps made during this drag.
    setHistory((prev) => {
      if (paintingRef.current) {
        // Mid-stroke: replace the working snapshot.
        const base = prev.length > 1 ? prev.slice(0, prev.length - 1) : prev;
        return [...base, mask];
      }
      return [...prev, mask];
    });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!source || busy) return;
    paintingRef.current = true;
    lastPointRef.current = null;
    event.currentTarget.setPointerCapture(event.pointerId);
    const { x, y } = toCanvasPoint(event);
    paint(x, y);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!paintingRef.current || !source) return;
    const { x, y } = toCanvasPoint(event);
    paint(x, y);
  };

  const onPointerUp = () => {
    paintingRef.current = false;
    lastPointRef.current = null;
  };

  const undo = () => {
    if (history.length <= 1) return;
    setHistory((prev) => prev.slice(0, -1));
    setResult(null);
  };

  const erase = async () => {
    if (!source || !currentMask || !painted) return;
    setBusy(true);
    setErrorText("");
    track({ tool: tool.slug, step: "tool_use" });
    try {
      const filled = await applyEraseObject({ source, mask: currentMask });
      setResult(filled);
    } catch (cause) {
      setErrorText(cause instanceof Error ? cause.message : "Erase failed.");
    } finally {
      setBusy(false);
    }
  };

  const toDataURL = (buffer: PixelBuffer): string => {
    const canvas = document.createElement("canvas");
    canvas.width = buffer.width;
    canvas.height = buffer.height;
    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(
      new ImageData(new Uint8ClampedArray(buffer.data), buffer.width, buffer.height),
      0,
      0,
    );
    return canvas.toDataURL("image/png");
  };

  const download = () => {
    if (!result) return;
    try {
      const blob = dataURLtoBlob(toDataURL(result));
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${fileName.replace(/\.[^.]+$/, "")}-erased.png`;
      anchor.click();
      URL.revokeObjectURL(url);
      track({ tool: tool.slug, step: "export_done" });
    } catch (cause) {
      setErrorText(cause instanceof Error ? cause.message : "Export failed.");
    }
  };

  const dataURLtoBlob = (dataURL: string): Blob => {
    const [head, body] = dataURL.split(",");
    const mime = head.match(/:(.*?);/)![1];
    const bytes = atob(body);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  if (!source) {
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
            Drop one photo — brush over what you want gone
          </p>
          <button
            type="button"
            className="button button-outline mt-3"
            onClick={() => inputRef.current?.click()}
          >
            Choose file
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
      </div>
    );
  }

  return (
    <div>
      {/* User guidance card (confirmed UX requirement for this tool) */}
      {!result && (
        <div className="rounded border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-[13px]">
          <p className="mono-label">HOW TO ERASE</p>
          <p className="mt-1 text-[var(--fg-muted)]">
            1. Brush over the object you want gone — the red tint shows what
            will be erased. 2. Adjust the brush size for small details. 3.
            Press Fill hole when the object is fully covered. Best for small
            cleanups; very large fills get blurry.
          </p>
        </div>
      )}

      <div className="mt-3 flex items-center gap-3">
        <span className="mono-label">BRUSH</span>
        {BRUSH_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            className={`button ${brushRadius === size ? "button-dark" : "button-outline"} px-3 py-1 text-[12px]`}
            onClick={() => setBrushRadius(size)}
          >
            {size}px
          </button>
        ))}
        <button
          type="button"
          className="button button-outline px-3 py-1 text-[12px]"
          disabled={history.length <= 1}
          onClick={undo}
        >
          Undo
        </button>
      </div>

      <div className="relative mt-3">
        <canvas
          ref={canvasRef}
          className={`w-full rounded ${busy ? "opacity-70" : "cursor-crosshair"}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{ touchAction: "none" }}
        />
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="mono-label rounded bg-black/70 px-3 py-2 text-white">
              FILLING…
            </span>
          </div>
        )}
      </div>

      {errorText && (
        <p role="alert" className="mt-3 text-[12px] text-red-600">
          {errorText}
        </p>
      )}

      {!result && (
        <button
          type="button"
          className="button button-dark mt-4 w-full"
          disabled={!painted || busy}
          title={
            !painted
              ? "Brush over an object first — the red tint marks what will be erased"
              : undefined
          }
          onClick={() => void erase()}
        >
          {busy ? "Filling…" : "Fill hole"}
        </button>
      )}

      {result && (
        <div className="mt-4">
          <figure className="rounded border border-[var(--border)] p-2">
            <figcaption className="mono-label mb-1">RESULT</figcaption>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={toDataURL(result)}
              alt="Erased result preview"
              className="w-full rounded"
            />
          </figure>
          <button
            type="button"
            className="button button-dark mt-4 w-full"
            onClick={download}
          >
            Download PNG
          </button>
          <button
            type="button"
            className="button button-outline mt-2 w-full"
            onClick={() => setResult(null)}
          >
            Back to painting
          </button>
        </div>
      )}

      {!result && (
        <button
          type="button"
          className="button button-outline mt-2 w-full"
          onClick={() => inputRef.current?.click()}
        >
          Replace image
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => void loadFile(event.target.files)}
      />
    </div>
  );
}
