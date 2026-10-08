// Turns a picked photo into the JPEG we upload: decoded (upright), optionally
// cropped, resized, and re-encoded in the browser.

export type ImageKind = "headshot" | "photo";
export type PixelArea = { x: number; y: number; width: number; height: number };

export const JPEG_QUALITY = 0.82;
const HEADSHOT = 600;
const PHOTO_MAX = 1600;
const UNSUPPORTED = "That file isn't a photo we can use. Try a JPG or PNG.";

export function targetSize(kind: ImageKind, w: number, h: number) {
  if (kind === "headshot") {
    const s = Math.min(HEADSHOT, Math.round(Math.min(w, h)));
    return { width: s, height: s };
  }
  const scale = Math.min(1, PHOTO_MAX / Math.max(w, h));
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

export function clampCrop(a: PixelArea, naturalW: number, naturalH: number): PixelArea {
  const width = Math.max(1, Math.min(naturalW, Math.round(a.width)));
  const height = Math.max(1, Math.min(naturalH, Math.round(a.height)));
  const x = Math.min(Math.max(0, Math.round(a.x)), naturalW - width);
  const y = Math.min(Math.max(0, Math.round(a.y)), naturalH - height);
  return { x, y, width, height };
}

export class UnsupportedImageError extends Error {}

// Decode through <img>: browsers draw it upright per EXIF orientation, and
// it's the same element react-easy-crop measures, so crop pixels line up.
async function decode(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    if (!img.naturalWidth) throw new Error("empty image");
    return img;
  } catch {
    throw new UnsupportedImageError(UNSUPPORTED);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Whether the browser can open this file as an image (e.g. HEIC fails on
// desktop Chrome). Checked before showing the crop dialog.
export async function canDecode(file: File): Promise<boolean> {
  try {
    await decode(file);
    return true;
  } catch {
    return false;
  }
}

export async function renderJpeg(file: File, opts: { kind: ImageKind; crop?: PixelArea }): Promise<Blob> {
  const img = await decode(file);
  const w = img.naturalWidth, h = img.naturalHeight;
  const src = opts.crop ? clampCrop(opts.crop, w, h) : { x: 0, y: 0, width: w, height: h };
  const out = targetSize(opts.kind, src.width, src.height);
  const canvas = document.createElement("canvas");
  canvas.width = out.width;
  canvas.height = out.height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // JPEG has no transparency; flatten onto white
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, src.x, src.y, src.width, src.height, 0, 0, out.width, out.height);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", JPEG_QUALITY));
  if (!blob) throw new UnsupportedImageError(UNSUPPORTED);
  return blob;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(bin);
}
