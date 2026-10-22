"use client";

import { useEffect, useRef, useState } from "react";
import type { ToolSpec } from "@/config/tools";
import {
  applyCompressToSize,
  type CompressToSizeResult,
} from "@/lib/tools/compress-to-size";
import {
  loadImageFromFiles,
  track,
  type LoadedImage,
} from "@/lib/tools/runtime";

type Phase = "idle" | "loaded" | "processing" | "error";

const MIN_TARGET_KB = 5;
const DEFAULT_TARGET_KB = 100;

export default function CompressToSizeWorkbench({
  tool,
}: {
  tool: ToolSpec;
}) {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [targetKB, setTargetKB] = useState(100);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorText, setErrorText] = useState("");
  const [result, setResult] = useState<CompressToSizeResult | null>(null);
  const [resultURL, setResultURL] = useState<string | null>(null);
  const previewURLRef = useRef<string | null>(null);
  const resultURLRef = useRef<string | null>(null);

  useEffect(() => {
    track({ tool: tool.slug, step: "visit" });
    return () => {
      if (previewURLRef.current) URL.revokeObjectURL(previewURLRef.current);
      if (resultURLRef.current) URL.revokeObjectURL(resultURLRef.current);
    };
  }, [tool.slug]);

  const process = async (source: LoadedImage, kb: number) => {
    setPhase("processing");
    setErrorText("");
    track({ tool: tool.slug, step: "tool_use" });
    try {
      const out = await applyCompressToSize({
        source: source.source,
        targetBytes: Math.round(kb * 1024),
      });
      if (resultURLRef.current) URL.revokeObjectURL(resultURLRef.current);
      const url = URL.createObjectURL(
        new Blob([out.data.buffer as ArrayBuffer], { type: "image/jpeg" }),
      );
      resultURLRef.current = url;
      setResult(out);
      setResultURL(url);
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
      const maxKB = Math.max(MIN_TARGET_KB + 1, Math.round(loaded.fileSizeBytes / 1024));
      setTargetKB(Math.min(DEFAULT_TARGET_KB, maxKB));
      await process(loaded, Math.min(DEFAULT_TARGET_KB, maxKB));
    } catch (cause) {
      setErrorText(
        cause instanceof Error
          ? `Could not decode this image: ${cause.message}`
          : "Could not decode this image.",
      );
      setPhase("error");
    }
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([result.data.buffer as ArrayBuffer], {
      type: "image/jpeg",
    });
    const url = URL.createObjectURL(blob);
    const base = (image?.fileName ?? "compressed").replace(/\.[^.]+$/, "");
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${base}.compressed.jpg`;
    anchor.click();
    URL.revokeObjectURL(url);
    track({ tool: tool.slug, step: "export_done" });
  };

  const achievedKB = result ? Math.round(result.data.byteLength / 1024) : 0;
  const maxKB = image
    ? Math.max(MIN_TARGET_KB + 1, Math.round(image.fileSizeBytes / 1024))
    : DEFAULT_TARGET_KB;

  return (
    <div data-workbench={tool.slug}>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
        {phase === "idle" && (
          <div className="p-6 sm:p-10">
            <label className="mx-auto flex max-w-xl cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-[var(--border)] px-8 py-16 text-center transition-colors hover:border-[var(--blue)]">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--soft)] text-2xl checker">
                🗜️
              </span>
              <span className="mt-4 text-[15px] font-semibold">
                Drop your product image
              </span>
              <span className="mt-1.5 text-[12px]">
                or click to browse — PNG, JPEG, WebP, exported as JPEG
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
                {resultURL && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={resultURL}
                    alt={`Compressed ${image.fileName}`}
                    className="max-h-[320px] w-full bg-white object-contain"
                  />
                )}
                <figcaption className="border-t border-[var(--border)] bg-[var(--soft)] px-4 py-2.5 text-[11px]">
                  <span className="font-semibold text-[var(--blue)]">Result</span>
                  <span className="text-[var(--muted)]">
                    {phase === "processing"
                      ? " — searching the best quality…"
                      : result
                        ? ` — JPEG ${achievedKB} KB · ${result.width}×${result.height}`
                        : " — waiting"}
                  </span>
                </figcaption>
              </figure>
            </div>

            {result && !result.hasHitTarget && (
              <p className="callout mt-4" role="status">
                Couldn&apos;t reach {targetKB} KB — even at the smallest usable
                size. Closest result is above: {achievedKB} KB. Try a higher
                target or accept this one — nothing was cut further to avoid a
                blurry guess.
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-[var(--soft)] p-5">
              <div className="w-full sm:w-auto">
                <div className="flex items-center justify-between gap-6 text-[12px] font-semibold sm:gap-10">
                  <span>Target file size (KB)</span>
                  <span className="font-mono text-[var(--blue)]">
                    {targetKB}
                  </span>
                </div>
                <input
                  type="range"
                  min={MIN_TARGET_KB}
                  max={maxKB}
                  step={1}
                  value={targetKB}
                  onChange={(event) => setTargetKB(Number(event.target.value))}
                  className="mt-2 w-56 accent-[var(--blue)]"
                  aria-label="Target file size in KB"
                />
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  className="button button-dark"
                  onClick={() => image && void process(image, targetKB)}
                  disabled={phase === "processing"}
                >
                  Compress
                </button>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={download}
                  disabled={!result || phase === "processing"}
                >
                  ⬇ Download JPEG
                </button>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => {
                    setImage(null);
                    setResult(null);
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
          {errorText || "Something went wrong compressing this image."}
        </p>
      )}

      <p className="bench-foot mono-label">
        🔒 Runs locally — your image never leaves the browser. Images above 4
        megapixels are processed in a background worker. Binary search over
        quality with downsampling fallback.
      </p>
    </div>
  );
}
