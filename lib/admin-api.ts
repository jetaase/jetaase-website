// Request handling for the admin's /api/upload and /api/github routes, kept
// free of Next.js so it can be unit-tested with a fake fetch.
import {
  isUploadFolder, isJpeg, MAX_UPLOAD_BYTES, uploadPath, isUploadPath, toPublicUrl,
} from "./uploads";
import { gitBlobSha } from "./git-sha";
import {
  type Repo, type TreeEntry, createBlob, getHeadSha, getFileAt, commitTree, updateRef,
} from "./github";
import { EDITABLE_PATHS } from "./content";
import type { SaveBody } from "./editor-save";

export type Deps = {
  fetchImpl: typeof fetch; repo: Repo; authed: boolean;
  now?: () => Date; rand?: () => string;
};
export type Result = { status: number; body: Record<string, unknown> };


export const CONFLICT_MESSAGE =
  "Someone else saved changes, or the site is still updating from your last save. Wait a minute, reload, and try again.";

const fail = (status: number, error: string): Result => ({ status, body: { error } });
// 8 hex digits: a gallery uploads many photos with the same name and date at once.
const randHex = () => Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, "0");

export async function handleUpload(deps: Deps, body: unknown): Promise<Result> {
  if (!deps.authed) return fail(401, "unauthorized");
  const b = (body ?? {}) as { folder?: unknown; nameHint?: unknown; dataBase64?: unknown };
  if (!isUploadFolder(b.folder)) return fail(400, "bad folder");
  if (typeof b.dataBase64 !== "string" || !/^[A-Za-z0-9+/]+=*$/.test(b.dataBase64)) {
    return fail(400, "bad data");
  }
  const bytes = Buffer.from(b.dataBase64, "base64");
  if (bytes.length >= MAX_UPLOAD_BYTES) return fail(400, "photo too large");
  if (!isJpeg(bytes)) return fail(400, "not a JPEG");
  const nameHint = typeof b.nameHint === "string" ? b.nameHint : "";
  const path = uploadPath(b.folder, nameHint, (deps.now ?? (() => new Date()))(), (deps.rand ?? randHex)());
  try {
    const sha = await createBlob(deps.fetchImpl, deps.repo, b.dataBase64);
    return { status: 200, body: { path, sha } };
  } catch {
    return fail(500, "Upload failed — try again");
  }
}

function parseSave(body: unknown): SaveBody | null {
  const b = body as Partial<SaveBody> | null;
  if (!b || !Array.isArray(b.files) || !Array.isArray(b.uploads) || !Array.isArray(b.deletes)) return null;
  if (typeof b.message !== "string" || !b.message || typeof b.base !== "object" || b.base === null) return null;
  const filesOk = b.files.every((x) => typeof x?.path === "string" && typeof x?.content === "string");
  const upsOk = b.uploads.every((x) => typeof x?.path === "string" && typeof x?.sha === "string");
  const delsOk = b.deletes.every((x) => typeof x === "string");
  return filesOk && upsOk && delsOk ? (b as SaveBody) : null;
}

export async function handleSave(deps: Deps, body: unknown): Promise<Result> {
  if (!deps.authed) return fail(401, "unauthorized");
  const b = parseSave(body);
  if (!b) return fail(400, "bad request");
  if (!b.files.every((x) => EDITABLE_PATHS.includes(x.path))) return fail(403, "path not editable");
  if (!b.uploads.every((x) => isUploadPath(x.path))) return fail(403, "path not editable");
  if (!b.deletes.every(isUploadPath)) return fail(403, "path not editable");

  const { fetchImpl, repo } = deps;
  try {
    // One retry: if the branch moves between building and publishing the
    // commit, rebuild on the new head (re-running the conflict check).
    for (let attempt = 0; attempt < 2; attempt++) {
      const head = await getHeadSha(fetchImpl, repo);

      // Each file must be unchanged since the editor loaded it.
      for (const file of b.files) {
        const current = await getFileAt(fetchImpl, repo, file.path, head);
        if ((current?.sha ?? null) !== (b.base[file.path] ?? null)) {
          return { status: 409, body: { error: CONFLICT_MESSAGE } };
        }
      }

      // Never delete a photo that any content file (after this save) still uses.
      const incoming = new Map(b.files.map((x) => [x.path, x.content]));
      const texts: string[] = [...incoming.values()];
      for (const p of EDITABLE_PATHS) {
        if (incoming.has(p)) continue;
        const f = await getFileAt(fetchImpl, repo, p, head);
        if (f) texts.push(f.text);
      }
      const deletable: string[] = [];
      for (const d of b.deletes) {
        if (texts.some((t) => t.includes(toPublicUrl(d)))) continue;
        if (await getFileAt(fetchImpl, repo, d, head)) deletable.push(d);
      }

      const entries: TreeEntry[] = [
        ...b.files.map((x) => ({ path: x.path, content: x.content })),
        ...b.uploads.map((x) => ({ path: x.path, sha: x.sha })),
        ...deletable.map((path) => ({ path, sha: null })),
      ];
      const commit = await commitTree(fetchImpl, repo, { parent: head, entries, message: b.message });
      if ((await updateRef(fetchImpl, repo, commit.sha)) === "ok") {
        const blobShas = Object.fromEntries(b.files.map((x) => [x.path, gitBlobSha(x.content)]));
        return { status: 200, body: { commitUrl: commit.commitUrl, blobShas } };
      }
    }
    return { status: 409, body: { error: CONFLICT_MESSAGE } };
  } catch {
    return fail(500, "Save failed — try again");
  }
}
