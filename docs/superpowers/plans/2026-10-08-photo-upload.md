# Photo Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Board members can add, replace (with a circular crop for headshots), and remove photos in `/admin`. Photos are stored in the GitHub repo and published together with the content in one commit per Save.

**Architecture:**
- **Upload:** the browser decodes the photo, crops and resizes it, re-encodes it as JPEG, and sends it to `/api/upload`. That route stores it as an unreferenced git blob.
- **Save:** Save posts the content JSON, the uploaded blob SHAs, and the delete paths to `/api/github`. That route checks for conflicts and delete safety, then makes a single tree commit with the Git Data API.
- **Testability:** route logic lives in pure, injectable functions so it can be unit-tested without GitHub.

**Tech Stack:** Next.js 16.4 App Router (route handlers), React 19.2, TypeScript, CSS Modules, vitest 4, GitHub REST Git Data API, react-easy-crop 6.2.3.

**Spec:** `docs/superpowers/specs/2026-10-08-photo-upload-design.md`

## Global Constraints

- **Commits:** do not commit, push, or create branches unless the user explicitly asks. Each task ends at a review checkpoint instead of a commit.
- **Next.js docs:** read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` before writing route handlers (this Next version has breaking changes; see AGENTS.md). Read request bodies with `await request.json()`.
- **Storage:** uploads go under `public/images/uploads/<folder>/`, with folders limited to `board`, `reps`, and `events`.
- **Image output:**
  - Headshots are 600×600 JPEG.
  - Photos keep their aspect ratio, with the longest side 1600. Never upscale.
  - JPEG quality is 0.82.
- **Server acceptance:** JPEG only (magic bytes `FF D8 FF`), with a decoded size under 3 MB (`MAX_UPLOAD_BYTES = 3 * 1024 * 1024`).
- **Deleting:** only paths matching `isUploadPath` that no content file references, and only paths that exist at the head.
- **Security:** both API routes are auth-first (`requireSession()`), returning 401 otherwise. The GitHub token never leaves the server, including in error messages.
- **Dependencies:** pin `react-easy-crop@6.2.3` exactly (6.2.4 is less than two weeks old).
- **User-facing copy, verbatim:**
  - Undecodable file: "That file isn't a photo we can use. Try a JPG or PNG."
  - Conflict: "Someone else saved changes, or the site is still updating from your last save. Wait a minute, reload, and try again."
  - Save success: "Saved. New photos appear once the site finishes updating (about a minute)."
  - Upload failure: "Upload failed — try again"
  - Pending delete: "Will be removed when you save"

## Review Focus

1. **Phone photos with EXIF rotation** (portrait iPhone JPEGs) must come out upright. Decode with `createImageBitmap(file, { imageOrientation: "from-image" })` (Task 5). The Task 8 manual check uses a rotated sample.
2. **Names with no ASCII letters** ("渡辺", "Ōno Ryū") must still produce a valid filename: the slug falls back to `photo` or strips diacritics (Task 1 tests).
3. **Saving while an upload is still running or has failed** must be impossible. `buildSavePayload` throws, and the Save button is disabled (Task 7 tests).
4. **A photo that is referenced twice, or a removal that is undone,** must never be deleted. The server checks references, and undo clears the pending delete (Task 3 and Task 7 tests).
5. **An expired login partway through editing** (8-hour session): upload or save gets a 401, and the UI shows the server's error text without losing the edits (Task 3 tests the 401; Task 7 keeps state on failure).

---

## File map

| File | Responsibility |
| --- | --- |
| `lib/uploads.ts` (new) | Pure upload rules: folders, size cap, JPEG check, path generation and validation, public/repo path mapping, git blob SHA |
| `lib/github.ts` (rewrite) | Git Data API client: blobs, file-at-ref, tree commit with fast-forward retry (injectable `fetchImpl`) |
| `lib/admin-api.ts` (new) | `handleUpload` and `handleSave`: validation, conflict check, delete safety. Returns `{ status, body }` |
| `app/api/upload/route.ts` (new), `app/api/github/route.ts` (modify), `lib/repo-env.ts` (new) | Thin route wrappers: session, env, `request.json()`, call the handlers |
| `lib/image.ts` (new) | Pure size and crop math, plus browser `renderJpeg` |
| `lib/editor-save.ts` (new) | Pure `buildSavePayload` and the photo-state types used by the editor |
| `app/admin/CropDialog.tsx` + `.module.css` (new) | Circular crop modal (react-easy-crop) |
| `app/admin/PhotoField.tsx` + `.module.css` (new) | Thumbnail, Change/Remove/Undo, upload status |
| `app/admin/ListEditor.tsx` (modify) | Photo fields, upload and delete state, new save payload, `beforeunload` |
| `app/admin/page.tsx`, `lib/content.ts` (modify) | Raw file read and base SHAs passed to editors; headshot fields |

---

### Task 1: Upload rules (`lib/uploads.ts`)

**Files:**
- Create: `lib/uploads.ts`
- Test: `lib/uploads.test.ts`

**Interfaces:**
- Produces:
  - `UPLOAD_FOLDERS: readonly ["board","reps","events"]`, `type UploadFolder`
  - `MAX_UPLOAD_BYTES: number`
  - `isUploadFolder(x: unknown): x is UploadFolder`
  - `isJpeg(bytes: Uint8Array): boolean`
  - `slugify(nameHint: string): string`
  - `uploadPath(folder: UploadFolder, nameHint: string, now: Date, rand: string): string`, which returns the repo path `public/images/uploads/<folder>/<slug>-<yyyymmdd>-<rand>.jpg`
  - `isUploadPath(path: string): boolean`
  - `toPublicUrl(repoPath: string): string` (`public/images/x.jpg` → `/images/x.jpg`)
  - `toRepoPath(publicUrl: string): string` (the inverse)
  - `gitBlobSha(content: Uint8Array | string): string`, a 40-character hex SHA

- [ ] **Step 1: Write the failing tests**

```ts
// lib/uploads.test.ts
import { describe, it, expect } from "vitest";
import {
  UPLOAD_FOLDERS, MAX_UPLOAD_BYTES, isUploadFolder, isJpeg, slugify,
  uploadPath, isUploadPath, toPublicUrl, toRepoPath, gitBlobSha,
} from "./uploads";

describe("upload folders and limits", () => {
  it("allows only board, reps, events", () => {
    expect(UPLOAD_FOLDERS).toEqual(["board", "reps", "events"]);
    expect(isUploadFolder("board")).toBe(true);
    expect(isUploadFolder("../content")).toBe(false);
    expect(isUploadFolder(undefined)).toBe(false);
  });
  it("caps uploads at 3 MB", () => {
    expect(MAX_UPLOAD_BYTES).toBe(3 * 1024 * 1024);
  });
});

describe("isJpeg", () => {
  it("accepts JPEG magic bytes", () => {
    expect(isJpeg(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0]))).toBe(true);
  });
  it("rejects PNG, empty, and short input", () => {
    expect(isJpeg(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false);
    expect(isJpeg(new Uint8Array([]))).toBe(false);
    expect(isJpeg(new Uint8Array([0xff, 0xd8]))).toBe(false);
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Collin  Zeigler")).toBe("collin-zeigler");
  });
  it("strips diacritics", () => {
    expect(slugify("Ōno Ryū")).toBe("ono-ryu");
  });
  it("falls back to photo when nothing usable remains", () => {
    expect(slugify("渡辺")).toBe("photo");
    expect(slugify("")).toBe("photo");
    expect(slugify("../../etc")).toBe("etc");
  });
  it("limits length to 40 chars", () => {
    expect(slugify("a".repeat(80)).length).toBe(40);
  });
});

describe("uploadPath / isUploadPath", () => {
  const now = new Date("2026-10-08T12:00:00Z");
  it("builds a server-chosen path", () => {
    expect(uploadPath("board", "Collin Zeigler", now, "a1b2"))
      .toBe("public/images/uploads/board/collin-zeigler-20261008-a1b2.jpg");
  });
  it("validates exact upload paths only", () => {
    expect(isUploadPath("public/images/uploads/reps/x-20261008-a1b2.jpg")).toBe(true);
    expect(isUploadPath("public/images/uploads/events/photo-20261008-ffff.jpg")).toBe(true);
    expect(isUploadPath("public/images/board-placeholder.png")).toBe(false);
    expect(isUploadPath("public/images/uploads/other/x-20261008-a1b2.jpg")).toBe(false);
    expect(isUploadPath("public/images/uploads/board/../../content/board.json")).toBe(false);
    expect(isUploadPath("content/board.json")).toBe(false);
  });
});

describe("public/repo path mapping", () => {
  it("round-trips", () => {
    const repo = "public/images/uploads/board/x-20261008-a1b2.jpg";
    expect(toPublicUrl(repo)).toBe("/images/uploads/board/x-20261008-a1b2.jpg");
    expect(toRepoPath(toPublicUrl(repo))).toBe(repo);
  });
});

describe("gitBlobSha", () => {
  it("matches git's blob hashing", () => {
    // `printf 'hello\n' | git hash-object --stdin`
    expect(gitBlobSha("hello\n")).toBe("ce013625030ba8dba906f756967f9e9ca394464a");
    // `git hash-object /dev/null`
    expect(gitBlobSha("")).toBe("e69de29bb2d1d6434b8b29ae775ad8c2e48c5391");
  });
  it("hashes bytes the same as the equivalent string", () => {
    expect(gitBlobSha(new TextEncoder().encode("hello\n"))).toBe(gitBlobSha("hello\n"));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/uploads.test.ts`
Expected: FAIL, "Failed to resolve import "./uploads"".

- [ ] **Step 3: Implement**

```ts
// lib/uploads.ts
import { createHash } from "node:crypto";

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

export function toPublicUrl(repoPath: string): string {
  return repoPath.replace(/^public/, "");
}

export function toRepoPath(publicUrl: string): string {
  return `public${publicUrl}`;
}

export function gitBlobSha(content: Uint8Array | string): string {
  const bytes = typeof content === "string" ? Buffer.from(content, "utf8") : Buffer.from(content);
  return createHash("sha1")
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest("hex");
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/uploads.test.ts`
Expected: PASS, all tests.

- [ ] **Step 5: Checkpoint.** Show the user the diff. Do not commit unless asked.

---

### Task 2: Git Data API client (`lib/github.ts`)

**Files:**
- Modify: `lib/github.ts`. Add the new functions. Keep `commitFile`, `getFileSha` and `buildPutBody` until Task 4 removes them.
- Test: `lib/github.test.ts`. Append new `describe` blocks.

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces (all take `fetchImpl: typeof fetch` first):
  - `type Repo = { owner: string; repo: string; branch: string; token: string }`
  - `createBlob(fetchImpl, r: Repo, base64: string): Promise<string>`, which resolves to the blob SHA
  - `getHeadSha(fetchImpl, r: Repo): Promise<string>`, the commit SHA of `heads/<branch>`
  - `getFileAt(fetchImpl, r: Repo, path: string, ref: string): Promise<{ sha: string; text: string } | null>`, which returns `null` on 404
  - `type TreeEntry = { path: string; content: string } | { path: string; sha: string } | { path: string; sha: null }`
  - `commitTree(fetchImpl, r: Repo, args: { parent: string; entries: TreeEntry[]; message: string }): Promise<{ sha: string; commitUrl: string }>`
  - `updateRef(fetchImpl, r: Repo, commitSha: string): Promise<"ok" | "not-fast-forward">`

- [ ] **Step 1: Write the failing tests** (append to `lib/github.test.ts`)

```ts
import { createBlob, getHeadSha, getFileAt, commitTree, updateRef } from "./github";

const R = { owner: "o", repo: "r", branch: "main", token: "t" };
const json = (status: number, body: unknown) =>
  ({ status, ok: status >= 200 && status < 300, json: async () => body });

describe("createBlob", () => {
  it("posts base64 content and returns the sha", async () => {
    const f = vi.fn().mockResolvedValue(json(201, { sha: "BLOB1" }));
    expect(await createBlob(f, R, "AAEC")).toBe("BLOB1");
    expect(f).toHaveBeenCalledWith(
      "https://api.github.com/repos/o/r/git/blobs",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ content: "AAEC", encoding: "base64" }) }),
    );
  });
  it("throws on failure", async () => {
    const f = vi.fn().mockResolvedValue(json(500, {}));
    await expect(createBlob(f, R, "AAEC")).rejects.toThrow("createBlob failed: 500");
  });
});

describe("getHeadSha", () => {
  it("reads the branch ref", async () => {
    const f = vi.fn().mockResolvedValue(json(200, { object: { sha: "HEAD1" } }));
    expect(await getHeadSha(f, R)).toBe("HEAD1");
    expect(f.mock.calls[0][0]).toBe("https://api.github.com/repos/o/r/git/ref/heads/main");
  });
});

describe("getFileAt", () => {
  it("returns sha and decoded text", async () => {
    const f = vi.fn().mockResolvedValue(json(200, { sha: "S", content: Buffer.from("[1]\n").toString("base64") }));
    expect(await getFileAt(f, R, "content/board.json", "HEAD1")).toEqual({ sha: "S", text: "[1]\n" });
    expect(f.mock.calls[0][0]).toBe("https://api.github.com/repos/o/r/contents/content/board.json?ref=HEAD1");
  });
  it("returns null on 404", async () => {
    const f = vi.fn().mockResolvedValue(json(404, {}));
    expect(await getFileAt(f, R, "x", "HEAD1")).toBeNull();
  });
  it("throws on other errors", async () => {
    const f = vi.fn().mockResolvedValue(json(403, {}));
    await expect(getFileAt(f, R, "x", "HEAD1")).rejects.toThrow("getFileAt failed: 403");
  });
});

describe("commitTree", () => {
  it("builds a tree on the parent's tree and creates a commit", async () => {
    const f = vi.fn()
      .mockResolvedValueOnce(json(200, { tree: { sha: "BASETREE" } }))   // GET parent commit
      .mockResolvedValueOnce(json(201, { sha: "NEWTREE" }))              // POST tree
      .mockResolvedValueOnce(json(201, { sha: "C2", html_url: "u" }));   // POST commit
    const out = await commitTree(f, R, {
      parent: "C1",
      message: "m",
      entries: [
        { path: "content/board.json", content: "[]\n" },
        { path: "public/images/uploads/board/a-20261008-a1b2.jpg", sha: "BLOB1" },
        { path: "public/images/uploads/board/old-20261001-ffff.jpg", sha: null },
      ],
    });
    expect(out).toEqual({ sha: "C2", commitUrl: "u" });
    const treeBody = JSON.parse(f.mock.calls[1][1].body);
    expect(treeBody).toEqual({
      base_tree: "BASETREE",
      tree: [
        { path: "content/board.json", mode: "100644", type: "blob", content: "[]\n" },
        { path: "public/images/uploads/board/a-20261008-a1b2.jpg", mode: "100644", type: "blob", sha: "BLOB1" },
        { path: "public/images/uploads/board/old-20261001-ffff.jpg", mode: "100644", type: "blob", sha: null },
      ],
    });
    expect(JSON.parse(f.mock.calls[2][1].body)).toEqual({ message: "m", tree: "NEWTREE", parents: ["C1"] });
  });
});

describe("updateRef", () => {
  it("fast-forwards without force", async () => {
    const f = vi.fn().mockResolvedValue(json(200, {}));
    expect(await updateRef(f, R, "C2")).toBe("ok");
    expect(f.mock.calls[0][0]).toBe("https://api.github.com/repos/o/r/git/refs/heads/main");
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ sha: "C2", force: false });
  });
  it("reports a non-fast-forward on 422", async () => {
    const f = vi.fn().mockResolvedValue(json(422, { message: "Update is not a fast forward" }));
    expect(await updateRef(f, R, "C2")).toBe("not-fast-forward");
  });
  it("throws on other errors", async () => {
    const f = vi.fn().mockResolvedValue(json(500, {}));
    await expect(updateRef(f, R, "C2")).rejects.toThrow("updateRef failed: 500");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/github.test.ts`
Expected: FAIL with import errors for `createBlob` and the other new functions.

- [ ] **Step 3: Implement** (append to `lib/github.ts`, reusing the existing `API` and `headers`)

```ts
export type Repo = { owner: string; repo: string; branch: string; token: string };
export type TreeEntry =
  | { path: string; content: string }
  | { path: string; sha: string }
  | { path: string; sha: null };

const base = (r: Repo) => `${API}/repos/${r.owner}/${r.repo}`;
const jsonHeaders = (token: string) => ({ ...headers(token), "content-type": "application/json" });

export async function createBlob(fetchImpl: typeof fetch, r: Repo, base64: string): Promise<string> {
  const res = await fetchImpl(`${base(r)}/git/blobs`, {
    method: "POST", headers: jsonHeaders(r.token),
    body: JSON.stringify({ content: base64, encoding: "base64" }),
  });
  if (!res.ok) throw new Error(`createBlob failed: ${res.status}`);
  return (await res.json()).sha as string;
}

export async function getHeadSha(fetchImpl: typeof fetch, r: Repo): Promise<string> {
  const res = await fetchImpl(`${base(r)}/git/ref/heads/${r.branch}`, { headers: headers(r.token) });
  if (!res.ok) throw new Error(`getHeadSha failed: ${res.status}`);
  return (await res.json()).object.sha as string;
}

export async function getFileAt(
  fetchImpl: typeof fetch, r: Repo, path: string, ref: string,
): Promise<{ sha: string; text: string } | null> {
  const res = await fetchImpl(`${base(r)}/contents/${path}?ref=${ref}`, { headers: headers(r.token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getFileAt failed: ${res.status}`);
  const data = await res.json();
  return { sha: data.sha as string, text: Buffer.from(data.content ?? "", "base64").toString("utf8") };
}

export async function commitTree(
  fetchImpl: typeof fetch, r: Repo,
  args: { parent: string; entries: TreeEntry[]; message: string },
): Promise<{ sha: string; commitUrl: string }> {
  const parentRes = await fetchImpl(`${base(r)}/git/commits/${args.parent}`, { headers: headers(r.token) });
  if (!parentRes.ok) throw new Error(`commitTree parent failed: ${parentRes.status}`);
  const baseTree = (await parentRes.json()).tree.sha as string;

  const tree = args.entries.map((e) =>
    "content" in e
      ? { path: e.path, mode: "100644", type: "blob", content: e.content }
      : { path: e.path, mode: "100644", type: "blob", sha: e.sha },
  );
  const treeRes = await fetchImpl(`${base(r)}/git/trees`, {
    method: "POST", headers: jsonHeaders(r.token),
    body: JSON.stringify({ base_tree: baseTree, tree }),
  });
  if (!treeRes.ok) throw new Error(`commitTree tree failed: ${treeRes.status}`);
  const treeSha = (await treeRes.json()).sha as string;

  const commitRes = await fetchImpl(`${base(r)}/git/commits`, {
    method: "POST", headers: jsonHeaders(r.token),
    body: JSON.stringify({ message: args.message, tree: treeSha, parents: [args.parent] }),
  });
  if (!commitRes.ok) throw new Error(`commitTree commit failed: ${commitRes.status}`);
  const c = await commitRes.json();
  return { sha: c.sha as string, commitUrl: c.html_url as string };
}

export async function updateRef(
  fetchImpl: typeof fetch, r: Repo, commitSha: string,
): Promise<"ok" | "not-fast-forward"> {
  const res = await fetchImpl(`${base(r)}/git/refs/heads/${r.branch}`, {
    method: "PATCH", headers: jsonHeaders(r.token),
    body: JSON.stringify({ sha: commitSha, force: false }),
  });
  if (res.status === 422) return "not-fast-forward";
  if (!res.ok) throw new Error(`updateRef failed: ${res.status}`);
  return "ok";
}
```

While editing, fix the existing lint error on line 15 of `lib/github.test.ts`: replace `(body as any).sha` with `(body as { sha?: string }).sha`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/github.test.ts && npx eslint lib/github.ts lib/github.test.ts`
Expected: PASS, with no lint errors.

- [ ] **Step 5: Checkpoint.** Show the diff. Do not commit unless asked.

---

### Task 3: Upload and save handlers (`lib/admin-api.ts`)

**Files:**
- Create: `lib/admin-api.ts`
- Test: `lib/admin-api.test.ts`

**Interfaces:**
- Consumes:
  - From Task 1: `isUploadFolder`, `isJpeg`, `MAX_UPLOAD_BYTES`, `uploadPath`, `isUploadPath`, `toPublicUrl`, `gitBlobSha`.
  - From Task 2: `Repo`, `TreeEntry`, `createBlob`, `getHeadSha`, `getFileAt`, `commitTree`, `updateRef`.
  - `EDITABLE_PATHS` from `lib/content.ts`.
- Produces:
  - `type Deps = { fetchImpl: typeof fetch; repo: Repo; authed: boolean; now?: () => Date; rand?: () => string }`
  - `type Result = { status: number; body: Record<string, unknown> }`
  - `handleUpload(deps: Deps, body: unknown): Promise<Result>`
    - 200: `{ path: string, sha: string }`, where `path` is the repo path.
  - `type SaveBody = { files: { path: string; content: string }[]; uploads: { path: string; sha: string }[]; deletes: string[]; base: Record<string, string>; message: string }`
  - `handleSave(deps: Deps, body: unknown): Promise<Result>`
    - 200: `{ commitUrl: string, blobShas: Record<string, string> }`
    - 409: `{ error: CONFLICT_MESSAGE }`
  - `CONFLICT_MESSAGE`, the exact conflict copy from Global Constraints.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/admin-api.test.ts
import { describe, it, expect, vi } from "vitest";
import { handleUpload, handleSave, CONFLICT_MESSAGE } from "./admin-api";
import { gitBlobSha } from "./uploads";

const repo = { owner: "o", repo: "r", branch: "main", token: "SECRET_TOKEN" };
const ok = (body: unknown, status = 200) => ({ status, ok: status < 300, json: async () => body });
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).toString("base64");
const deps = (fetchImpl: typeof fetch, authed = true) => ({
  fetchImpl, repo, authed, now: () => new Date("2026-10-08T00:00:00Z"), rand: () => "a1b2",
});

describe("handleUpload", () => {
  it("401 without a session, before touching GitHub", async () => {
    const f = vi.fn();
    expect((await handleUpload(deps(f, false), {})).status).toBe(401);
    expect(f).not.toHaveBeenCalled();
  });
  it("400 for a bad folder", async () => {
    const r = await handleUpload(deps(vi.fn()), { folder: "../x", nameHint: "a", dataBase64: JPEG });
    expect(r.status).toBe(400);
  });
  it("400 for non-JPEG data", async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64");
    const r = await handleUpload(deps(vi.fn()), { folder: "board", nameHint: "a", dataBase64: png });
    expect(r.status).toBe(400);
  });
  it("400 for oversized data", async () => {
    const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(3 * 1024 * 1024)]).toString("base64");
    const r = await handleUpload(deps(vi.fn()), { folder: "board", nameHint: "a", dataBase64: big });
    expect(r.status).toBe(400);
  });
  it("creates a blob at a server-chosen path", async () => {
    const f = vi.fn().mockResolvedValue(ok({ sha: "BLOB1" }, 201));
    const r = await handleUpload(deps(f), { folder: "reps", nameHint: "Oscar Garcia", dataBase64: JPEG });
    expect(r).toEqual({
      status: 200,
      body: { path: "public/images/uploads/reps/oscar-garcia-20261008-a1b2.jpg", sha: "BLOB1" },
    });
  });
  it("never leaks the token in errors", async () => {
    const f = vi.fn().mockRejectedValue(new Error("boom SECRET_TOKEN"));
    const r = await handleUpload(deps(f), { folder: "board", nameHint: "a", dataBase64: JPEG });
    expect(r.status).toBe(500);
    expect(JSON.stringify(r.body)).not.toContain("SECRET_TOKEN");
  });
});

// A fake GitHub for save: head HEAD1, files keyed by path.
function fakeGitHub(files: Record<string, string>, opts: { failFastForward?: number } = {}) {
  let ffFailures = opts.failFastForward ?? 0;
  const calls: { url: string; init?: RequestInit }[] = [];
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    if (url.endsWith("/git/ref/heads/main")) return ok({ object: { sha: "HEAD1" } });
    const m = url.match(/\/contents\/(.+)\?ref=/);
    if (m) {
      const text = files[m[1]];
      return text === undefined ? ok({}, 404) : ok({ sha: gitBlobSha(text), content: Buffer.from(text).toString("base64") });
    }
    if (url.includes("/git/commits/HEAD1")) return ok({ tree: { sha: "T0" } });
    if (url.endsWith("/git/trees")) return ok({ sha: "T1" }, 201);
    if (url.endsWith("/git/commits")) return ok({ sha: "C2", html_url: "https://gh/c2" }, 201);
    if (url.endsWith("/git/refs/heads/main")) {
      if (ffFailures > 0) { ffFailures--; return ok({}, 422); }
      return ok({});
    }
    throw new Error(`unexpected ${url}`);
  });
  return { f: f as unknown as typeof fetch, calls };
}
const treeOf = (calls: { url: string; init?: RequestInit }[]) =>
  JSON.parse(calls.find((c) => c.url.endsWith("/git/trees"))!.init!.body as string).tree;

const OLD = "public/images/uploads/board/old-20261001-ffff.jpg";
const NEW = "public/images/uploads/board/new-20261008-a1b2.jpg";
const board = (photo: string) => JSON.stringify([{ id: "m1", photo }], null, 2) + "\n";
const reps = (photo: string) => JSON.stringify([{ id: "r1", photo }], null, 2) + "\n";

describe("handleSave", () => {
  it("401 without a session", async () => {
    expect((await handleSave(deps(vi.fn(), false), {})).status).toBe(401);
  });
  it("403 for a non-editable content path", async () => {
    const { f } = fakeGitHub({});
    const r = await handleSave(deps(f), {
      files: [{ path: "README.md", content: "x" }], uploads: [], deletes: [], base: {}, message: "m",
    });
    expect(r.status).toBe(403);
  });
  it("403 for an upload or delete outside uploads/", async () => {
    const { f } = fakeGitHub({});
    const bad1 = await handleSave(deps(f), {
      files: [], uploads: [{ path: "public/images/board-placeholder.png", sha: "x" }], deletes: [], base: {}, message: "m",
    });
    const bad2 = await handleSave(deps(f), {
      files: [], uploads: [], deletes: ["content/board.json"], base: {}, message: "m",
    });
    expect(bad1.status).toBe(403);
    expect(bad2.status).toBe(403);
  });
  it("409 when the file changed since it was loaded", async () => {
    const { f } = fakeGitHub({ "content/board.json": board(OLD) });
    const r = await handleSave(deps(f), {
      files: [{ path: "content/board.json", content: board(NEW) }], uploads: [], deletes: [],
      base: { "content/board.json": "stale-sha" }, message: "m",
    });
    expect(r).toEqual({ status: 409, body: { error: CONFLICT_MESSAGE } });
  });
  it("commits content, uploads, and an unreferenced delete in one tree", async () => {
    const current = board(OLD);
    const { f, calls } = fakeGitHub({
      "content/board.json": current, "content/subchapter-reps.json": reps("/images/x.jpg"), [OLD]: "jpegbytes",
    });
    const next = board("/images/uploads/board/new-20261008-a1b2.jpg");
    const r = await handleSave(deps(f), {
      files: [{ path: "content/board.json", content: next }],
      uploads: [{ path: NEW, sha: "BLOB1" }], deletes: [OLD],
      base: { "content/board.json": gitBlobSha(current) }, message: "m",
    });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ commitUrl: "https://gh/c2", blobShas: { "content/board.json": gitBlobSha(next) } });
    expect(treeOf(calls)).toEqual([
      { path: "content/board.json", mode: "100644", type: "blob", content: next },
      { path: NEW, mode: "100644", type: "blob", sha: "BLOB1" },
      { path: OLD, mode: "100644", type: "blob", sha: null },
    ]);
  });
  it("skips a delete that another content file still references", async () => {
    const current = board(OLD);
    const { f, calls } = fakeGitHub({
      "content/board.json": current,
      "content/subchapter-reps.json": reps("/images/uploads/board/old-20261001-ffff.jpg"),
      [OLD]: "jpegbytes",
    });
    const r = await handleSave(deps(f), {
      files: [{ path: "content/board.json", content: board("/images/board-placeholder.png") }],
      uploads: [], deletes: [OLD], base: { "content/board.json": gitBlobSha(current) }, message: "m",
    });
    expect(r.status).toBe(200);
    expect(treeOf(calls).some((e: { path: string }) => e.path === OLD)).toBe(false);
  });
  it("skips a delete that the incoming content still references", async () => {
    const current = board(OLD);
    const { f, calls } = fakeGitHub({ "content/board.json": current, "content/subchapter-reps.json": "[]\n", [OLD]: "x" });
    await handleSave(deps(f), {
      files: [{ path: "content/board.json", content: current }],
      uploads: [], deletes: [OLD], base: { "content/board.json": gitBlobSha(current) }, message: "m",
    });
    expect(treeOf(calls).some((e: { path: string }) => e.path === OLD)).toBe(false);
  });
  it("skips a delete for a file that no longer exists", async () => {
    const current = board("/images/board-placeholder.png");
    const { f, calls } = fakeGitHub({ "content/board.json": current, "content/subchapter-reps.json": "[]\n" });
    await handleSave(deps(f), {
      files: [{ path: "content/board.json", content: current }],
      uploads: [], deletes: [OLD], base: { "content/board.json": gitBlobSha(current) }, message: "m",
    });
    expect(treeOf(calls).some((e: { path: string }) => e.path === OLD)).toBe(false);
  });
  it("retries once on a non-fast-forward, then reports a conflict", async () => {
    const current = board(OLD);
    const files = { "content/board.json": current, "content/subchapter-reps.json": "[]\n" };
    const once = fakeGitHub(files, { failFastForward: 1 });
    const body = {
      files: [{ path: "content/board.json", content: board(NEW) }], uploads: [], deletes: [],
      base: { "content/board.json": gitBlobSha(current) }, message: "m",
    };
    expect((await handleSave(deps(once.f), body)).status).toBe(200);
    const twice = fakeGitHub(files, { failFastForward: 2 });
    expect((await handleSave(deps(twice.f), body)).status).toBe(409);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/admin-api.test.ts`
Expected: FAIL, unresolved import `./admin-api`.

- [ ] **Step 3: Implement**

```ts
// lib/admin-api.ts
import {
  isUploadFolder, isJpeg, MAX_UPLOAD_BYTES, uploadPath, isUploadPath, toPublicUrl, gitBlobSha,
} from "./uploads";
import {
  type Repo, type TreeEntry, createBlob, getHeadSha, getFileAt, commitTree, updateRef,
} from "./github";
import { EDITABLE_PATHS } from "./content";

export type Deps = {
  fetchImpl: typeof fetch; repo: Repo; authed: boolean;
  now?: () => Date; rand?: () => string;
};
export type Result = { status: number; body: Record<string, unknown> };

export const CONFLICT_MESSAGE =
  "Someone else saved changes, or the site is still updating from your last save. Wait a minute, reload, and try again.";

const fail = (status: number, error: string): Result => ({ status, body: { error } });
const randHex = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, "0");

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

type SaveBody = {
  files: { path: string; content: string }[];
  uploads: { path: string; sha: string }[];
  deletes: string[];
  base: Record<string, string>;
  message: string;
};

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
    for (let attempt = 0; attempt < 2; attempt++) {
      const head = await getHeadSha(fetchImpl, repo);

      // Conflict check: each file must be unchanged since the editor loaded it.
      for (const file of b.files) {
        const current = await getFileAt(fetchImpl, repo, file.path, head);
        if ((current?.sha ?? null) !== (b.base[file.path] ?? null)) {
          return { status: 409, body: { error: CONFLICT_MESSAGE } };
        }
      }

      // Every content file's text after this save, for the reference check.
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
```

Note on the conflict check: `getFileAt` reads at `head`, so files that a concurrent commit changed fail the base check on retry. Content-file reads are only a few KB each (`board.json` is about 2 KB), so the extra reads are cheap.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/admin-api.test.ts`
Expected: PASS.

- [ ] **Step 5: Checkpoint.** Show the diff. Do not commit unless asked.

---

### Task 4: Wire the routes and remove the old single-file commit

**Files:**
- Create: `app/api/upload/route.ts`, `lib/repo-env.ts`
- Modify: `app/api/github/route.ts` (full rewrite below)
- Modify: `lib/github.ts`. Delete `buildPutBody`, `getFileSha`, `commitFile`, and the `Base` type.
- Modify: `lib/github.test.ts`. Delete the `buildPutBody`, `getFileSha`, and `commitFile` describe blocks and their imports.

**Interfaces:**
- Consumes: `handleUpload`, `handleSave`, `Repo` (Tasks 2–3) and `requireSession` (existing).
- Produces:
  - `POST /api/upload` with `{ folder, nameHint, dataBase64 }`, returning `{ path, sha }`.
  - `POST /api/github` with a `SaveBody`, returning `{ commitUrl, blobShas }`.

- [ ] **Step 1: Read the Next route handler doc** (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`, especially "Request Body"). Confirm that `request.json()` and `NextResponse.json(body, { status })` are the documented patterns in this version.

- [ ] **Step 2: Implement the routes**

```ts
// lib/repo-env.ts
import type { Repo } from "./github";

export function repoFromEnv(): Repo {
  return {
    owner: process.env.GITHUB_OWNER!, repo: process.env.GITHUB_REPO!,
    branch: process.env.GITHUB_BRANCH ?? "main", token: process.env.GITHUB_TOKEN!,
  };
}
```

```ts
// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-cookie";
import { handleUpload } from "@/lib/admin-api";
import { repoFromEnv } from "@/lib/repo-env";

export async function POST(req: Request) {
  const authed = await requireSession();
  const body = authed ? await req.json().catch(() => null) : null;
  const r = await handleUpload({ fetchImpl: fetch, repo: repoFromEnv(), authed }, body);
  return NextResponse.json(r.body, { status: r.status });
}
```

```ts
// app/api/github/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-cookie";
import { handleSave } from "@/lib/admin-api";
import { repoFromEnv } from "@/lib/repo-env";

export async function POST(req: Request) {
  const authed = await requireSession();
  const body = authed ? await req.json().catch(() => null) : null;
  const r = await handleSave({ fetchImpl: fetch, repo: repoFromEnv(), authed }, body);
  return NextResponse.json(r.body, { status: r.status });
}
```

(The env-to-`Repo` helper lives in `lib/` so it can't be mistaken for a route file.)

- [ ] **Step 3: Delete the old single-file code** from `lib/github.ts` and `lib/github.test.ts` as listed under Files.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm test && npx eslint app/api lib`
Expected:
- tsc is clean.
- All tests pass, including the 16 pre-existing ones minus the 5 deleted old-commit tests, plus the new ones.
- No lint errors.

Then check unauthenticated access against the dev server:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:3000/api/upload -H 'content-type: application/json' -d '{}'
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:3000/api/github -H 'content-type: application/json' -d '{}'
```

Expected: `401` and `401`.

- [ ] **Step 5: Checkpoint.** Show the diff. Do not commit unless asked.

---

### Task 5: Image math and JPEG rendering (`lib/image.ts`)

**Files:**
- Create: `lib/image.ts`
- Test: `lib/image.test.ts` (pure helpers only; `renderJpeg` needs a real browser and is checked in Task 8)

**Interfaces:**
- Produces:
  - `type ImageKind = "headshot" | "photo"`
  - `type PixelArea = { x: number; y: number; width: number; height: number }`
  - `targetSize(kind: ImageKind, w: number, h: number): { width: number; height: number }`
    - For a headshot, `w` and `h` are the crop size and the result is `min(600, crop)` square.
    - For a photo, the longest side is capped at 1600 and smaller images are never upscaled.
  - `clampCrop(area: PixelArea, naturalW: number, naturalH: number): PixelArea`, which returns an integer, in-bounds area at least 1×1
  - `class UnsupportedImageError extends Error`
  - `renderJpeg(file: File, opts: { kind: ImageKind; crop?: PixelArea }): Promise<Blob>`
  - `blobToBase64(blob: Blob): Promise<string>`
  - `JPEG_QUALITY = 0.82`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/image.test.ts
import { describe, it, expect } from "vitest";
import { targetSize, clampCrop } from "./image";

describe("targetSize", () => {
  it("headshots are 600 square, never upscaled", () => {
    expect(targetSize("headshot", 2000, 2000)).toEqual({ width: 600, height: 600 });
    expect(targetSize("headshot", 400, 400)).toEqual({ width: 400, height: 400 });
  });
  it("photos cap the longest side at 1600, keeping aspect", () => {
    expect(targetSize("photo", 4032, 3024)).toEqual({ width: 1600, height: 1200 });
    expect(targetSize("photo", 3024, 4032)).toEqual({ width: 1200, height: 1600 });
  });
  it("photos smaller than the cap are unchanged", () => {
    expect(targetSize("photo", 800, 600)).toEqual({ width: 800, height: 600 });
  });
});

describe("clampCrop", () => {
  it("rounds fractional pixels", () => {
    expect(clampCrop({ x: 10.4, y: 20.6, width: 300.5, height: 300.5 }, 1000, 1000))
      .toEqual({ x: 10, y: 21, width: 301, height: 301 });
  });
  it("keeps the area inside the image", () => {
    expect(clampCrop({ x: -5, y: 900, width: 300, height: 300 }, 1000, 1000))
      .toEqual({ x: 0, y: 700, width: 300, height: 300 });
  });
  it("never returns an empty area", () => {
    expect(clampCrop({ x: 0, y: 0, width: 0, height: 0 }, 10, 10))
      .toEqual({ x: 0, y: 0, width: 1, height: 1 });
  });
  it("shrinks an oversized crop to the image", () => {
    expect(clampCrop({ x: 0, y: 0, width: 5000, height: 5000 }, 1000, 800))
      .toEqual({ x: 0, y: 0, width: 1000, height: 800 });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/image.test.ts`
Expected: FAIL, unresolved import `./image`.

- [ ] **Step 3: Implement**

```ts
// lib/image.ts
export type ImageKind = "headshot" | "photo";
export type PixelArea = { x: number; y: number; width: number; height: number };

export const JPEG_QUALITY = 0.82;
const HEADSHOT = 600;
const PHOTO_MAX = 1600;

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

async function decode(file: File): Promise<ImageBitmap> {
  try {
    // from-image applies EXIF rotation, so portrait phone photos stay upright.
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new UnsupportedImageError("That file isn't a photo we can use. Try a JPG or PNG.");
  }
}

export async function renderJpeg(file: File, opts: { kind: ImageKind; crop?: PixelArea }): Promise<Blob> {
  const bmp = await decode(file);
  const src = opts.crop
    ? clampCrop(opts.crop, bmp.width, bmp.height)
    : { x: 0, y: 0, width: bmp.width, height: bmp.height };
  const out = targetSize(opts.kind, src.width, src.height);
  const canvas = document.createElement("canvas");
  canvas.width = out.width;
  canvas.height = out.height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // JPEG has no transparency; flatten onto white
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, src.x, src.y, src.width, src.height, 0, 0, out.width, out.height);
  bmp.close();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", JPEG_QUALITY));
  if (!blob) throw new UnsupportedImageError("That file isn't a photo we can use. Try a JPG or PNG.");
  return blob;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(bin);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/image.test.ts && npx tsc --noEmit`
Expected: PASS and clean.

- [ ] **Step 5: Checkpoint.** Show the diff. Do not commit unless asked.

---

### Task 6: Crop dialog and photo field components

**Files:**
- Modify: `package.json` and `package-lock.json` (via `npm install react-easy-crop@6.2.3 --save-exact`)
- Create: `app/admin/CropDialog.tsx`, `app/admin/CropDialog.module.css`
- Create: `app/admin/PhotoField.tsx`, `app/admin/PhotoField.module.css`

**Interfaces:**
- Consumes: from Task 5, `ImageKind`, `PixelArea`, `renderJpeg`, `UnsupportedImageError`.
- Produces:
  - `CropDialog({ file, onCancel, onConfirm }: { file: File; onCancel: () => void; onConfirm: (area: PixelArea) => void })`
  - `type PhotoStatus = "saved" | "uploading" | "uploaded" | "failed"`
  - `type PhotoView = { src: string; status: PhotoStatus; pendingDelete: boolean; error?: string }`
  - `PhotoField({ kind, view, onPick, onRemove, onUndoRemove, onRetry }: { kind: ImageKind; view: PhotoView; onPick: (jpeg: Blob, previewUrl: string) => void; onRemove: () => void; onUndoRemove: () => void; onRetry: () => void })`
  - `PhotoField` owns choosing, cropping, and rendering. It calls `onPick` with the finished JPEG plus an object URL. The parent owns uploading and state.

- [ ] **Step 1: Install the pinned dependency**

Run: `npm install react-easy-crop@6.2.3 --save-exact`
Expected: `package.json` lists `"react-easy-crop": "6.2.3"`, and `npm ls react-easy-crop` shows `6.2.3`.

- [ ] **Step 2: Implement `CropDialog`**

```tsx
// app/admin/CropDialog.tsx
"use client";
import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import type { PixelArea } from "@/lib/image";
import styles from "./CropDialog.module.css";

export default function CropDialog({
  file, onCancel, onConfirm,
}: { file: File; onCancel: () => void; onConfirm: (area: PixelArea) => void }) {
  const [url] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Crop photo">
      <div className={styles.dialog}>
        <div className={styles.cropArea}>
          <Cropper
            image={url} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false}
            onCropChange={setCrop} onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
          />
        </div>
        <label className={styles.zoom}>
          <span>Zoom</span>
          <input
            type="range" min={1} max={3} step={0.01} value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>
        <div className={styles.actions}>
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="button" className={styles.primary} disabled={!area} onClick={() => area && onConfirm(area)}>
            Use photo
          </button>
        </div>
      </div>
    </div>
  );
}
```

```css
/* app/admin/CropDialog.module.css */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(35, 31, 26, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.dialog {
  background: #fff;
  border-radius: 16px;
  width: min(440px, 100%);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.cropArea {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background: #222;
  border-radius: 10px;
  overflow: hidden;
}
.zoom {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink-muted);
}
.zoom input {
  flex: 1;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.actions button {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid #d6cdb9;
  background: #fff;
  font: inherit;
  cursor: pointer;
}
.actions .primary {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
}
.actions button:disabled {
  opacity: 0.45;
  cursor: default;
}
```

- [ ] **Step 3: Implement `PhotoField`**

```tsx
// app/admin/PhotoField.tsx
"use client";
import { useRef, useState } from "react";
import { renderJpeg, UnsupportedImageError, type ImageKind, type PixelArea } from "@/lib/image";
import CropDialog from "./CropDialog";
import styles from "./PhotoField.module.css";

export type PhotoStatus = "saved" | "uploading" | "uploaded" | "failed";
export type PhotoView = { src: string; status: PhotoStatus; pendingDelete: boolean; error?: string };

export default function PhotoField({
  kind, view, onPick, onRemove, onUndoRemove, onRetry,
}: {
  kind: ImageKind; view: PhotoView;
  onPick: (jpeg: Blob, previewUrl: string) => void;
  onRemove: () => void; onUndoRemove: () => void; onRetry: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [cropping, setCropping] = useState<File | null>(null);
  const [error, setError] = useState("");

  async function finish(file: File, crop?: PixelArea) {
    setCropping(null);
    try {
      const jpeg = await renderJpeg(file, { kind, crop });
      setError("");
      onPick(jpeg, URL.createObjectURL(jpeg));
    } catch (e) {
      setError(e instanceof UnsupportedImageError ? e.message : "That file isn't a photo we can use. Try a JPG or PNG.");
    }
  }

  function chosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (kind === "headshot") setCropping(file);
    else void finish(file);
  }

  const message =
    error ||
    (view.status === "failed" ? view.error || "Upload failed — try again" : "") ||
    (view.pendingDelete ? "Will be removed when you save" : "");

  return (
    <div className={styles.field}>
      <img
        src={view.src}
        alt=""
        className={`${kind === "headshot" ? styles.thumbRound : styles.thumb} ${view.pendingDelete ? styles.faded : ""}`}
      />
      <div className={styles.side}>
        <div className={styles.buttons}>
          <button type="button" onClick={() => input.current?.click()} disabled={view.status === "uploading"}>
            {view.status === "uploading" ? "Uploading…" : "Change photo"}
          </button>
          {view.pendingDelete
            ? <button type="button" onClick={onUndoRemove}>Undo</button>
            : <button type="button" onClick={onRemove} className={styles.danger}>Remove</button>}
          {view.status === "failed" && <button type="button" onClick={onRetry}>Retry</button>}
        </div>
        {(view.status === "uploading" || view.status === "uploaded") && <span className={styles.badge}>Unsaved</span>}
        {message && <span className={styles.message} role="status">{message}</span>}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={chosen} />
      {cropping && (
        <CropDialog file={cropping} onCancel={() => setCropping(null)} onConfirm={(a) => void finish(cropping, a)} />
      )}
    </div>
  );
}
```

```css
/* app/admin/PhotoField.module.css */
.field {
  display: flex;
  align-items: center;
  gap: 12px;
  grid-column: 1 / -1;
}
.thumb,
.thumbRound {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 8px;
  background: #efe7d6;
  flex-shrink: 0;
}
.thumbRound {
  border-radius: 50%;
}
.faded {
  opacity: 0.35;
}
.side {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.danger {
  color: var(--red);
}
.badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: #9a6a00;
}
.message {
  font-size: 0.8rem;
  color: var(--ink-muted);
}
```

- [ ] **Step 4: Verify that it compiles**

Run: `npx tsc --noEmit && npx eslint app/admin`
Expected: clean. The `<img>` warnings are acceptable, matching the rest of the repo.

- [ ] **Step 5: Checkpoint.** Show the diff. Do not commit unless asked.

---

### Task 7: Editor integration (save payload, state, admin page)

**Files:**
- Create: `lib/editor-save.ts`
- Test: `lib/editor-save.test.ts`
- Modify: `app/admin/ListEditor.tsx`, `app/admin/page.tsx`, `lib/content.ts`

**Interfaces:**
- Consumes:
  - `isUploadPath`, `toRepoPath`, `toPublicUrl`, `gitBlobSha` (Task 1)
  - `blobToBase64` (Task 5)
  - `PhotoField`, `PhotoView` (Task 6)
- Produces:
  - `type PendingPhoto = { status: "uploading" | "uploaded" | "failed"; previewUrl: string; jpeg: Blob; upload?: { path: string; sha: string }; error?: string }`
  - `buildSavePayload(args: { path: string; message: string; items: object[]; pending: Record<string, PendingPhoto>; deletes: string[]; base: Record<string, string> }): SaveBody`
    - It throws `Error("uploads in progress")` when any pending photo is `uploading` or `failed`.
  - `readRaw(file: string): string` in `lib/content.ts`
  - `ListEditor` props gain `base: Record<string, string>` and `uploadFolder: "board" | "reps" | "events"`.
  - `Field` gains an optional `kind?: "headshot" | "photo"`.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/editor-save.test.ts
import { describe, it, expect } from "vitest";
import { buildSavePayload, type PendingPhoto } from "./editor-save";

const blob = new Blob(["x"]);
const up = (path: string, sha: string): PendingPhoto =>
  ({ status: "uploaded", previewUrl: "blob:1", jpeg: blob, upload: { path, sha } });

describe("buildSavePayload", () => {
  const base = { "content/board.json": "B0" };

  it("serializes items with renumbered order and includes uploads", () => {
    const items = [
      { id: "m2", name: "B", photo: "/images/uploads/board/b-20261008-a1b2.jpg", order: 9 },
      { id: "m1", name: "A", photo: "/images/board-placeholder.png", order: 1 },
    ];
    const p = buildSavePayload({
      path: "content/board.json", message: "msg", items, base, deletes: [],
      pending: { m2: up("public/images/uploads/board/b-20261008-a1b2.jpg", "S1") },
    });
    expect(JSON.parse(p.files[0].content).map((i: { order: number }) => i.order)).toEqual([1, 2]);
    expect(p.files[0].content.endsWith("\n")).toBe(true);
    expect(p.uploads).toEqual([{ path: "public/images/uploads/board/b-20261008-a1b2.jpg", sha: "S1" }]);
    expect(p.base).toEqual(base);
    expect(p.message).toBe("msg");
  });

  it("drops an upload that was replaced or removed before saving", () => {
    const items = [{ id: "m1", photo: "/images/board-placeholder.png", order: 1 }];
    const p = buildSavePayload({
      path: "content/board.json", message: "m", items, base, deletes: [],
      pending: { m1: up("public/images/uploads/board/a-20261008-a1b2.jpg", "S1") },
    });
    expect(p.uploads).toEqual([]);
  });

  it("passes through deletes, which the server re-checks", () => {
    const p = buildSavePayload({
      path: "content/board.json", message: "m", items: [], base, pending: {},
      deletes: ["public/images/uploads/board/old-20261001-ffff.jpg"],
    });
    expect(p.deletes).toEqual(["public/images/uploads/board/old-20261001-ffff.jpg"]);
  });

  it("refuses to build while an upload is running or failed", () => {
    for (const status of ["uploading", "failed"] as const) {
      expect(() => buildSavePayload({
        path: "content/board.json", message: "m", items: [], base, deletes: [],
        pending: { m1: { status, previewUrl: "blob:1", jpeg: blob } },
      })).toThrow("uploads in progress");
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/editor-save.test.ts`
Expected: FAIL, unresolved import.

- [ ] **Step 3: Implement `lib/editor-save.ts`**

```ts
// lib/editor-save.ts
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
  // Only uploads whose public URL actually appears in the saved content are committed.
  const uploads = pending
    .map((p) => p.upload!)
    .filter((u) => content.includes(toPublicUrl(u.path)));
  return { files: [{ path: args.path, content }], uploads, deletes: args.deletes, base: args.base, message: args.message };
}
```

Also replace the local `SaveBody` type in `lib/admin-api.ts` (Task 3) with `import type { SaveBody } from "./editor-save";`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/editor-save.test.ts lib/admin-api.test.ts`
Expected: PASS.

- [ ] **Step 5: Add `readRaw` to `lib/content.ts`**

```ts
export function readRaw(file: string): string {
  return readFileSync(join(CONTENT_DIR, file), "utf8");
}
```

Refactor `readSorted` to use `readRaw(file)` internally, so there's a single read path.

- [ ] **Step 6: Update `app/admin/ListEditor.tsx`**

Keep the existing structure (item cards, ↑/↓, Remove, Add, Save). Apply these changes:

1. Imports and props:

```tsx
import { useEffect, useState } from "react";
import PhotoField, { type PhotoView } from "./PhotoField";
import { blobToBase64 } from "@/lib/image";
import { buildSavePayload, type PendingPhoto } from "@/lib/editor-save";
import { isUploadPath, toRepoPath } from "@/lib/uploads";

export type Field = {
  key: string; label: string; options?: string[]; placeholder?: string;
  kind?: "headshot" | "photo";
};
// Props: add base and uploadFolder.
//   base: Record<string, string>; uploadFolder: "board" | "reps" | "events";
```

2. State:

```tsx
const PLACEHOLDER = "/images/board-placeholder.png";
const [pending, setPending] = useState<Record<string, PendingPhoto>>({});
const [deletes, setDeletes] = useState<string[]>([]);
const [baseShas, setBaseShas] = useState(base);
const busy = Object.values(pending).some((p) => p.status !== "uploaded");
```

3. Upload and photo handlers. `photoKey` is the field key, `"photo"`.

```tsx
async function upload(id: string, jpeg: Blob, previewUrl: string, nameHint: string) {
  setPending((p) => ({ ...p, [id]: { status: "uploading", previewUrl, jpeg } }));
  try {
    const res = await fetch("/api/upload", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ folder: uploadFolder, nameHint, dataBase64: await blobToBase64(jpeg) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed — try again");
    setPending((p) => ({ ...p, [id]: { status: "uploaded", previewUrl, jpeg, upload: data } }));
    setField(id, "photo", data.path.replace(/^public/, ""));
  } catch (e) {
    setPending((p) => ({ ...p, [id]: { status: "failed", previewUrl, jpeg, error: e instanceof Error ? e.message : "Upload failed — try again" } }));
  }
}

function markOldForDelete(current: string) {
  const repoPath = toRepoPath(current);
  if (isUploadPath(repoPath) && !Object.values(pending).some((p) => p.upload?.path === repoPath)) {
    setDeletes((d) => (d.includes(repoPath) ? d : [...d, repoPath]));
  }
}

function pickPhoto(it: T, key: string, jpeg: Blob, previewUrl: string) {
  markOldForDelete(String(it[key] ?? ""));
  void upload(it.id, jpeg, previewUrl, String(it.name ?? ""));
}

function removePhoto(it: T, key: string) {
  markOldForDelete(String(it[key] ?? ""));
  setPending((p) => { const { [it.id]: _, ...rest } = p; return rest; });
  setField(it.id, key, PLACEHOLDER);
}

function undoRemove(it: T, key: string, original: string) {
  setDeletes((d) => d.filter((x) => x !== toRepoPath(original)));
  setField(it.id, key, original);
}
```

For `undoRemove`, keep a `useState<Record<string, string>>` called `originals`, recording each item's photo value the first time it's changed in this session. Pass `originals[it.id]` when rendering Undo.

The pending-delete flag in the view is `deletes.includes(toRepoPath(originals[it.id] ?? ""))`.

When an item card is removed with **Remove** (the existing whole-item removal), also call `markOldForDelete` on its photo.

4. Rendering a photo field. In the `fields.map`, if `f.kind` is set, render this instead of the input:

```tsx
const original = originals[it.id] ?? String(it[f.key] ?? "");
const p = pending[it.id];
const view: PhotoView = {
  src: p?.previewUrl ?? String(it[f.key] || PLACEHOLDER),
  status: p?.status ?? "saved",
  pendingDelete: deletes.includes(toRepoPath(original)),
  error: p?.error,
};
return (
  <PhotoField
    key={f.key} kind={f.kind} view={view}
    onPick={(jpeg, url) => { rememberOriginal(it); pickPhoto(it, f.key, jpeg, url); }}
    onRemove={() => { rememberOriginal(it); removePhoto(it, f.key); }}
    onUndoRemove={() => undoRemove(it, f.key, original)}
    onRetry={() => p && void upload(it.id, p.jpeg, p.previewUrl, String(it.name ?? ""))}
  />
);
```

`rememberOriginal(it)` sets `originals[it.id]` to the current photo only if it isn't already set.

5. Save:

```tsx
async function save() {
  setSaving(true);
  setStatus("Saving…");
  try {
    const payload = buildSavePayload({ path, message: commitMessage, items, pending, deletes, base: baseShas });
    const res = await fetch("/api/github", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { setStatus(`Error: ${data.error}`); return; }
    setBaseShas((b) => ({ ...b, ...data.blobShas }));
    setItems(items.map((it, i) => ({ ...it, order: i + 1 })));
    setPending({}); setDeletes([]); setOriginals({}); setDirty(false);
    setStatus("Saved. New photos appear once the site finishes updating (about a minute).");
  } catch (e) {
    setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    setSaving(false);
  }
}
```

The Save button is `disabled={!dirty || saving || busy}`.

6. Unsaved-changes guard:

```tsx
useEffect(() => {
  if (!dirty) return;
  const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
  window.addEventListener("beforeunload", warn);
  return () => window.removeEventListener("beforeunload", warn);
}, [dirty]);
```

- [ ] **Step 7: Update `app/admin/page.tsx`**

```tsx
import { readRaw } from "@/lib/content";
import { gitBlobSha } from "@/lib/uploads";
// in AdminPage, when authed:
const boardBase = { [BOARD_PATH]: gitBlobSha(readRaw("board.json")) };
const repsBase = { [REPS_PATH]: gitBlobSha(readRaw("subchapter-reps.json")) };
```

- Change both `photo` fields to `{ key: "photo", label: "Photo", kind: "headshot" }`.
- Pass `base={boardBase} uploadFolder="board"` to the Officers editor.
- Pass `base={repsBase} uploadFolder="reps"` to the reps editor.

- [ ] **Step 8: Verify**

Run: `npx tsc --noEmit && npm test && npx eslint app/admin lib`
Expected: clean, all tests pass, and no lint errors.

- [ ] **Step 9: Checkpoint.** Show the diff. Do not commit unless asked.

---

### Task 8: End-to-end verification on a throwaway branch

**Files:** none changed. This task is verification only, plus temporarily setting `GITHUB_BRANCH` in `.env.local`.

- [ ] **Step 1: Ask the user before creating a remote branch.** It's an outward-facing action. With approval:

```bash
git push origin main:photo-upload-e2e
```

Set `GITHUB_BRANCH=photo-upload-e2e` in `.env.local` and restart the dev server.

- [ ] **Step 2: Run the browser flows** (headless Chrome via CDP, as used earlier this session, plus manual checks where gestures are needed). For each flow, record what was observed.
  1. **Rotation:** sign in to `/admin`, choose a portrait phone JPEG with EXIF rotation for an officer, crop, and Use photo. The preview is upright, then shows "Unsaved", and Save is enabled once the upload finishes.
  2. **Replace:** replace a second officer's photo. Remove a third and see "Will be removed when you save", then **Undo** it.
  3. **One commit:** Save, then `git fetch origin photo-upload-e2e && git show --stat FETCH_HEAD`. Expected: exactly one new commit containing `content/board.json` and the new upload JPEGs, with no delete for the undone photo.
  4. **Real delete:** replace one of the uploaded photos and Save again. Expected: one commit that adds the new JPEG and deletes the previous upload.
  5. **Conflict:** edit `content/board.json` on the branch directly (e.g. with `gh api` or a second browser session), then Save from the stale tab. Expected: the conflict message, with edits still on screen.
  6. **Failed upload:** stop the dev server mid-upload, or block `/api/upload` via CDP `Network.setBlockedURLs`. Expected: "Upload failed — try again", Retry works, and Save stays disabled until then.
  7. **Unsupported file:** pick a `.heic` file in desktop Chrome. Expected: the unsupported-file message.
  8. **Unsaved-changes guard:** with unsaved changes, reload. Expected: the `beforeunload` prompt.
  9. **Phone width:** at 390 px, the crop dialog fits and the buttons are reachable.

- [ ] **Step 3: Clean up.** Restore `GITHUB_BRANCH=main` in `.env.local`. Ask the user before deleting the remote branch (`git push origin --delete photo-upload-e2e`). Restart the dev server.

- [ ] **Step 4: Final report.** Summarize the results of each flow, plus `npm test`, `npm run build` and `npx eslint`. Note anything that deviated. Do not commit unless asked.
