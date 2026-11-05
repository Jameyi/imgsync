"use client";

import { useEffect, useRef, useState } from "react";
import type { ToolSpec } from "@/config/tools";
import { track } from "@/lib/tools/runtime";
import {
  createFaviconKit,
  FAVICON_SIZES,
  type FaviconKit,
} from "@/lib/tools/favicon-kit";
import {
  buildFaviconSnippet,
  buildWebmanifest,
  FAVICON_FILES,
} from "@/lib/image-core/ico-export";

const download = (bytes: Uint8Array, file: string, mime: string) => {
  const blob = new Blob([bytes.slice().buffer], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file;
  anchor.click();
  URL.revokeObjectURL(url);
};

export default function FaviconKitWorkbench({
  tool,
}: {
  tool: ToolSpec;
}) {
  const [source, setSource] = useState<{
    width: number;
    height: number;
    data: Uint8ClampedArray;
  } | null>(null);
  const [fileName, setFileName] = useState("");
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [kit, setKit] = useState<FaviconKit | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    track({ tool: tool.slug, step: "visit" });
    return () => {
      if (previewURL) URL.revokeObjectURL(previewURL);
    };
  }, [tool.slug, previewURL]);

  const loadFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorText("");
    try {
      const file = files[0];
      const bitmap = await createImageBitmap(file);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
      context.drawImage(bitmap, 0, 0);
      const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);
      bitmap.close();
      setSource({
        width: imageData.width,
        height: imageData.height,
        data: imageData.data,
      });
      setFileName(file.name);
      setPreviewURL(URL.createObjectURL(file));
      setKit(null);
    } catch (cause) {
      setErrorText(
        cause instanceof Error ? cause.message : "Could not read that file.",
      );
    }
  };

  const generate = async () => {
    if (!source) return;
    setBusy(true);
    setErrorText("");
    track({ tool: tool.slug, step: "tool_use" });
    try {
      setKit(await createFaviconKit(source));
    } catch (cause) {
      setErrorText(
        cause instanceof Error ? cause.message : "Generation failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const exportIco = () => {
    if (!kit) return;
    download(kit.ico, FAVICON_FILES.ico, "image/x-icon");
    track({ tool: tool.slug, step: "export_done" });
  };

  const exportPng = (file: string) => {
    const png = kit?.pngs.find((entry) => entry.file === file);
    if (!png) return;
    download(png.bytes, file, "image/png");
    track({ tool: tool.slug, step: "export_done" });
  };

  const snippet = source ? buildFaviconSnippet() : "";
  const manifest = source ? buildWebmanifest() : "";

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
          {source
            ? `${fileName} — ${source.width}×${source.height}`
            : "Drop a logo image (square PNG works best)"}
        </p>
        <button
          type="button"
          className="button button-outline mt-3"
          onClick={() => inputRef.current?.click()}
        >
          {source ? "Replace image" : "Choose file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => void loadFile(event.target.files)}
        />
      </div>

      {source && (
        <>
          <button
            type="button"
            className="button button-dark mt-4 w-full"
            disabled={busy}
            onClick={() => void generate()}
          >
            {busy ? "Generating…" : "Generate favicon kit"}
          </button>

          {errorText && (
            <p role="alert" className="mt-3 text-[12px] text-red-600">
              {errorText}
            </p>
          )}

          {kit && (
            <div className="mt-4">
              <p className="mono-label">PREVIEW</p>
              <div className="mt-2 flex items-end gap-3">
                {FAVICON_SIZES.map((size) => (
                  <figure key={size} className="text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewURL ?? undefined}
                      width={Math.min(size, 64)}
                      height={Math.min(size, 64)}
                      alt={`${size}px preview`}
                      className="mx-auto border border-[var(--muted)]"
                    />
                    <figcaption className="mono-label mt-1">{size}</figcaption>
                  </figure>
                ))}
              </div>

              <button
                type="button"
                className="button button-dark mt-4 w-full"
                onClick={exportIco}
              >
                Download favicon.ico (16+32+48)
              </button>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {kit.pngs.map((png) => (
                  <button
                    key={png.file}
                    type="button"
                    className="button button-outline"
                    onClick={() => exportPng(png.file)}
                  >
                    {png.file}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <p className="mono-label">HTML — paste into your &lt;head&gt;</p>
                <pre className="mt-1 overflow-x-auto rounded bg-black/80 p-3 text-[11px] text-green-200">
                  {snippet}
                </pre>
                <p className="mono-label mt-3">site.webmanifest — icons</p>
                <pre className="mt-1 overflow-x-auto rounded bg-black/80 p-3 text-[11px] text-green-200">
                  {manifest}
                </pre>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
