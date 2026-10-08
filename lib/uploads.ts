// Upload rules shared by the admin UI (browser) and the API routes (server).
// Keep this file free of Node-only imports; it ships to the browser.

export const UPLOAD_FOLDERS = ["board", "reps", "events"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

export function isUploadFolder(x: unknown): x is UploadFolder {
  return typeof x === "string" && (UPLOAD_FOLDERS as readonly string[]).includes(x);
}

export function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export function slugify(nameHint: string): string {
  const slug = nameHint
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return slug || "photo";
}

export function uploadPath(folder: UploadFolder, nameHint: string, now: Date, rand: string): string {
  const d = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `public/images/uploads/${folder}/${slugify(nameHint)}-${d}-${rand}.jpg`;
}

const UPLOAD_PATH_RE = /^public\/images\/uploads\/(board|reps|events)\/[a-z0-9-]+-\d{8}-[0-9a-f]{4}\.jpg$/;

export function isUploadPath(path: string): boolean {
  return UPLOAD_PATH_RE.test(path);
}

// Shown wherever an officer or rep has no photo (stored as "").
export const DEFAULT_HEADSHOT = "/images/board-placeholder.png";

export function headshotSrc(photo: string | undefined): string {
  return photo || DEFAULT_HEADSHOT;
}

export function toPublicUrl(repoPath: string): string {
  return repoPath.replace(/^public/, "");
}

export function toRepoPath(publicUrl: string): string {
  return `public${publicUrl}`;
}
