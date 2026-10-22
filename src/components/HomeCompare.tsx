"use client";

import { useCallback, useRef, useState } from "react";

const MIN_POS = 4;
const MAX_POS = 96;
const DEFAULT_POS = 52;

// Before/after compare card driven by a --pos CSS variable, mirroring the
// approved design demo: the "before" (original) layer is clipped to the left
// of the divider, the "after" (cutout) layer shows the transparency
// checkerboard underneath. Pointer-drag anywhere on the media, or focus the
// handle and use arrow keys.
export default function HomeCompare() {
  const mediaRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [pos, setPos] = useState(DEFAULT_POS);

  const setFromClientX = useCallback((clientX: number) => {
    const media = mediaRef.current;
    if (!media) return;
    const rect = media.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(MIN_POS, Math.min(MAX_POS, pct)));
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    setFromClientX(event.clientX);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) setFromClientX(event.clientX);
  };

  const endDrag = () => {
    draggingRef.current = false;
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const step =
      event.key === "ArrowLeft" ? -2
      : event.key === "ArrowRight" ? 2
      : event.key === "Home" ? MIN_POS - pos
      : event.key === "End" ? MAX_POS - pos
      : 0;
    if (step === 0) return;
    event.preventDefault();
    setPos((current) => Math.max(MIN_POS, Math.min(MAX_POS, current + step)));
  };

  return (
    <div className="home-compare" style={{ "--pos": `${pos}%` } as React.CSSProperties}>
      <div className="home-compare-head">
        <span className="mono-label">sample-bottle.png</span>
        <span className="mono-label" style={{ color: "var(--pass)" }}>
          ● Local preview
        </span>
      </div>
      <div
        ref={mediaRef}
        className="home-compare-media"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="cmp-layer cmp-after checker">
          <span className="cmp-bottle cmp-bottle-cut" aria-hidden="true">
            🧴
          </span>
        </div>
        <div className="cmp-layer cmp-before">
          <span className="cmp-bottle" aria-hidden="true">
            🧴
          </span>
        </div>
        <span className="cmp-tag left">Original</span>
        <span className="cmp-tag right">Cutout</span>
        <button
          type="button"
          role="slider"
          aria-label="Compare original and cutout"
          aria-valuemin={MIN_POS}
          aria-valuemax={MAX_POS}
          aria-valuenow={Math.round(pos)}
          className="cmp-handle"
          style={{ left: `${pos}%` }}
          onKeyDown={onKeyDown}
        >
          <span className="cmp-grip">⇔</span>
        </button>
      </div>
      <div className="home-compare-foot">
        <span>Drag to compare — live on the tool page</span>
        <span>PNG · 240×300</span>
      </div>
    </div>
  );
}
