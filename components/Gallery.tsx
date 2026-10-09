"use client";
import Image from "next/image";
import { useState } from "react";
import type { EventPhoto } from "@/lib/events";
import Lightbox, { type LightboxPhoto } from "./Lightbox";
import styles from "./Gallery.module.css";

// Square thumbnail grid; a tile opens the whole photo in the lightbox.
// Each tile links to the full image, so it still works without JavaScript.
export default function Gallery({
  photos, eventTitle, credit,
}: { photos: EventPhoto[]; eventTitle: string; credit: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const items: LightboxPhoto[] = photos.map((p, i) => ({
    src: p.src, caption: p.caption, alt: p.caption || `Photo ${i + 1} from ${eventTitle}`,
  }));
  return (
    <section className={styles.section} aria-labelledby="photos-heading">
      <h2 id="photos-heading" className={styles.heading}>Photos</h2>
      <ul className={styles.grid}>
        {items.map((p, i) => (
          <li key={photos[i].id}>
            <a href={p.src} className={styles.tile} onClick={(e) => { e.preventDefault(); setIndex(i); }}>
              <Image src={p.src} alt={p.alt} fill sizes="(max-width: 768px) 50vw, 300px" className={styles.img} />
            </a>
          </li>
        ))}
      </ul>
      {credit && <p className={styles.credit}>{credit}</p>}
      <Lightbox photos={items} index={index} onIndex={setIndex} onClose={() => setIndex(null)} />
    </section>
  );
}
