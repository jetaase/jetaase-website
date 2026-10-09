// Gallery editing helpers shared by the admin editor and its save step.
// Keep this file free of Node-only imports; it ships to the browser.
import type { EventPhoto } from "./events";

// While editing, a removed published photo stays (faded, with Undo) until save.
export type EditorPhoto = EventPhoto & { removed?: boolean };

// Upload state key: "<item>:<field>" for a single photo (poster, headshot),
// "<item>:<field>:<photo>" for one photo in a gallery.
export function slotKey(itemId: string, fieldKey: string, photoId?: string): string {
  return photoId ? `${itemId}:${fieldKey}:${photoId}` : `${itemId}:${fieldKey}`;
}

export function newPhotoId(now: number, index: number): string {
  return `ph${now}-${index}`;
}

export function movePhoto<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const to = index + delta;
  if (to < 0 || to >= list.length) return list;
  const next = list.slice();
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

// What gets saved: removed and unfinished photos dropped, flags stripped, captions trimmed.
export function cleanPhotos(photos: EditorPhoto[]): EventPhoto[] {
  return photos
    .filter((p) => !p.removed && p.src)
    .map(({ id, src, caption }) => ({ id, src, caption: caption.trim() }));
}

export function skippedMessage(n: number): string {
  if (n === 0) return "";
  return n === 1
    ? "1 file isn't a photo we can use. Try a JPG or PNG."
    : `${n} files aren't photos we can use. Try a JPG or PNG.`;
}
