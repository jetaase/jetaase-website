// Builds the /api/github save request from the admin editor's state.
import { toPublicUrl } from "./uploads";
import { assignSlugs, isValidDate } from "./events";
import { cleanPhotos, type EditorPhoto } from "./gallery";

export type PendingPhoto = {
  status: "uploading" | "uploaded" | "failed";
  previewUrl: string;
  jpeg: Blob;
  upload?: { path: string; sha: string };
  error?: string;
};

export type SaveBody = {
  files: { path: string; content: string }[];
  uploads: { path: string; sha: string }[];
  deletes: string[];
  base: Record<string, string>;
  message: string;
};

export function buildSavePayload(args: {
  path: string; message: string; items: object[];
  pending: Record<string, PendingPhoto>; deletes: string[]; base: Record<string, string>;
}): SaveBody {
  const pending = Object.values(args.pending);
  if (pending.some((p) => p.status !== "uploaded")) throw new Error("uploads in progress");
  const ordered = args.items.map((it, i) => ({ ...it, order: i + 1 }));
  const content = JSON.stringify(ordered, null, 2) + "\n";
  // Only commit uploads the saved content actually uses.
  const uploads = pending
    .map((p) => p.upload!)
    .filter((u) => content.includes(toPublicUrl(u.path)));
  return { files: [{ path: args.path, content }], uploads, deletes: args.deletes, base: args.base, message: args.message };
}

// After a save, new photos aren't on the site until the redeploy finishes;
// the editor keeps showing these local previews (site URL → preview) meanwhile.
export function savedPreviews(
  pending: Record<string, PendingPhoto>, committed: SaveBody["uploads"],
): Record<string, string> {
  const paths = new Set(committed.map((u) => u.path));
  return Object.fromEntries(
    Object.values(pending)
      .filter((p) => p.upload && paths.has(p.upload.path))
      .map((p) => [toPublicUrl(p.upload!.path), p.previewUrl]),
  );
}

const UPLOAD_FAILED = "Upload failed — try again";

// What to show under a photo whose upload failed. `status` is null when the
// request never reached the server (offline, blocked).
export function uploadErrorMessage(status: number | null, serverError?: string): string {
  if (status === null) return UPLOAD_FAILED;
  if (status === 401) return "Your login expired. Sign in again in a new tab, then retry.";
  return serverError || UPLOAD_FAILED;
}

// What to show when Save fails. `status` is null when the request never
// reached the server; `serverError` is missing when the response wasn't JSON.
export function saveErrorMessage(status: number | null, serverError?: string): string {
  if (status === 401) return "Your login expired. Sign in again in a new tab, then click Save again.";
  return serverError || "Save failed — try again";
}

// What the sticky save bar says, or null to hide it. A save's result
// (saved or error) stays until the next edit clears it.
export function saveBarMessage(s: { dirty: boolean; saving: boolean; busy: boolean; status: string }): string | null {
  if (s.saving) return "Saving…";
  if (s.status) return s.status;
  if (!s.dirty) return null;
  return s.busy ? "Waiting for photos to finish uploading…" : "Unsaved changes";
}

export type CheckedField = { key: string; label: string; type?: "date" | "url" | "textarea"; required?: boolean };

// "RSVP link (optional)" → "RSVP link"; "Event name" → "event name".
function noun(label: string): string {
  const base = label.replace(/\s*\(optional\)$/i, "");
  return /^[A-Z][a-z]/.test(base) ? base[0].toLowerCase() + base.slice(1) : base;
}

// The first thing stopping a save, as a sentence for the status line, or null.
export function validate(
  fields: CheckedField[], items: Record<string, unknown>[], itemLabel: string,
): { id: string; message: string } | null {
  for (const [i, it] of items.entries()) {
    const name = String(it.title ?? it.name ?? "").trim();
    const who = name ? `"${name}"` : `${itemLabel[0].toUpperCase()}${itemLabel.slice(1)} ${i + 1}`;
    for (const f of fields) {
      const v = String(it[f.key] ?? "").trim();
      let problem = "";
      if (!v && f.required) problem = `add the ${noun(f.label)}.`;
      else if (v && f.type === "url" && !/^https?:\/\//i.test(v)) problem = `the ${noun(f.label)} should start with https://`;
      else if (v && f.type === "date" && !isValidDate(v)) problem = "pick a valid date.";
      if (problem) return { id: String(it.id), message: `${who}: ${problem}` };
    }
  }
  return null;
}

// Final touches before saving: date order (stable), slugs for new items,
// and saved-form galleries (removed photos dropped, captions trimmed).
export function prepareItems<T extends Record<string, unknown>>(
  items: T[], opts: { byDate?: boolean; slugs?: boolean; galleries?: string[] },
): T[] {
  let out = items.slice();
  if (opts.slugs) out = assignSlugs(out);
  if (opts.byDate) out.sort((a, b) => String(a.date ?? "").localeCompare(String(b.date ?? "")));
  for (const key of opts.galleries ?? []) {
    out = out.map((it) => (Array.isArray(it[key]) ? { ...it, [key]: cleanPhotos(it[key] as EditorPhoto[]) } : it));
  }
  return out;
}

// A card's heading: its name by default, or (e.g. officers by role) the
// `titleKey` field with the person under it, so a role outlasts whoever holds it.
export function cardHeading(
  it: Record<string, unknown>, itemLabel: string, titleKey?: string,
): { title: string; subtitle?: string } {
  const name = String(it.name || it.title || "");
  if (!titleKey) return { title: name || `New ${itemLabel}` };
  return { title: String(it[titleKey] || "") || `New ${itemLabel}`, subtitle: name || "(vacant)" };
}
