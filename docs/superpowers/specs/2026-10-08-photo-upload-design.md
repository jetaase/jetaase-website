# Photo upload for the admin — design

Status: approved in conversation (2026-10-08), awaiting written-spec review
Part 1 of 3 in the events work: **(1) photo upload** → (2) events editor + Events/home pages → (3) past-event photo galleries.

## Goal

Non-technical board members can add, replace, and remove photos from `/admin` without touching code. Photos are stored in the org-owned GitHub repo, like all other content. Part 1 wires this into the existing officer and subchapter-rep editors. Parts 2 and 3 reuse the same pieces for event posters and galleries.

**Success:** a board member on a phone picks a headshot, frames it in a circle, clicks Save, and about a minute later the live site shows it. One save produces one commit and one redeploy.

## Decisions

| Topic | Decision |
| --- | --- |
| Storage | The GitHub repo, under `public/images/uploads/<folder>/`, served by Vercel like the existing images. No new service. |
| Headshots | Drag-and-zoom crop to a circle (react-easy-crop), output 600×600 JPEG. |
| Posters and gallery photos | No crop. Kept whole, longest side 1600 px, JPEG. (Part 2 must display posters uncropped, e.g. `object-fit: contain`, so flyer text isn't cut.) |
| Input formats | Anything the browser can decode: JPEG, PNG, WebP, and HEIC where the browser supports it (iOS usually converts automatically). Everything is re-encoded to JPEG in the browser. Transparency becomes white, which is acceptable for photos. |
| Server-accepted format | JPEG only, checked by magic bytes. |
| Publishing | Photos upload as unpublished git blobs as soon as they're picked. Save makes one commit containing the content JSON, the new photos, and any deletions. |
| Replaced and removed photos | Deleted from the repo in the same Save commit, only when under `uploads/` and not referenced by any content file. They remain in git history. |
| Concurrent saves | Per-file optimistic check. A save is refused with a clear message if the file changed since it was loaded. |

## User experience (`/admin`)

### Photo field

This replaces the "Photo path" text input on officer and rep cards.

- **Display:** a circular thumbnail plus **Change photo** and **Remove** buttons. Remove reverts to `/images/board-placeholder.png`.
- **Change photo flow:**
  1. Choose a file. On phones this opens the library or camera.
  2. A crop dialog opens with the image behind a circular mask.
  3. Drag to move. Zoom with a slider or pinch.
  4. **Use photo** crops and resizes in the browser, then starts the upload.
- **Card state while working:**
  - The card shows the local preview immediately, marked **Unsaved**.
  - While uploading, it shows a spinner.
  - On failure it shows "Upload failed — try again", with a retry.

### Replacing and removing

**Before Save** (nothing is published yet):
- Replacing or removing a not-yet-saved photo just drops it from state.
- The unused blob is never referenced and GitHub garbage-collects it.

**Already published:**
- Replacing or removing marks the old file **"Will be removed when you save"**, with **Undo**.
- The deletion happens in the Save commit, subject to the safety rules below.

### Save button

- **Disabled while:**
  - there are no changes,
  - any upload is in progress, or
  - any upload has failed and not been retried.
- **On success:** "Saved. New photos appear once the site finishes updating (about a minute)."

### Leaving the page

- A `beforeunload` prompt appears when there are unsaved changes.

### Error messages

| Situation | Message |
| --- | --- |
| Undecodable file (e.g. HEIC on desktop Chrome) | "That file isn't a photo we can use. Try a JPG or PNG." |
| Conflict on save | "Someone else saved changes, or the site is still updating from your last save. Wait a minute, reload, and try again." Edits stay on screen. |

## Architecture

```
Browser (admin)                         Server (Next route handlers)         GitHub (Git Data API)
──────────────                          ────────────────────────────         ─────────────────────
pick file → decode → crop/resize        POST /api/upload                     POST git/blobs
  → JPEG Blob → base64  ───────────────▶  auth, validate, name file  ───────▶  (unreferenced blob)
                        ◀─────────────── { path, sha }
Save ─────────────────────────────────▶ POST /api/github (extended)
  { files: [json], uploads: [{path,sha}],   auth, allowlist, conflict check
    deletes: [path], base: {path: blobSha}} reference check for deletes
                                            build tree on branch head ──────▶ git/trees, git/commits,
                                            commit, fast-forward ref            PATCH git/refs (force:false)
                        ◀─────────────── { commitUrl, blobShas }
```

### Units

**`lib/image.ts`** (browser-only, plus pure helpers)
- `targetSize(kind, w, h)`: pure. Gives 600×600 for headshots, longest side 1600 for photos, and never upscales.
- `clampCrop(cropAreaPixels, naturalW, naturalH)`: pure. Rounds react-easy-crop's `croppedAreaPixels` to integers and clamps them to the image bounds.
- `renderJpeg(file, { kind, crop? })`: decodes via `createImageBitmap` with `imageOrientation: "from-image"` (so EXIF-rotated phone photos stay upright), draws to a canvas, and returns a JPEG `Blob` at quality ~0.82. Throws `UnsupportedImageError` when decoding fails.

**`app/admin/PhotoField.tsx`** (client)
- Thumbnail, the buttons, upload state, and the pending-delete/Undo state.
- Takes `kind: "headshot" | "photo"`.

**`app/admin/CropDialog.tsx`** (client)
- An accessible modal wrapping react-easy-crop with a circular mask and a zoom slider.
- Returns the crop area.

**`app/admin/ListEditor.tsx`** (existing, extended)
- A `Field` can be `{ kind: "photo" | "headshot" }`.
- The editor tracks `uploads[]`, `deletes[]` and per-file `base` SHAs.
- Save sends the new payload, disables appropriately, and adds the `beforeunload` guard.

**`lib/github.ts`** (extended; `fetchImpl` stays injectable)
- `createBlob(base64)` returns the blob SHA.
- `getFileAt(path, ref)`: the current blob SHA and text of a path at a commit, or `null`.
- `commitTree({ files, uploads, deletes, message })`, in order:
  1. Get the ref and its base tree.
  2. Create the tree. Entries for files and uploads, and `sha: null` for deletes.
  3. Create the commit.
  4. Update the ref with `force: false`.
  5. On a non-fast-forward failure, retry once from the new head after re-running the conflict checks.
- The old `commitFile`, `getFileSha` and `buildPutBody` are removed once nothing uses them.

**`lib/uploads.ts`** (pure, shared by the routes)
- `UPLOAD_FOLDERS = ["board", "reps", "events"]`.
- `isJpeg(bytes)`: checks the magic bytes `FF D8 FF`.
- `uploadPath(folder, nameHint, now, rand)` produces `public/images/uploads/<folder>/<slug>-<yyyymmdd>-<4 hex>.jpg`.
  - The slug comes from the name hint, lowercased and `[a-z0-9-]` only, falling back to `photo`.
- `isUploadPath(path)`: an exact regex for paths under `public/images/uploads/(board|reps|events)/` ending in `.jpg`.
- `gitBlobSha(content)`: sha1 of `"blob <len>\0" + content`. Used so a page can hand the editor the base SHA of the file it served.

**`app/api/upload/route.ts`** (new)
- `requireSession()` must pass, or 401.
- The body is `{ folder, nameHint, dataBase64 }`.
- Rejected with 400 when:
  - the folder isn't in `UPLOAD_FOLDERS`,
  - the data isn't valid base64,
  - the decoded size is 3 MB or more, or
  - `isJpeg` fails.
- Otherwise it creates the blob and returns `{ path, sha }`.
- The GitHub token is never returned, including in errors.

**`app/api/github/route.ts`** (extended)
- `requireSession()` must pass, or 401.
- The body is `{ files: [{ path, content }], uploads: [{ path, sha }], deletes: [path], base: { [path]: blobSha }, message }`.
- **Validation:**
  - `files[].path` must be in `EDITABLE_PATHS`.
  - `uploads[].path` and `deletes[]` must pass `isUploadPath`.
  - Anything else is a 400 or 403.
- **Conflict check:** for each file, the current blob SHA at the head must equal `base[path]`, or the route returns 409.
- **Delete safety:** a delete is skipped (with no error) when the path is still referenced. References are the `photo` values in the incoming `files`, plus every other `EDITABLE_PATHS` file at the head.
- **Response:** `{ commitUrl, blobShas: { [path]: newSha } }`. The client stores these as the new `base`, so consecutive saves work before the redeploy finishes.

**`app/admin/page.tsx`**
- Passes `base` SHAs, computed with `gitBlobSha` from the files it read, into each editor.
- Officer and rep `photo` fields switch from text to `kind: "headshot"`.

## Security

- **Authentication:** both routes are auth-first and fail closed, like today.
- **Paths:**
  - Upload paths are generated by the server, never supplied by the client.
  - Every committed path is checked against an allowlist or an exact regex.
  - Deletions are limited to `uploads/` and to unreferenced files.
- **File type:** JPEG is checked by magic bytes, with a 3 MB cap on decoded size. Vercel's request limit is about 4.5 MB, and the base64 overhead fits inside that.
- **Token:** stays server-side. Errors return messages only, never token-bearing details.

## Testing

- **Unit tests (vitest, injected fetch, no real GitHub):**
  - `lib/uploads.ts`: folder allowlist, JPEG magic bytes, path generation and slugging, `isUploadPath`, and `gitBlobSha` against known git SHAs.
  - `lib/github.ts`: `createBlob`; `commitTree` builds the right tree (files plus uploads plus `sha: null` deletes) and retries once on a non-fast-forward; the conflict path.
  - Route logic, factored into testable functions:
    - 401 without a session.
    - 400 for a bad folder, non-JPEG data or oversize data.
    - 403 for a disallowed path.
    - 409 on a base mismatch.
    - Deletes are skipped when referenced, and a non-`uploads/` delete is rejected.
  - `lib/image.ts` pure helpers: `targetSize` and `clampCrop`, including clamping and no upscaling.
- **End to end:**
  - Run locally with `GITHUB_BRANCH` set to a throwaway branch, in headless Chrome:
    - upload and crop a headshot, replace it, remove another, and save;
    - verify one commit on the branch with the expected adds and deletes;
    - exercise a 409 by editing the branch in between;
    - exercise a failed upload, the `beforeunload` prompt, and a phone-width layout.
  - Delete the branch afterwards.
- **Not automated:** crop gesture mechanics (the library's job) and HEIC decoding, which is checked by hand to show the friendly error.

## Out of scope (Part 1)

- Events data, the editor and the pages (Part 2). Gallery multi-select, upload and viewing (Part 3).
- Transparent PNG preservation, HEIC decoding on desktop, and a server-side image pipeline.
- Cleaning up old design images or photos that were replaced before this feature existed.

## Risks and notes

- **Repo growth:** at about 300 KB per photo, 1,000 photos is about 300 MB, which is fine. If galleries grow very large, storage can move to Vercel Blob later behind the same `/api/upload` interface.
- **Library compatibility:** confirm react-easy-crop works with React 19.2 and that its `cropAreaPixels` matches the helper during planning.
- **AGENTS.md:** read the Next 16 route handler docs in `node_modules/next/dist/docs/` before implementing, in particular request body handling and the runtime.
