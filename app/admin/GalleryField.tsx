"use client";
import { useRef, useState } from "react";
import { renderJpeg } from "@/lib/image";
import { skippedMessage } from "@/lib/gallery";
import type { PhotoStatus } from "./PhotoField";
import AdminButton from "./AdminButton";
import styles from "./GalleryField.module.css";

export type GalleryPhotoView = {
  id: string; src: string; caption: string; status: PhotoStatus;
  removed: boolean; // published, will be deleted on save (Undo available)
  error?: string;
};

// A row of photo tiles plus "Add photos"; the parent owns uploading and state.
export default function GalleryField({
  label, photos, onPreparing, onAdd, onRemove, onUndo, onRetry, onMove, onCaption,
}: {
  label: string; photos: GalleryPhotoView[];
  onPreparing: (on: boolean) => void; // the parent keeps Save disabled while photos are being prepared
  onAdd: (picked: { jpeg: Blob; previewUrl: string }[]) => void;
  onRemove: (id: string) => void; onUndo: (id: string) => void; onRetry: (id: string) => void;
  onMove: (id: string, delta: -1 | 1) => void; onCaption: (id: string, value: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(false);
  const [message, setMessage] = useState("");

  async function chosen(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-picking the same files
    if (!files.length) return;
    setPreparing(true);
    onPreparing(true);
    // One at a time: decoding a dozen phone photos at once can run a phone out of memory.
    const picked: { jpeg: Blob; previewUrl: string }[] = [];
    let skipped = 0;
    for (const file of files) {
      try {
        const jpeg = await renderJpeg(file, { kind: "photo" });
        picked.push({ jpeg, previewUrl: URL.createObjectURL(jpeg) });
      } catch {
        skipped++;
      }
    }
    setPreparing(false);
    onPreparing(false);
    setMessage(skippedMessage(skipped));
    if (picked.length) onAdd(picked);
  }

  return (
    <div className={styles.gallery}>
      <span className={styles.label}>{label}</span>
      {photos.length === 0 ? (
        <p className={styles.empty}>No photos yet. Add them after the event.</p>
      ) : (
        <ol className={styles.tiles}>
          {photos.map((ph, i) => (
            <li key={ph.id} className={styles.tile}>
              <img src={ph.src} alt="" className={`${styles.thumb} ${ph.removed ? styles.faded : ""}`} />
              <div className={styles.row}>
                <AdminButton type="button" onClick={() => onMove(ph.id, -1)} disabled={i === 0} aria-label="Move earlier">‹</AdminButton>
                <AdminButton type="button" onClick={() => onMove(ph.id, 1)} disabled={i === photos.length - 1} aria-label="Move later">›</AdminButton>
                {ph.removed
                  ? <AdminButton type="button" onClick={() => onUndo(ph.id)}>Undo</AdminButton>
                  : <AdminButton type="button" onClick={() => onRemove(ph.id)} className={styles.danger}>Remove</AdminButton>}
              </div>
              <input
                value={ph.caption} placeholder="Caption (optional)" aria-label={`Caption for photo ${i + 1}`}
                disabled={ph.removed} onChange={(e) => onCaption(ph.id, e.target.value)}
              />
              {ph.status === "uploading" && <span className={styles.note}>Uploading…</span>}
              {ph.status === "uploaded" && <span className={styles.badge}>Unsaved</span>}
              {ph.status === "failed" && (
                <span className={styles.note} role="status">
                  {ph.error || "Upload failed — try again"}{" "}
                  <AdminButton type="button" onClick={() => onRetry(ph.id)}>Retry</AdminButton>
                </span>
              )}
              {ph.removed && <span className={styles.note}>Will be removed when you save</span>}
            </li>
          ))}
        </ol>
      )}
      <div className={styles.addRow}>
        <AdminButton type="button" onClick={() => input.current?.click()} disabled={preparing}>
          {preparing ? "Preparing photos…" : "Add photos"}
        </AdminButton>
        {message && <span className={styles.note} role="status">{message}</span>}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={chosen} />
    </div>
  );
}
