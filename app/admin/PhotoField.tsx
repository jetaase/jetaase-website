"use client";
import { useRef, useState } from "react";
import { canDecode, renderJpeg, UnsupportedImageError, type ImageKind, type PixelArea } from "@/lib/image";
import CropDialog from "./CropDialog";
import styles from "./PhotoField.module.css";

export type PhotoStatus = "saved" | "uploading" | "uploaded" | "failed";
export type PhotoView = {
  src: string; status: PhotoStatus;
  pendingDelete: boolean; // a published upload will be deleted on save
  canUndo: boolean; // the photo was removed this session and can be restored
  error?: string;
};

const UNSUPPORTED = "That file isn't a photo we can use. Try a JPG or PNG.";

// Picks, crops (headshots), and renders a photo; the parent owns uploading.
export default function PhotoField({
  kind, view, onPick, onRemove, onUndoRemove, onRetry,
}: {
  kind: ImageKind; view: PhotoView;
  onPick: (jpeg: Blob, previewUrl: string) => void;
  onRemove: () => void; onUndoRemove: () => void; onRetry: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  // The file being cropped and its object URL, created/revoked in handlers.
  const [cropping, setCropping] = useState<{ file: File; src: string } | null>(null);
  const [error, setError] = useState("");

  function closeCrop() {
    if (cropping) URL.revokeObjectURL(cropping.src);
    setCropping(null);
  }

  async function finish(file: File, crop?: PixelArea) {
    closeCrop();
    try {
      const jpeg = await renderJpeg(file, { kind, crop });
      setError("");
      onPick(jpeg, URL.createObjectURL(jpeg));
    } catch (e) {
      setError(e instanceof UnsupportedImageError ? e.message : UNSUPPORTED);
    }
  }

  async function chosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (kind !== "headshot") return void finish(file);
    if (!(await canDecode(file))) return setError(UNSUPPORTED);
    setError("");
    setCropping({ file, src: URL.createObjectURL(file) });
  }

  const message =
    error ||
    (view.status === "failed" ? view.error || "Upload failed — try again" : "") ||
    (view.pendingDelete ? "Will be removed when you save" : "");

  return (
    <div className={styles.field}>
      {view.src ? (
        <img
          src={view.src}
          alt=""
          className={`${kind === "headshot" ? styles.thumbRound : styles.thumb} ${view.pendingDelete ? styles.faded : ""}`}
        />
      ) : (
        <div className={`${styles.thumb} ${styles.empty}`}>No poster</div>
      )}
      <div className={styles.side}>
        <div className={styles.buttons}>
          <button type="button" onClick={() => input.current?.click()} disabled={view.status === "uploading"}>
            {view.status === "uploading" ? "Uploading…" : view.src ? "Change photo" : "Add photo"}
          </button>
          {view.pendingDelete || view.canUndo
            ? <button type="button" onClick={onUndoRemove}>Undo</button>
            : view.src && <button type="button" onClick={onRemove} className={styles.danger}>Remove</button>}
          {view.status === "failed" && <button type="button" onClick={onRetry}>Retry</button>}
        </div>
        {(view.status === "uploading" || view.status === "uploaded") && <span className={styles.badge}>Unsaved</span>}
        {message && <span className={styles.message} role="status">{message}</span>}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={chosen} />
      {cropping && (
        <CropDialog src={cropping.src} onCancel={closeCrop} onConfirm={(a) => void finish(cropping.file, a)} />
      )}
    </div>
  );
}
