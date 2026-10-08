// Builds the /api/github save request from the admin editor's state.
import { toPublicUrl } from "./uploads";

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
