"use client";
import { useEffect, useRef } from "react";
import styles from "./Lightbox.module.css";

export type LightboxPhoto = { src: string; alt: string; caption: string };

const SWIPE_PX = 50;

// Full-screen photo viewer on a native <dialog>: modal, focus-trapped, Esc closes.
export default function Lightbox({
  photos, index, onIndex, onClose,
}: {
  photos: LightboxPhoto[]; index: number | null;
  onIndex: (i: number) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const swipeStart = useRef<number | null>(null);
  const swiped = useRef(false);
  const open = index !== null;
  const n = photos.length;
  const go = (delta: number) => { if (index !== null) onIndex((index + delta + n) % n); };

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement as HTMLElement | null;
      document.documentElement.style.overflow = "hidden";
      d.showModal();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  // Preload the neighbors so next/previous feel instant.
  useEffect(() => {
    if (index === null || n < 2) return;
    for (const i of [(index + 1) % n, (index - 1 + n) % n]) new Image().src = photos[i].src;
  }, [index, n, photos]);

  function closed() {
    document.documentElement.style.overflow = "";
    opener.current?.focus();
    onClose();
  }

  const photo = index !== null ? photos[index] : null;
  return (
    <dialog
      ref={dialog} className={styles.dialog} aria-label="Photo viewer"
      onClose={closed}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
      onPointerDown={(e) => { swipeStart.current = e.clientX; }}
      onPointerUp={(e) => {
        const start = swipeStart.current;
        swipeStart.current = null;
        if (start === null || n < 2) return;
        const dx = e.clientX - start;
        if (Math.abs(dx) >= SWIPE_PX) {
          swiped.current = true; // don't let the click that follows close the viewer
          go(dx < 0 ? 1 : -1);
        }
      }}
      onClick={(e) => {
        if (swiped.current) { swiped.current = false; return; }
        // Anywhere but the photo, its caption, or a control counts as the backdrop
        // (the figure is wider than a portrait photo, so it can't be the test).
        if (!(e.target as Element).closest("img, figcaption, button")) dialog.current?.close();
      }}
    >
      {photo && (
        <>
          <figure className={styles.figure}>
            <img src={photo.src} alt={photo.alt} className={styles.img} draggable={false} />
            <figcaption className={styles.caption}>
              {photo.caption && <span>{photo.caption}</span>}
              <span className={styles.count}>{index! + 1} / {n}</span>
            </figcaption>
          </figure>
          {n > 1 && (
            <>
              <button type="button" className={`${styles.nav} ${styles.prev}`} onClick={() => go(-1)} aria-label="Previous photo">‹</button>
              <button type="button" className={`${styles.nav} ${styles.next}`} onClick={() => go(1)} aria-label="Next photo">›</button>
            </>
          )}
          <button type="button" className={styles.close} onClick={() => dialog.current?.close()} aria-label="Close">✕</button>
        </>
      )}
    </dialog>
  );
}
