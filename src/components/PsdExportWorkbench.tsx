"use client";

import { useEffect, useRef, useState } from "react";
import type { ToolSpec } from "@/config/tools";
import { loadImageFromFiles, track } from "@/lib/tools/runtime";
import { applyPsdExport, type PsdLayerInput } from "@/lib/tools/psd-export";

type LayerRow = {
  id: number;
  fileName: string;
  visible: boolean;
  imageData: {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  };
};

export default function PsdExportWorkbench({ tool }: { tool: ToolSpec }) {
  const [layers, setLayers] = useState<LayerRow[]>([]);
  const [phase, setPhase] = useState<"idle" | "processing" | "done" | "error">(
    "idle",
  );
  const [errorText, setErrorText] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    track({ tool: tool.slug, step: "visit" });
  }, [tool.slug]);

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorText("");
    try {
      const loaded = await loadImageFromFiles(Array.from(files));
      setLayers((current) => [
        ...current,
        ...loaded.map((image) => ({
          id: nextId.current++,
          fileName: image.fileName,
          visible: true,
          imageData: {
            width: image.source.width,
            height: image.source.height,
            data: image.source.data,
          },
        })),
      ]);
    } catch (cause) {
      setErrorText(
        cause instanceof Error ? cause.message : "Could not read those files.",
      );
    }
  };

  const moveLayer = (index: number, direction: -1 | 1) => {
    setLayers((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const toggleVisible = (id: number) => {
    setLayers((current) =>
      current.map((row) =>
        row.id === id ? { ...row, visible: !row.visible } : row,
      ),
    );
  };

  const renameLayer = (id: number, name: string) => {
    setLayers((current) =>
      current.map((row) => (row.id === id ? { ...row, fileName: name } : row)),
    );
  };

  const exportPsd = async () => {
    if (layers.length === 0) return;
    setBusy(true);
    setPhase("processing");
    setErrorText("");
    track({ tool: tool.slug, step: "tool_use" });
    try {
      const inputs: PsdLayerInput[] = layers.map((row) => ({
        name: row.fileName,
        imageData: row.imageData,
        visible: row.visible,
      }));
      const buffer = await applyPsdExport(inputs);
      const blob = new Blob([buffer], { type: "image/vnd.adobe.photoshop" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "imgsync-layers.psd";
      anchor.click();
      URL.revokeObjectURL(url);
      setPhase("done");
      track({ tool: tool.slug, step: "export_done" });
    } catch (cause) {
      setPhase("error");
      setErrorText(
        cause instanceof Error ? cause.message : "PSD export failed.",
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
          void addFiles(event.dataTransfer.files);
        }}
      >
        <p className="dropzone-title">Drop images here — each becomes a layer</p>
        <p className="text-[11px] text-[var(--muted)]">
          2-10 images works best. Files never leave your device.
        </p>
        <button
          type="button"
          className="button button-outline mt-3"
          onClick={() => inputRef.current?.click()}
        >
          Choose files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => void addFiles(event.target.files)}
        />
      </div>

      {layers.length > 0 && (
        <div className="mt-4">
          <p className="mono-label mb-2">
            LAYERS (top of list = top layer in the PSD)
          </p>
          <ul className="grid gap-2">
            {layers.map((row, index) => (
              <li
                key={row.id}
                className="flex items-center gap-2 rounded border border-[var(--border)] p-2"
              >
                <input
                  className="min-w-0 flex-1 rounded border border-[var(--border)] bg-transparent px-2 py-1 text-[12px]"
                  value={row.fileName}
                  onChange={(event) => renameLayer(row.id, event.target.value)}
                  aria-label={`Layer name for ${row.fileName}`}
                />
                <label className="flex items-center gap-1 text-[11px]">
                  <input
                    type="checkbox"
                    checked={row.visible}
                    onChange={() => toggleVisible(row.id)}
                  />
                  visible
                </label>
                <span className="text-[10px] text-[var(--muted)]">
                  {row.imageData.width}×{row.imageData.height}
                </span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => moveLayer(index, -1)}
                  disabled={index === 0}
                  aria-label="Move layer up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => moveLayer(index, 1)}
                  disabled={index === layers.length - 1}
                  aria-label="Move layer down"
                >
                  ↓
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {errorText && (
        <p role="alert" className="mt-3 text-[12px] text-red-600">
          {errorText}
        </p>
      )}

      <button
        type="button"
        className="button button-dark mt-4 w-full"
        disabled={layers.length === 0 || busy}
        onClick={() => void exportPsd()}
      >
        {busy
          ? "Building PSD…"
          : phase === "done"
            ? "Downloaded ✓ — export again"
            : `Export ${layers.length || ""} layer${layers.length === 1 ? "" : "s"} as PSD`}
      </button>
    </div>
  );
}
