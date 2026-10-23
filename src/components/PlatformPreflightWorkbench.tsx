"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ToolSpec } from "@/config/tools";
import type { PreflightReport } from "@/lib/image-core/platform-preflight";
import { applyPlatformPreflight } from "@/lib/tools/platform-preflight";
import {
  loadImageFromFiles,
  track,
  type LoadedImage,
} from "@/lib/tools/runtime";

type Phase = "idle" | "processing" | "done" | "error";

type ReportLine = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

const MIN_FILE_BYTES = 10 * 1024;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export default function PlatformPreflightWorkbench({
  tool,
}: {
  tool: ToolSpec;
}) {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorText, setErrorText] = useState("");
  const [lines, setLines] = useState<ReportLine[]>([]);
  const [report, setReport] = useState<PreflightReport | null>(null);

  useEffect(() => {
    track({ tool: tool.slug, step: "visit" });
  }, [tool.slug]);

  const process = async (source: LoadedImage, fileBytes: number) => {
    setPhase("processing");
    setErrorText("");
    track({ tool: tool.slug, step: "tool_use" });
    try {
      const result = await applyPlatformPreflight(source.source);
      const sizeLine: ReportLine = {
        id: "file-size",
        label: "File size",
        passed: fileBytes >= MIN_FILE_BYTES && fileBytes <= MAX_FILE_BYTES,
        detail: `File is ${(fileBytes / 1024).toFixed(0)} KB (accepted range 10 KB – 10 MB).`,
      };
      setReport(result);
      setLines([
        ...result.checks.map((check) => ({
          id: check.id,
          label: check.label,
          passed: check.passed,
          detail: check.detail,
        })),
        sizeLine,
      ]);
      setPhase("done");
    } catch (cause) {
      setErrorText(cause instanceof Error ? cause.message : String(cause));
      setPhase("error");
    }
  };

  const onFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const [loaded] = await loadImageFromFiles([file]);
      setImage(loaded);
      await process(loaded, file.size);
    } catch (cause) {
      setErrorText(
        cause instanceof Error
          ? `Could not decode this image: ${cause.message}`
          : "Could not decode this image.",
      );
      setPhase("error");
    }
  };

  const failedRatio = lines.some((l) => l.id === "subject-ratio" && !l.passed);

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
                ✅
              </span>
              <span className="mt-4 text-[15px] font-semibold">
                Drop your main-image candidate
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

        {(phase === "processing" || phase === "done") && image && (
          <div className="p-6 sm:p-10">
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {lines.map((line) => (
                <li
                  key={line.id}
                  className={`rounded-lg border p-4 ${
                    line.passed
                      ? "border-[var(--border)] bg-[var(--soft)]"
                      : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40"
                  }`}
                >
                  <p className="text-[13px] font-semibold">
                    {line.passed ? "✅" : "❌"} {line.label}
                  </p>
                  <p className="mt-1 text-[12px] text-[var(--muted)]">
                    {line.detail}
                  </p>
                </li>
              ))}
            </ul>
            {report?.boundingBox && (
              <p className="mt-3 text-[11px] text-[var(--muted)]">
                Subject bounding box: {report.boundingBox.x1 - report.boundingBox.x0 + 1}
                ×{report.boundingBox.y1 - report.boundingBox.y0 + 1} px on a{" "}
                {report.width}×{report.height} canvas.
              </p>
            )}
            {failedRatio && (
              <p className="callout mt-4" role="status">
                Subject fills too little of the canvas.{" "}
                <Link href="/tools/resize-to-preset" className="underline">
                  Resize to a platform preset
                </Link>{" "}
                scales your subject up on the right canvas without distortion.
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-2.5 rounded-lg bg-[var(--soft)] p-5">
              <button
                type="button"
                className="button button-outline"
                onClick={() => {
                  setImage(null);
                  setReport(null);
                  setLines([]);
                  setPhase("idle");
                }}
              >
                Check another image
              </button>
            </div>
          </div>
        )}
      </div>

      {phase === "error" && (
        <p className="callout mt-4" role="alert">
          {errorText || "Something went wrong analysing this image."}
        </p>
      )}

      <p className="bench-foot mono-label">
        🔒 Runs locally — your image never leaves the browser. Images above 4
        megapixels are analysed in a background worker.
      </p>
    </div>
  );
}
