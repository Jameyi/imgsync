"use client";

import { useEffect, useRef, useState } from "react";
import type { ToolSpec } from "@/config/tools";
import { applyDefringeEdges } from "@/lib/tools/defringe-edges";
import {
  loadImageFromFiles,
  track,
  type LoadedImage,
} from "@/lib/tools/runtime";

type Phase = "idle" | "loaded" | "processing" | "error";

export default function DefringeEdgesWorkbench({
  tool,
}: {
  tool: ToolSpec;
}) {
  const [image, setImage] = useState<LoadedImage | null>(null);
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

  const process = async (source: LoadedImage) => {
    setPhase("processing");
    track({ tool: tool.slug, step: "tool_use" });
    try {
      const result = await applyDefringeEdges(source.source);
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
      await process(loaded);
    } catch (cause) {
      setErrorText(
        cause instanceof Error
          ? `Could not decode this image: ${cause.message}`
          : "Could not decode this image.",
      );
      setPhase("error");
    }
  };

  const download = async () => {
    const canvas = resultCanvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = image
      ? image.fileName.replace(/\.[^.]+$/, "") + ".defringed.png"
      : "defringed.png";
    anchor.click();
    URL.revokeObjectURL(url);
    track({ tool: tool.slug, step: "export_done" });
  };

  const darkPreview = {
    backgroundImage:
      "conic-gradient(#1f2937 25%, #111827 0 50%, #1f2937 0 75%, #111827 0)",
    backgroundSize: "16px 16px",
  };

  return (
    <div data-workbench={tool.slug}>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
        {phase === "idle" && (
          <div className="p-6 sm:p-10">
            <label className="mx-auto flex max-w-xl cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-[var(--border)] px-8 py-16 text-center transition-colors hover:border-[var(--blue)]">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--soft)] text-2xl">
                🖼️
              </span>
              <span className="mt-4 text-[15px] font-semibold">
                Drop your cutout PNG
              </span>
              <span className="mt-1.5 text-[12px]">
                or click to browse — PNG with transparency
              </span>
              <input
                type="file"
                accept="image/png,image/webp"
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
                <div style={darkPreview} className="flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.previewURL}
                    alt={`Original ${image.fileName}`}
                    className="max-h-[320px] w-auto max-w-full object-contain"
                  />
                </div>
                <figcaption className="border-t border-[var(--border)] px-4 py-2.5 text-[11px] text-[var(--muted)]">
                  Original — {image.fileName} · {image.width}×{image.height}
                </figcaption>
              </figure>
              <figure className="overflow-hidden rounded-lg border-2 border-[var(--blue)]">
                <div style={darkPreview} className="flex items-center justify-center">
                  <canvas ref={resultCanvasRef} className="max-h-[320px] w-auto max-w-full" />
                </div>
                <figcaption className="border-t border-[var(--border)] bg-[var(--soft)] px-4 py-2.5 text-[11px]">
                  <span className="font-semibold text-[var(--blue)]">Result</span>
                  <span className="text-[var(--muted)]">
                    {phase === "processing" ? " — processing…" : " — check on dark, no halo"}
                  </span>
                </figcaption>
              </figure>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 rounded-lg bg-[var(--soft)] p-5">
              <button
                type="button"
                className="button button-dark"
                onClick={() => void download()}
                disabled={phase === "processing"}
              >
                ⬇ Download PNG (defringed)
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
        )}
      </div>

      {phase === "error" && (
        <p className="callout mt-4" role="alert">
          {errorText || "Something went wrong processing this image."}
        </p>
      )}

      <p className="mt-4 text-[11px] text-[var(--muted)]">
        🔒 Runs locally — your image never leaves the browser. Images above 4
        megapixels are processed in a background worker.
      </p>
    </div>
  );
}
