"use client";
import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import type { PixelArea } from "@/lib/image";
import styles from "./CropDialog.module.css";

// `src` is an object URL owned (created and revoked) by the caller.
export default function CropDialog({
  src, onCancel, onConfirm,
}: { src: string; onCancel: () => void; onConfirm: (area: PixelArea) => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Crop photo">
      <div className={styles.dialog}>
        <div className={styles.cropArea}>
          <Cropper
            image={src} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false}
            onCropChange={setCrop} onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
          />
        </div>
        <label className={styles.zoom}>
          <span>Zoom</span>
          <input
            type="range" min={1} max={3} step={0.01} value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>
        <div className={styles.actions}>
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="button" className={styles.primary} disabled={!area} onClick={() => area && onConfirm(area)}>
            Use photo
          </button>
        </div>
      </div>
    </div>
  );
}
