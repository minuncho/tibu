"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export type CropperHandle = { crop: () => Promise<Blob> };

const MAX_ZOOM = 4;
const OUTPUT_SIZE = 1024;

type View = { zoom: number; x: number; y: number };

// Square crop: drag to move the photo, pinch or use the slider to zoom.
// x/y are the photo's offset from the frame center, in frame pixels.
export const Cropper = forwardRef<CropperHandle, { src: string }>(function Cropper({ src }, ref) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [size, setSize] = useState(0);
  const [view, setView] = useState<View>({ zoom: 1, x: 0, y: 0 });

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(() => setSize(frame.clientWidth));
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setNatural(null);
    setView({ zoom: 1, x: 0, y: 0 });
  }, [src]);

  // At zoom 1 the shorter side of the photo exactly fills the frame.
  const base = natural && size ? size / Math.min(natural.w, natural.h) : 0;

  // Keeps the photo covering the whole frame.
  function clamp(next: View): View {
    if (!natural) return next;
    const zoom = Math.min(MAX_ZOOM, Math.max(1, next.zoom));
    const maxX = Math.max(0, (natural.w * base * zoom - size) / 2);
    const maxY = Math.max(0, (natural.h * base * zoom - size) / 2);
    return {
      zoom,
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  function onPointerMove(e: React.PointerEvent) {
    const previous = pointers.current.get(e.pointerId);
    if (!previous) return;
    const current = { x: e.clientX, y: e.clientY };

    if (pointers.current.size === 1) {
      const dx = current.x - previous.x;
      const dy = current.y - previous.y;
      setView((v) => clamp({ ...v, x: v.x + dx, y: v.y + dy }));
    } else if (pointers.current.size === 2) {
      const other = [...pointers.current.entries()].find(([id]) => id !== e.pointerId)![1];
      const before = Math.hypot(previous.x - other.x, previous.y - other.y);
      const after = Math.hypot(current.x - other.x, current.y - other.y);
      if (before > 0) setView((v) => clamp({ ...v, zoom: v.zoom * (after / before) }));
    }
    pointers.current.set(e.pointerId, current);
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
  }

  useImperativeHandle(ref, () => ({
    crop() {
      const img = imgRef.current;
      if (!img || !natural || !base) return Promise.reject(new Error("Photo is not ready"));
      const k = base * view.zoom;
      const side = size / k;
      const sx = (natural.w * k - size) / 2 / k - view.x / k;
      const sy = (natural.h * k - size) / 2 / k - view.y / k;

      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      ctx.drawImage(img, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Could not read photo"))),
          "image/jpeg",
          0.92,
        );
      });
    },
  }));

  const width = natural ? natural.w * base * view.zoom : 0;
  const height = natural ? natural.h * base * view.zoom : 0;

  return (
    <div className="cropper-wrap">
      <div
        ref={frameRef}
        className="cropper"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt=""
          draggable={false}
          onLoad={(e) =>
            setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
          }
          style={{
            width,
            height,
            left: (size - width) / 2 + view.x,
            top: (size - height) / 2 + view.y,
            visibility: natural && size ? "visible" : "hidden",
          }}
        />
      </div>
      <input
        className="zoom"
        type="range"
        aria-label="Zoom"
        min={1}
        max={MAX_ZOOM}
        step={0.01}
        value={view.zoom}
        onChange={(e) => setView((v) => clamp({ ...v, zoom: Number(e.target.value) }))}
      />
    </div>
  );
});
