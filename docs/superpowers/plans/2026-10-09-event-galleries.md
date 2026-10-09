# Event Photo Galleries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Board members add a curated photo gallery (about 5–20 photos, with captions, order, and a credit) to an event from `/admin/events`. The event's page shows a square-thumbnail grid that opens a full-screen lightbox. Past-event cards on `/events` show an "N photos" badge.

**Architecture:**
- Each event gains `photos: EventPhoto[]` and `photoCredit: string` in `content/events.json`. Gallery photos reuse the existing upload pipeline: an unpublished blob when picked, committed in the single Save commit.
- `ListEditor` keys its upload state by *slot* instead of by item, so one event can have many uploads in flight. A new `kind: "gallery"` field renders `GalleryField`.
- Pure gallery helpers live in a browser-safe `lib/gallery.ts`.
- On the public side, a client `Gallery` renders the grid with `next/image` thumbnails and a hand-built `<dialog>` `Lightbox`.

**Tech Stack:** Next.js 16 App Router (read `node_modules/next/dist/docs/` before using an API you're unsure of), React 19, CSS Modules, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-09-event-galleries-design.md`

## Global Constraints

- **Commits:** do not commit or push unless the user explicitly asks. Each "Checkpoint" step means: stop, run the checks listed, and report. Commit with the given message only if the user has said to commit.
- **Branch:** work on a local branch `event-galleries` off `main`. It is merged into `main` with `--ff-only`, and only when the user asks.
- **Testing saves:** never save from `/admin` against the real repo.
  - In browser checks, intercept `/api/upload` and `/api/github` with CDP Fetch.
  - Start the server with `GITHUB_TOKEN=dummy GITHUB_BRANCH=dummy-branch`.
- **Storage and processing:** gallery photos upload to folder `events` with `renderJpeg(file, { kind: "photo" })`: no crop, longest side 1600 px, JPEG.
- **Browser-safe libraries:** `lib/events.ts`, `lib/gallery.ts`, and `lib/editor-save.ts` ship to the browser. No Node-only imports.
- **Existing editors:** officers, subchapter reps, posters, and partner events must behave exactly as before. That includes pick, remove, undo, retry, and the delete-on-save rules.
- **No new dependencies.**
- **Copy, verbatim:**
  - Empty gallery: "No photos yet. Add them after the event."
  - Caption placeholder: "Caption (optional)"
  - Credit label: "Photo credit (optional)", placeholder "e.g. Photos by Jane Doe"
  - Pending removal: "Will be removed when you save"
  - Upload failure: "Upload failed — try again"
  - Skipped files: "1 file isn't a photo we can use. Try a JPG or PNG." or "N files aren't photos we can use. Try a JPG or PNG."
  - Badge: "1 photo" / "N photos"
  - Section heading: "Photos"
  - Alt text without a caption: "Photo N from <event title>"
- **Grid:** 3 columns on desktop, 2 at ≤ 768 px. Square tiles with `object-fit: cover`.
- **Lightbox:** shows the whole photo with `object-fit: contain`.

## Review Focus

1. **Removing a tile while its upload is still running.** The late upload result must be ignored. The tile stays gone and Save becomes enabled. Pinned in Task 4, browser step (hold one upload response, remove the tile, release it).
2. **Saving after removing a published photo, then saving after Undo.** In the first case the photo must leave `events.json` and appear in `deletes`. After Undo it must stay and must not be deleted. Pinned in Task 2 (`cleanPhotos` tests) and Task 4, browser step (payload check).
3. **A batch of picked files that includes a non-image.** The good files are added. One message counts the skipped ones, and nothing crashes. Pinned in Task 2 (`skippedMessage`) and Task 4, browser step (a `.txt` in the batch).
4. **A hand-edited `events.json` with no `photos` or `photoCredit`.** Pages and the admin must not crash. Pinned in Task 1 (`normalizeEvent` tests).
5. **Closing the lightbox by Esc, ✕, or a backdrop click, and swiping on the backdrop.** Page scroll must come back, focus must return to the tile, and a swipe must not close the lightbox. Pinned in Task 5, browser step.

---

## File Map

| File | Task | Responsibility |
| --- | --- | --- |
| `lib/events.ts` | 1 | `EventPhoto`, new `JetaaseEvent` fields, `normalizeEvent`, `photoCountLabel` |
| `lib/content.ts` | 1 | `readEvents()` runs `normalizeEvent` |
| `content/events.json` | 1 | existing events get `"photos": []`, `"photoCredit": ""` |
| `app/admin/events/page.tsx` | 1, 4 | `BLANK_EVENT` fields (1); Photos and credit fields (4) |
| `lib/gallery.ts` | 2 | `EditorPhoto`, `slotKey`, `newPhotoId`, `movePhoto`, `cleanPhotos`, `skippedMessage` |
| `lib/editor-save.ts` | 2 | `prepareItems` option `galleries` |
| `app/admin/ListEditor.tsx` | 3, 4 | slot-keyed upload state (3); gallery wiring (4) |
| `app/admin/GalleryField.tsx` + `.module.css` | 4 | gallery tiles UI |
| `next.config.ts` | 5 | `images.localPatterns`, `images.qualities` |
| `components/Gallery.tsx` + `.module.css` | 5 | grid, credit, lightbox state |
| `components/Lightbox.tsx` + `.module.css` | 5 | full-screen viewer |
| `app/events/[slug]/page.tsx` | 5 | renders `Gallery` |
| `components/EventCard.tsx` + `.module.css` | 6 | photo-count badge |

---

### Task 1: Event data model

**Files:**
- Modify: `lib/events.ts`
- Modify: `lib/content.ts:48-51`
- Modify: `content/events.json`
- Modify: `app/admin/events/page.tsx:34-36`
- Test: `lib/events.test.ts`, `lib/content.test.ts`

**Interfaces:**
- Produces:
  - `type EventPhoto = { id: string; src: string; caption: string }`
  - `JetaaseEvent.photos: EventPhoto[]` and `JetaaseEvent.photoCredit: string`
  - `normalizeEvent(raw: Partial<JetaaseEvent>): JetaaseEvent`
  - `photoCountLabel(n: number): string`

- [ ] **Step 1: Create the branch**

```bash
git switch -c event-galleries
```

- [ ] **Step 2: Write the failing tests**

Append to `lib/events.test.ts` and add `normalizeEvent, photoCountLabel` to its import from `./events`:

```ts
describe("normalizeEvent", () => {
  it("fills a missing gallery and credit", () => {
    const e = normalizeEvent({ id: "e1", title: "T", date: "2026-01-01" });
    expect(e.photos).toEqual([]);
    expect(e.photoCredit).toBe("");
  });
  it("replaces a non-array photos value", () => {
    expect(normalizeEvent({ id: "e1", photos: "oops" as unknown as [] }).photos).toEqual([]);
  });
  it("keeps existing photos and credit", () => {
    const photos = [{ id: "ph1-0", src: "/images/uploads/events/a-20261009-a1b2.jpg", caption: "Hi" }];
    const e = normalizeEvent({ id: "e1", photos, photoCredit: "Photos by Jo" });
    expect(e.photos).toEqual(photos);
    expect(e.photoCredit).toBe("Photos by Jo");
  });
});

describe("photoCountLabel", () => {
  it("is singular for one photo", () => {
    expect(photoCountLabel(1)).toBe("1 photo");
  });
  it("is plural otherwise", () => {
    expect(photoCountLabel(12)).toBe("12 photos");
  });
});
```

In `lib/content.test.ts`, inside the `readEvents` loop, after the `rsvpUrl` line, add:

```ts
      expect(Array.isArray(e.photos)).toBe(true);
      expect(typeof e.photoCredit).toBe("string");
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run lib/events.test.ts lib/content.test.ts`
Expected: FAIL. `normalizeEvent` and `photoCountLabel` are not exported, and `e.photos` is undefined.

- [ ] **Step 4: Implement**

In `lib/events.ts`, add above `JetaaseEvent`:

```ts
export type EventPhoto = {
  id: string; // "ph<timestamp>-<n>", set when added; the editor's stable key
  src: string; // public URL under /images/uploads/events/
  caption: string; // "" for none
};
```

Add two fields to `JetaaseEvent`, after `rsvpUrl`:

```ts
  photos: EventPhoto[]; // gallery, in display order
  photoCredit: string; // "" for none, e.g. "Photos by Jane Doe"
```

Add at the end of `lib/events.ts`:

```ts
// Hand-edited files may lack the gallery fields; treat that as no gallery.
export function normalizeEvent(raw: Partial<JetaaseEvent>): JetaaseEvent {
  return {
    ...raw,
    photos: Array.isArray(raw.photos) ? raw.photos : [],
    photoCredit: raw.photoCredit ?? "",
  } as JetaaseEvent;
}

export function photoCountLabel(n: number): string {
  return n === 1 ? "1 photo" : `${n} photos`;
}
```

In `lib/content.ts`, change the import to `import { normalizeEvent, type JetaaseEvent, type PartnerEvent } from "./events";` and replace `readEvents`:

```ts
// Unsorted: pages split and sort events by date (see lib/events.ts).
export function readEvents(): JetaaseEvent[] {
  return (JSON.parse(readRaw("events.json")) as Partial<JetaaseEvent>[]).map(normalizeEvent);
}
```

Add the fields to the content file, keeping `order` last:

```bash
node -e 'const fs=require("fs");const p="content/events.json";const ev=JSON.parse(fs.readFileSync(p,"utf8")).map(({order,...e})=>({...e,photos:e.photos??[],photoCredit:e.photoCredit??"",order}));fs.writeFileSync(p,JSON.stringify(ev,null,2)+"\n")'
```

In `app/admin/events/page.tsx`, extend `BLANK_EVENT`:

```ts
const BLANK_EVENT: Omit<JetaaseEvent, "id" | "order"> = {
  slug: "", title: "", date: "", time: "", location: "", summary: "", details: "", poster: "", rsvpUrl: "",
  photos: [], photoCredit: "",
};
```

- [ ] **Step 5: Run the tests and the type check**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests PASS, and tsc prints nothing.

- [ ] **Step 6: Checkpoint**

Report the results. If the user says commit:

```bash
git add lib/events.ts lib/events.test.ts lib/content.ts lib/content.test.ts content/events.json app/admin/events/page.tsx
git commit -m "feat(events): add photos and photoCredit to the event data"
```

---

### Task 2: Gallery helpers and save preparation

**Files:**
- Create: `lib/gallery.ts`
- Create: `lib/gallery.test.ts`
- Modify: `lib/editor-save.ts` (`prepareItems`)
- Test: `lib/editor-save.test.ts`, `lib/admin-api.test.ts`

**Interfaces:**
- Consumes: `EventPhoto` from Task 1.
- Produces (all from `lib/gallery.ts`):
  - `type EditorPhoto = EventPhoto & { removed?: boolean }`
  - `slotKey(itemId: string, fieldKey: string, photoId?: string): string`, which returns `"<item>:<field>"` or `"<item>:<field>:<photo>"`
  - `newPhotoId(now: number, index: number): string`, which returns `"ph<now>-<index>"`
  - `movePhoto<T>(list: T[], index: number, delta: -1 | 1): T[]`
  - `cleanPhotos(photos: EditorPhoto[]): EventPhoto[]`
  - `skippedMessage(n: number): string`
- Produces: `prepareItems(items, { byDate?, slugs?, galleries?: string[] })`. Each key in `galleries` is run through `cleanPhotos`.

- [ ] **Step 1: Write the failing tests**

Create `lib/gallery.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { cleanPhotos, movePhoto, newPhotoId, skippedMessage, slotKey } from "./gallery";

const A = { id: "a", src: "/images/uploads/events/a-20261009-a1b2.jpg", caption: "  First  " };
const B = { id: "b", src: "/images/uploads/events/b-20261009-a1b2.jpg", caption: "" };
const C = { id: "c", src: "/images/uploads/events/c-20261009-a1b2.jpg", caption: "Third" };

describe("slotKey", () => {
  it("names a single-photo slot by item and field", () => {
    expect(slotKey("e1", "poster")).toBe("e1:poster");
  });
  it("adds the photo id for a gallery slot", () => {
    expect(slotKey("e1", "photos", "ph1-0")).toBe("e1:photos:ph1-0");
  });
});

describe("newPhotoId", () => {
  it("is unique per index within one pick", () => {
    expect(newPhotoId(1700, 0)).toBe("ph1700-0");
    expect(newPhotoId(1700, 1)).toBe("ph1700-1");
  });
});

describe("movePhoto", () => {
  it("swaps with the neighbor", () => {
    expect(movePhoto([A, B, C], 0, 1).map((p) => p.id)).toEqual(["b", "a", "c"]);
    expect(movePhoto([A, B, C], 2, -1).map((p) => p.id)).toEqual(["a", "c", "b"]);
  });
  it("does nothing past either end", () => {
    const list = [A, B];
    expect(movePhoto(list, 0, -1)).toBe(list);
    expect(movePhoto(list, 1, 1)).toBe(list);
  });
  it("does not mutate the input", () => {
    const list = [A, B];
    movePhoto(list, 0, 1);
    expect(list.map((p) => p.id)).toEqual(["a", "b"]);
  });
});

describe("cleanPhotos", () => {
  it("drops removed photos, strips editor flags, trims captions, keeps order", () => {
    const out = cleanPhotos([{ ...A }, { ...B, removed: true }, { ...C, removed: false }]);
    expect(out).toEqual([
      { id: "a", src: A.src, caption: "First" },
      { id: "c", src: C.src, caption: "Third" },
    ]);
  });
  it("drops a photo with no src (an upload that never finished)", () => {
    expect(cleanPhotos([{ ...A, src: "" }])).toEqual([]);
  });
});

describe("skippedMessage", () => {
  it("is empty when nothing was skipped", () => {
    expect(skippedMessage(0)).toBe("");
  });
  it("is singular for one file", () => {
    expect(skippedMessage(1)).toBe("1 file isn't a photo we can use. Try a JPG or PNG.");
  });
  it("is plural for several", () => {
    expect(skippedMessage(3)).toBe("3 files aren't photos we can use. Try a JPG or PNG.");
  });
});
```

Append to the `prepareItems` describe block in `lib/editor-save.test.ts`:

```ts
  it("cleans gallery fields listed in galleries", () => {
    const src = "/images/uploads/events/a-20261009-a1b2.jpg";
    const gone = "/images/uploads/events/b-20261009-a1b2.jpg";
    const withPhotos = [{
      id: "e1", title: "T", date: "2026-01-01",
      photos: [{ id: "p1", src, caption: " hi " }, { id: "p2", src: gone, caption: "", removed: true }],
    }];
    expect(prepareItems(withPhotos, { galleries: ["photos"] })[0].photos)
      .toEqual([{ id: "p1", src, caption: "hi" }]);
    expect(prepareItems(withPhotos, {})[0].photos).toHaveLength(2);
  });
```

Append to the `buildSavePayload` describe block in `lib/editor-save.test.ts`:

```ts
  it("commits every gallery upload the content uses, keyed by slot", () => {
    const p1 = "public/images/uploads/events/a-20261009-a1b2.jpg";
    const p2 = "public/images/uploads/events/a-20261009-c3d4.jpg";
    const poster = "public/images/uploads/events/b-20261009-e5f6.jpg";
    const dropped = "public/images/uploads/events/a-20261009-ffff.jpg";
    const items = [
      { id: "e1", poster: "", photos: [{ id: "x", src: "/images/uploads/events/a-20261009-a1b2.jpg", caption: "" },
        { id: "y", src: "/images/uploads/events/a-20261009-c3d4.jpg", caption: "" }] },
      { id: "e2", poster: "/images/uploads/events/b-20261009-e5f6.jpg", photos: [] },
    ];
    const p = buildSavePayload({
      path: "content/events.json", message: "m", items, base: {}, deletes: [],
      pending: {
        "e1:photos:x": up(p1, "S1"), "e1:photos:y": up(p2, "S2"),
        "e1:photos:z": up(dropped, "S3"), "e2:poster": up(poster, "S4"),
      },
    });
    expect(p.uploads).toEqual([
      { path: p1, sha: "S1" }, { path: p2, sha: "S2" }, { path: poster, sha: "S4" },
    ]);
  });
```

Append to the `handleSave` describe block in `lib/admin-api.test.ts`:

```ts
  it("deletes a removed gallery photo but keeps one events.json still uses", async () => {
    const KEEP = "public/images/uploads/events/keep-20261009-a1b2.jpg";
    const GONE = "public/images/uploads/events/gone-20261009-a1b2.jpg";
    const events = (srcs: string[]) => JSON.stringify([{
      id: "e1", photos: srcs.map((s, i) => ({ id: `p${i}`, src: s.replace(/^public/, ""), caption: "" })),
    }], null, 2) + "\n";
    const current = events([KEEP, GONE]);
    const { f, calls } = fakeGitHub({ "content/events.json": current, [KEEP]: "x", [GONE]: "y" });
    const r = await handleSave(deps(f), {
      files: [{ path: "content/events.json", content: events([KEEP]) }],
      uploads: [], deletes: [KEEP, GONE],
      base: { "content/events.json": gitBlobSha(current) }, message: "m",
    });
    expect(r.status).toBe(200);
    const paths = treeOf(calls).filter((e: { sha?: null }) => e.sha === null).map((e: { path: string }) => e.path);
    expect(paths).toEqual([GONE]);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/gallery.test.ts lib/editor-save.test.ts lib/admin-api.test.ts`
Expected: FAIL. `./gallery` cannot be resolved, and the `prepareItems` gallery test fails because the removed photo is still there. The `buildSavePayload` and `handleSave` tests should already PASS, since they pin existing behavior. If either fails, stop and report: the save path does not support galleries as the spec assumes.

- [ ] **Step 3: Implement**

Create `lib/gallery.ts`:

```ts
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
```

In `lib/editor-save.ts`, add `import { cleanPhotos, type EditorPhoto } from "./gallery";` and replace `prepareItems`:

```ts
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
```

- [ ] **Step 4: Run all tests and the type check**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all PASS, and tsc is clean.

- [ ] **Step 5: Checkpoint**

Report the results. If the user says commit:

```bash
git add lib/gallery.ts lib/gallery.test.ts lib/editor-save.ts lib/editor-save.test.ts lib/admin-api.test.ts
git commit -m "feat(admin): add gallery helpers and clean galleries on save"
```

---

### Task 3: Slot-keyed upload state in ListEditor (no behavior change)

`ListEditor` keys `pending`, `originals`, and `uploadGen` by item id, so an item can hold only one upload. This task re-keys them by `slotKey(itemId, fieldKey)` and makes `upload` generic, without changing behavior. Task 4 builds galleries on top of it.

**Files:**
- Modify: `app/admin/ListEditor.tsx` (the `// ── Photos ──` section, `remove`, and the photo branch of `renderCard`)

**Interfaces:**
- Consumes: `slotKey` from Task 2.
- Produces, inside `ListEditor` and used by Task 4:
  - `upload(slot: string, nameHint: string, jpeg: Blob, previewUrl: string, done: (publicUrl: string) => void): Promise<void>`
  - `markForDelete(publicUrl: string)`
  - `unmarkForDelete(publicUrl: string)`
  - `dropPending(slot: string)`
  - `bumpGen(slot: string)`

- [ ] **Step 1: Replace the photo state helpers**

Add `slotKey` to the imports: `import { slotKey } from "@/lib/gallery";`.

Update the state comments:

```ts
  // Photos picked this session, keyed by slot (lib/gallery.ts slotKey).
  const [pending, setPending] = useState<Record<string, PendingPhoto>>({});
  ...
  // Each single-photo slot's value as published, recorded the first time it changes.
  const [originals, setOriginals] = useState<Record<string, string>>({});
  ...
  // Per-slot upload generation: removing or undoing bumps it, so a late
  // upload result for a photo that's no longer wanted is ignored.
  const uploadGen = useRef<Record<string, number>>({});
  const bumpGen = (slot: string) => (uploadGen.current[slot] = (uploadGen.current[slot] ?? 0) + 1);
```

Replace everything from `// ── Photos ──` up to (not including) `async function save()` with:

```ts
  // ── Photos ──

  function rememberOriginal(it: T, key: string) {
    const slot = slotKey(it.id, key);
    setOriginals((o) => (slot in o ? o : { ...o, [slot]: String(it[key] ?? "") }));
  }
  // Only published uploads are deleted; this session's unsaved uploads simply drop.
  function markForDelete(publicUrl: string) {
    const repoPath = toRepoPath(publicUrl);
    if (isUploadPath(repoPath)) setDeletes((d) => (d.includes(repoPath) ? d : [...d, repoPath]));
  }
  function unmarkForDelete(publicUrl: string) {
    setDeletes((d) => d.filter((x) => x !== toRepoPath(publicUrl)));
  }
  function dropPending(slot: string) {
    setPending((p) => {
      const rest = { ...p };
      delete rest[slot];
      return rest;
    });
  }
  // Uploads a rendered photo into `slot`; `done` stores its public URL.
  async function upload(
    slot: string, nameHint: string, jpeg: Blob, previewUrl: string, done: (publicUrl: string) => void,
  ) {
    const gen = bumpGen(slot);
    const current = () => uploadGen.current[slot] === gen;
    setPending((p) => ({ ...p, [slot]: { status: "uploading", previewUrl, jpeg } }));
    setDirty(true);
    const fail = (error: string) => {
      if (current()) setPending((p) => ({ ...p, [slot]: { status: "failed", previewUrl, jpeg, error } }));
    };
    let res: Response;
    try {
      res = await fetch("/api/upload", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ folder: uploadFolder, nameHint, dataBase64: await blobToBase64(jpeg) }),
      });
    } catch {
      return fail(uploadErrorMessage(null));
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return fail(uploadErrorMessage(res.status, data.error));
    if (!current()) return;
    setPending((p) => ({ ...p, [slot]: { status: "uploaded", previewUrl, jpeg, upload: data } }));
    done(toPublicUrl(data.path));
  }
  function uploadPhoto(it: T, key: string, jpeg: Blob, previewUrl: string) {
    return upload(slotKey(it.id, key), nameOf(it), jpeg, previewUrl, (url) => setField(it.id, key, url));
  }
  function pickPhoto(it: T, key: string, jpeg: Blob, previewUrl: string) {
    const original = String(originals[slotKey(it.id, key)] ?? it[key] ?? "");
    rememberOriginal(it, key);
    markForDelete(original);
    void uploadPhoto(it, key, jpeg, previewUrl);
  }
  function removePhoto(it: T, f: Field) {
    const slot = slotKey(it.id, f.key);
    bumpGen(slot);
    const original = String(originals[slot] ?? it[f.key] ?? "");
    rememberOriginal(it, f.key);
    markForDelete(original);
    dropPending(slot);
    setField(it.id, f.key, ""); // no photo: pages show the default
  }
  function undoRemove(it: T, key: string) {
    const slot = slotKey(it.id, key);
    const original = originals[slot];
    if (original === undefined) return;
    bumpGen(slot);
    unmarkForDelete(original);
    dropPending(slot);
    setField(it.id, key, original);
  }
```

- [ ] **Step 2: Update `remove(it)`**

Replace `remove`:

```ts
  function remove(it: T) {
    for (const f of fields) if (f.kind) markForDelete(String(originals[slotKey(it.id, f.key)] ?? it[f.key] ?? ""));
    // Ignore late results for any of this item's uploads, and forget them.
    const mine = (slot: string) => slot.startsWith(`${it.id}:`);
    Object.keys(uploadGen.current).filter(mine).forEach(bumpGen);
    setPending((p) => Object.fromEntries(Object.entries(p).filter(([slot]) => !mine(slot))));
    update((prev) => prev.filter((x) => x.id !== it.id));
  }
```

- [ ] **Step 3: Update the photo branch of `renderCard`**

Replace the body of the `fields.map` photo branch:

```tsx
          {fields.map((f) => {
            if (!f.kind) return renderInput(it, f);
            const slot = slotKey(it.id, f.key);
            const p = pending[slot];
            const original = originals[slot];
            const view: PhotoView = {
              src: p?.previewUrl ?? String(it[f.key] ?? ""),
              status: p?.status ?? "saved",
              pendingDelete: !p && original !== undefined && deletes.includes(toRepoPath(original)),
              canUndo: !p && original !== undefined && String(it[f.key] ?? "") !== original,
              error: p?.error,
            };
            return (
              <PhotoField
                key={f.key} kind={f.kind} view={view}
                onPick={(jpeg, url) => pickPhoto(it, f.key, jpeg, url)}
                onRemove={() => removePhoto(it, f)}
                onUndoRemove={() => undoRemove(it, f.key)}
                onRetry={() => p && void uploadPhoto(it, f.key, p.jpeg, p.previewUrl)}
              />
            );
          })}
```

- [ ] **Step 4: Static checks**

Run: `npx tsc --noEmit && npx vitest run && npx eslint app/admin`
Expected: tsc clean, tests PASS, and no new eslint errors. The existing `no-img-element` warnings are fine.

- [ ] **Step 5: Browser regression check of posters**

Follow the workflow recipe:
1. Run `npm run build`, then start the server with `GITHUB_TOKEN=dummy GITHUB_BRANCH=dummy-branch npx next start -p 3100`.
2. Drive Chrome over CDP, intercepting `/api/upload` and `/api/github`.
   - `/api/upload` returns `{ path: "public/images/uploads/events/x-20261009-a1b2.jpg", sha: "S1" }`.
   - `/api/github` captures the body and returns `{ commitUrl: "x", blobShas: {} }`.
3. On `/admin/events`, open one event card and set a poster with any local JPG.
4. Check that the "Unsaved" badge appears and Save becomes enabled.
5. Click Save. The captured payload's `uploads` contains `S1` and the event's `poster` is `/images/uploads/events/x-20261009-a1b2.jpg`.
6. On `/admin/people`, open an officer card. Click Remove, then check that Undo appears.

Expected: the same behavior as on `main`.

- [ ] **Step 6: Checkpoint**

Report the results. If the user says commit:

```bash
git add app/admin/ListEditor.tsx
git commit -m "refactor(admin): key upload state by photo slot instead of by item"
```

---

### Task 4: GalleryField in the admin

**Files:**
- Create: `app/admin/GalleryField.tsx`
- Create: `app/admin/GalleryField.module.css`
- Modify: `app/admin/ListEditor.tsx` (`Field.kind`, gallery handlers, `renderCard`, `remove`, `save`)
- Modify: `app/admin/events/page.tsx` (`EVENT_FIELDS`, ListEditor `galleries` prop)

**Interfaces:**
- Consumes:
  - From Task 2: `EditorPhoto`, `slotKey`, `newPhotoId`, `movePhoto`, `skippedMessage`, and `prepareItems(..., { galleries })`.
  - From Task 3: `upload`, `markForDelete`, `unmarkForDelete`, `dropPending`, `bumpGen`.
  - `PhotoStatus` from `PhotoField.tsx`, and `renderJpeg` from `lib/image.ts`.
- Produces:
  - `GalleryField` props:
    - `label: string`
    - `photos: GalleryPhotoView[]`
    - `onAdd(picked: { jpeg: Blob; previewUrl: string }[])`
    - `onRemove(id)`, `onUndo(id)`, `onRetry(id)`
    - `onMove(id, delta: -1 | 1)`
    - `onCaption(id, value)`
  - `type GalleryPhotoView = { id: string; src: string; caption: string; status: PhotoStatus; removed: boolean; error?: string }`
  - `Field.kind` now also accepts `"gallery"`.

- [ ] **Step 1: Create `app/admin/GalleryField.tsx`**

```tsx
"use client";
import { useRef, useState } from "react";
import { renderJpeg } from "@/lib/image";
import { skippedMessage } from "@/lib/gallery";
import type { PhotoStatus } from "./PhotoField";
import styles from "./GalleryField.module.css";

export type GalleryPhotoView = {
  id: string; src: string; caption: string; status: PhotoStatus;
  removed: boolean; // published, will be deleted on save (Undo available)
  error?: string;
};

// A row of photo tiles plus "Add photos"; the parent owns uploading and state.
export default function GalleryField({
  label, photos, onAdd, onRemove, onUndo, onRetry, onMove, onCaption,
}: {
  label: string; photos: GalleryPhotoView[];
  onAdd: (picked: { jpeg: Blob; previewUrl: string }[]) => void;
  onRemove: (id: string) => void; onUndo: (id: string) => void; onRetry: (id: string) => void;
  onMove: (id: string, delta: -1 | 1) => void; onCaption: (id: string, value: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(false);
  const [message, setMessage] = useState("");

  async function chosen(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-picking the same files
    if (!files.length) return;
    setPreparing(true);
    // One at a time: decoding a dozen phone photos at once can run a phone out of memory.
    const picked: { jpeg: Blob; previewUrl: string }[] = [];
    let skipped = 0;
    for (const file of files) {
      try {
        const jpeg = await renderJpeg(file, { kind: "photo" });
        picked.push({ jpeg, previewUrl: URL.createObjectURL(jpeg) });
      } catch {
        skipped++;
      }
    }
    setPreparing(false);
    setMessage(skippedMessage(skipped));
    if (picked.length) onAdd(picked);
  }

  return (
    <div className={styles.gallery}>
      <span className={styles.label}>{label}</span>
      {photos.length === 0 ? (
        <p className={styles.empty}>No photos yet. Add them after the event.</p>
      ) : (
        <ol className={styles.tiles}>
          {photos.map((ph, i) => (
            <li key={ph.id} className={styles.tile}>
              <img src={ph.src} alt="" className={`${styles.thumb} ${ph.removed ? styles.faded : ""}`} />
              <div className={styles.row}>
                <button type="button" onClick={() => onMove(ph.id, -1)} disabled={i === 0} aria-label="Move earlier">‹</button>
                <button type="button" onClick={() => onMove(ph.id, 1)} disabled={i === photos.length - 1} aria-label="Move later">›</button>
                {ph.removed
                  ? <button type="button" onClick={() => onUndo(ph.id)}>Undo</button>
                  : <button type="button" onClick={() => onRemove(ph.id)} className={styles.danger}>Remove</button>}
              </div>
              <input
                value={ph.caption} placeholder="Caption (optional)" aria-label={`Caption for photo ${i + 1}`}
                disabled={ph.removed} onChange={(e) => onCaption(ph.id, e.target.value)}
              />
              {ph.status === "uploading" && <span className={styles.note}>Uploading…</span>}
              {ph.status === "uploaded" && <span className={styles.badge}>Unsaved</span>}
              {ph.status === "failed" && (
                <span className={styles.note} role="status">
                  {ph.error || "Upload failed — try again"}{" "}
                  <button type="button" onClick={() => onRetry(ph.id)}>Retry</button>
                </span>
              )}
              {ph.removed && <span className={styles.note}>Will be removed when you save</span>}
            </li>
          ))}
        </ol>
      )}
      <div className={styles.addRow}>
        <button type="button" onClick={() => input.current?.click()} disabled={preparing}>
          {preparing ? "Preparing photos…" : "Add photos"}
        </button>
        {message && <span className={styles.note} role="status">{message}</span>}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={chosen} />
    </div>
  );
}
```

- [ ] **Step 2: Create `app/admin/GalleryField.module.css`**

The buttons inherit `.section button` from `ListEditor.module.css`.

```css
.gallery {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ink-muted);
}
.empty {
  margin: 0;
  font-size: 0.85rem;
  color: var(--ink-muted);
}
.tiles {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
}
.tile {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.thumb {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  background: #efe7d6;
  display: block;
}
.faded {
  opacity: 0.35;
}
.row {
  display: flex;
  gap: 0.3rem;
}
.tile input {
  padding: 0.35rem 0.5rem;
  border: 1px solid #d6cdb9;
  border-radius: 6px;
  font: inherit;
  font-size: 0.85rem;
  color: var(--ink);
  background: #fff;
  min-width: 0;
}
.danger {
  color: var(--red);
}
.note {
  font-size: 0.75rem;
  color: var(--ink-muted);
}
.badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: #9a6a00;
}
.addRow {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
```

- [ ] **Step 3: Wire galleries into `ListEditor.tsx`**

1. **Imports:**
   - Add `import GalleryField, { type GalleryPhotoView } from "./GalleryField";`.
   - Change the gallery import to `import { movePhoto, newPhotoId, slotKey, type EditorPhoto } from "@/lib/gallery";`.

2. **`Field.kind`:**

```ts
  kind?: "headshot" | "photo" | "gallery"; // a photo picker, or a multi-photo gallery, instead of a text input
```

3. **Props:** add to `Props<T>` and to the destructured props:

```ts
  galleries?: string[]; // gallery field keys, cleaned on save (lib/gallery.ts cleanPhotos)
```

4. **Gallery handlers:** add them after `undoRemove`:

```ts
  // ── Galleries ──
  // A removed published photo stays in the list with `removed: true` until save;
  // an unsaved upload is dropped outright.

  const photosOf = (it: T, key: string) => (it[key] as EditorPhoto[] | undefined) ?? [];
  function setPhotos(id: string, key: string, fn: (photos: EditorPhoto[]) => EditorPhoto[]) {
    update((prev) => prev.map((it) => (it.id === id ? { ...it, [key]: fn(photosOf(it, key)) } : it)));
  }
  function uploadGalleryPhoto(it: T, key: string, photoId: string, jpeg: Blob, previewUrl: string) {
    return upload(slotKey(it.id, key, photoId), nameOf(it), jpeg, previewUrl, (url) =>
      setPhotos(it.id, key, (ps) => ps.map((ph) => (ph.id === photoId ? { ...ph, src: url } : ph))),
    );
  }
  function addPhotos(it: T, key: string, picked: { jpeg: Blob; previewUrl: string }[]) {
    const now = Date.now();
    const ids = picked.map((_, i) => newPhotoId(now, i));
    setPhotos(it.id, key, (ps) => [...ps, ...ids.map((id) => ({ id, src: "", caption: "" }))]);
    picked.forEach((p, i) => void uploadGalleryPhoto(it, key, ids[i], p.jpeg, p.previewUrl));
  }
  function removeGalleryPhoto(it: T, key: string, photo: EditorPhoto) {
    const slot = slotKey(it.id, key, photo.id);
    if (pending[slot]) {
      bumpGen(slot);
      dropPending(slot);
      setPhotos(it.id, key, (ps) => ps.filter((ph) => ph.id !== photo.id));
      return;
    }
    markForDelete(photo.src);
    setPhotos(it.id, key, (ps) => ps.map((ph) => (ph.id === photo.id ? { ...ph, removed: true } : ph)));
  }
  function undoGalleryRemove(it: T, key: string, photo: EditorPhoto) {
    unmarkForDelete(photo.src);
    setPhotos(it.id, key, (ps) => ps.map((ph) => (ph.id === photo.id ? { ...ph, removed: false } : ph)));
  }
  function renderGallery(it: T, f: Field) {
    const photos = photosOf(it, f.key);
    const find = (id: string) => photos.find((ph) => ph.id === id)!;
    const views: GalleryPhotoView[] = photos.map((ph) => {
      const p = pending[slotKey(it.id, f.key, ph.id)];
      return {
        id: ph.id, src: p?.previewUrl ?? ph.src, caption: ph.caption,
        status: p?.status ?? "saved", removed: !!ph.removed, error: p?.error,
      };
    });
    return (
      <GalleryField
        key={f.key} label={f.label} photos={views}
        onAdd={(picked) => addPhotos(it, f.key, picked)}
        onRemove={(id) => removeGalleryPhoto(it, f.key, find(id))}
        onUndo={(id) => undoGalleryRemove(it, f.key, find(id))}
        onRetry={(id) => {
          const p = pending[slotKey(it.id, f.key, id)];
          if (p) void uploadGalleryPhoto(it, f.key, id, p.jpeg, p.previewUrl);
        }}
        onMove={(id, delta) =>
          setPhotos(it.id, f.key, (ps) => movePhoto(ps, ps.findIndex((ph) => ph.id === id), delta))}
        onCaption={(id, value) =>
          setPhotos(it.id, f.key, (ps) => ps.map((ph) => (ph.id === id ? { ...ph, caption: value } : ph)))}
      />
    );
  }
```

5. **`remove(it)`:** replace its first line so gallery photos are marked too:

```ts
    for (const f of fields) {
      if (f.kind === "gallery") photosOf(it, f.key).forEach((ph) => markForDelete(ph.src));
      else if (f.kind) markForDelete(String(originals[slotKey(it.id, f.key)] ?? it[f.key] ?? ""));
    }
```

`markForDelete` ignores non-upload paths. Unsaved uploads that are marked are skipped by the server, because the file doesn't exist on the branch.

6. **`renderCard`:** in the `fields.map`, right after `if (!f.kind) return renderInput(it, f);`, add:

```tsx
            if (f.kind === "gallery") return renderGallery(it, f);
```

7. **`save()`:** pass `galleries` to `prepareItems`:

```ts
      const ready = prepareItems(autoSort(items), { slugs, galleries });
```

8. **`validate`:** it stringifies field values. A gallery field has no `required` or `type`, so it never produces a problem. No change needed.

- [ ] **Step 4: Add the fields to the events admin**

In `app/admin/events/page.tsx`, append to `EVENT_FIELDS` after the RSVP field:

```ts
  { key: "photos", label: "Photos", kind: "gallery" },
  { key: "photoCredit", label: "Photo credit (optional)", placeholder: "e.g. Photos by Jane Doe" },
```

Add `galleries={["photos"]}` to the Events `<ListEditor>` (not Partner events).

- [ ] **Step 5: Static checks**

Run: `npx tsc --noEmit && npx vitest run && npx eslint app/admin`
Expected: tsc clean, tests PASS, and no new eslint errors (`no-img-element` warnings are fine).

- [ ] **Step 6: Browser check of the admin gallery**

**Fixture** (temporary; restore it in Task 7):
- Back up `content/events.json` to the scratchpad.
- Copy three existing JPGs to the upload paths:
  - `public/images/bon-odori-lanterns.jpg` → `public/images/uploads/events/natsumatsuri-summer-picnic-20261009-a001.jpg`
  - `public/images/minoo-bridge.jpg` → `…-a002.jpg`
  - `public/images/kyoto-bookshelf.jpg` → `…-a003.jpg`
- Set the photos of event `e4`:

```json
"photos": [
  { "id": "ph1-0", "src": "/images/uploads/events/natsumatsuri-summer-picnic-20261009-a001.jpg", "caption": "Lanterns at dusk" },
  { "id": "ph1-1", "src": "/images/uploads/events/natsumatsuri-summer-picnic-20261009-a002.jpg", "caption": "" },
  { "id": "ph1-2", "src": "/images/uploads/events/natsumatsuri-summer-picnic-20261009-a003.jpg", "caption": "" }
],
"photoCredit": "Photos by Jane Doe"
```

**Setup:** rebuild and start on port 3100 with the dummy GitHub env. Intercept `/api/upload`: each call returns a unique `{ path: "public/images/uploads/events/natsumatsuri-summer-picnic-20261009-b00N.jpg", sha: "SN" }`. Capture `/api/github` bodies and reply 200 `{ commitUrl: "x", blobShas: {} }`.

Then, on `/admin/events`:
1. Open "Past events" and open the Natsumatsuri card. Three tiles show with "Lanterns at dusk" in the first caption, and the credit field reads "Photos by Jane Doe".
2. Use `DOM.setFileInputFiles` on the gallery's file input with two JPGs and one `.txt` file. Two new tiles appear, and the message reads "1 file isn't a photo we can use. Try a JPG or PNG."
3. Move tile 3 earlier with ‹ and type a caption on tile 2.
4. Remove tile 1 (published). It fades, "Will be removed when you save" and Undo appear, and its caption input is disabled.
5. **Late upload (Review Focus 1):**
   - Hold (don't fulfill) the next `/api/upload` request.
   - Add one more photo, Remove its tile while it's still uploading, then release the request.
   - The tile stays gone, and Save is enabled.
6. Click Save and inspect the captured payload. For event `e4`:
   - `photos` has no `a001` and no `removed` keys, keeps the reordered order, and has the trimmed caption.
   - `uploads` has exactly the two new uploads.
   - `deletes` contains `public/images/uploads/events/natsumatsuri-summer-picnic-20261009-a001.jpg`.
7. Reload. If a beforeunload dialog appears, accept it.
8. Remove tile 1 again, click Undo, and Save. The payload's `deletes` is `[]` and `a001` is still in `photos`.
9. Reload. Remove the whole Natsumatsuri event and Save. `deletes` contains all three `a00N` paths.

Screenshot the open card with tiles (cropped to the card).

- [ ] **Step 7: Checkpoint**

Report the results and the screenshot. If the user says commit (leave the fixture files out):

```bash
git add app/admin/GalleryField.tsx app/admin/GalleryField.module.css app/admin/ListEditor.tsx app/admin/events/page.tsx
git commit -m "feat(admin): add a photo gallery to each event"
```

---

### Task 5: Public gallery and lightbox

**Files:**
- Modify: `next.config.ts`
- Create: `components/Lightbox.tsx`, `components/Lightbox.module.css`
- Create: `components/Gallery.tsx`, `components/Gallery.module.css`
- Modify: `app/events/[slug]/page.tsx`

**Interfaces:**
- Consumes: `EventPhoto`, `JetaaseEvent.photos`, `JetaaseEvent.photoCredit` (Task 1).
- Produces:
  - `<Gallery photos={EventPhoto[]} eventTitle={string} credit={string} />`
  - `<Lightbox photos={LightboxPhoto[]} index={number | null} onIndex={(i) => void} onClose={() => void} />`
  - `type LightboxPhoto = { src: string; alt: string; caption: string }`

- [ ] **Step 1: Configure images**

Replace `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only our own images under /images/ may be resized by next/image.
    localPatterns: [{ pathname: "/images/**", search: "" }],
    qualities: [75], // required list in Next 16
  },
};

export default nextConfig;
```

- [ ] **Step 2: Create `components/Lightbox.tsx`**

```tsx
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
        if (e.target === e.currentTarget) dialog.current?.close(); // backdrop
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
```

- [ ] **Step 3: Create `components/Lightbox.module.css`**

```css
.dialog {
  width: 100vw;
  height: 100dvh;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: rgba(20, 17, 13, 0.94);
  color: #fff;
  touch-action: pan-y pinch-zoom; /* horizontal swipes reach our pointer handlers */
}
.dialog[open] {
  display: flex;
  align-items: center;
  justify-content: center;
}
.dialog::backdrop {
  background: rgba(20, 17, 13, 0.94);
}
.figure {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-width: calc(100vw - 32px);
}
.img {
  max-width: min(100%, calc(100vw - 160px));
  max-height: calc(100dvh - 120px);
  object-fit: contain;
  display: block;
  user-select: none;
}
.caption {
  display: flex;
  gap: 16px;
  align-items: baseline;
  font-size: 15px;
  text-align: center;
}
.count {
  font-family: var(--font-mono);
  font-size: 12px;
  color: #cfc7b8;
}
.nav,
.close {
  position: absolute;
  border: 0;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border-radius: 999px;
  width: 48px;
  height: 48px;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
}
.nav:hover,
.close:hover {
  background: rgba(255, 255, 255, 0.24);
}
.prev {
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
}
.next {
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}
.close {
  top: 16px;
  right: 16px;
  font-size: 20px;
}
@media (max-width: 768px) {
  .img {
    max-width: 100%;
  }
  .prev,
  .next {
    top: auto;
    bottom: 16px;
    transform: none;
  }
}
```

- [ ] **Step 4: Create `components/Gallery.tsx`**

```tsx
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
```

- [ ] **Step 5: Create `components/Gallery.module.css`**

```css
.section {
  margin-top: 48px;
}
.heading {
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: 34px;
  letter-spacing: -0.01em;
  margin: 0 0 20px;
}
.grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.tile {
  position: relative;
  display: block;
  aspect-ratio: 1;
  border-radius: 14px;
  overflow: hidden;
  background: #f4ede0;
}
.img {
  object-fit: cover;
  transition: transform 0.2s;
}
.tile:hover .img {
  transform: scale(1.03);
}
.credit {
  margin: 14px 0 0;
  font-family: var(--font-mono);
  font-size: 12px;
  color: #8a8069;
}
@media (max-width: 768px) {
  .heading {
    font-size: 28px;
  }
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
}
```

- [ ] **Step 6: Render the gallery on the event page**

In `app/events/[slug]/page.tsx`, add `import Gallery from "@/components/Gallery";` and, after the `event.details` block inside `<main>`:

```tsx
        {event.photos.length > 0 && (
          <Gallery photos={event.photos} eventTitle={event.title} credit={event.photoCredit} />
        )}
```

- [ ] **Step 7: Static checks**

Run: `npx tsc --noEmit && npx vitest run && npx eslint components app/events && npm run build`
Expected: everything is clean (the `no-img-element` warning in `Lightbox` is fine), and the build succeeds.

- [ ] **Step 8: Browser check of the public gallery**

Use the Task 4 fixture, reset to its original 3 photos with the backup plus the fixture edit. Rebuild and start on port 3100, then open `/events/natsumatsuri-summer-picnic-2026-08`.

1. **Grid:**
   - At a 1280px viewport: 3 columns of square tiles under the details, and "Photos by Jane Doe" under the grid.
   - Thumbnail requests go to `/_next/image?url=…` and are not the 1600px originals.
2. **Phone grid:** at 390px (CDP device emulation), 2 columns.
3. **Lightbox:**
   - Click tile 1. The dialog opens showing the whole photo, "Lanterns at dusk", and "1 / 3".
   - ArrowRight shows "2 / 3".
   - On "1 / 3", › twice gives "3 / 3", then wraps to "1 / 3".
   - On "1 / 3", ‹ wraps to "3 / 3".
4. **Closing (Review Focus 5):**
   - Esc closes the dialog, `document.documentElement.style.overflow` is `""`, and `document.activeElement` is tile 1's link.
   - Reopen it. A click on the backdrop area outside the image closes it.
   - Reopen it. ✕ closes it.
5. **Swipe (Review Focus 5):** at 390px, dispatch a pointerdown/pointerup pair 120 px apart on the backdrop. The counter advances and the dialog stays open.
6. **No JavaScript:** with JS disabled (`Emulation.setScriptExecutionDisabled`), a tile's `href` is the full image URL.
7. **No gallery:** an event without photos (e.g. `/events/spring-ramen-crawl-2026-04`) has no Photos section.

Screenshot the grid (desktop and phone) and the open lightbox.

- [ ] **Step 9: Checkpoint**

Report the results and the screenshots. If the user says commit:

```bash
git add next.config.ts components/Gallery.tsx components/Gallery.module.css components/Lightbox.tsx components/Lightbox.module.css "app/events/[slug]/page.tsx"
git commit -m "feat(events): show an event's photos as a grid with a lightbox"
```

---

### Task 6: Photo-count badge on past-event cards

**Files:**
- Modify: `components/EventCard.tsx`
- Modify: `components/EventCard.module.css`

**Interfaces:**
- Consumes: `photoCountLabel` (Task 1), `JetaaseEvent.photos`.

- [ ] **Step 1: Add the badge**

In `components/EventCard.tsx`, import `photoCountLabel` from `@/lib/events`. Wrap the poster and add the badge for small cards:

```tsx
  const photos = small ? event.photos.length : 0; // only past ("Looking back") cards show it
  return (
    <Link href={`/events/${event.slug}`} className={`${styles.card} ${small ? styles.small : ""}`}>
      <div className={styles.posterWrap}>
        <Poster event={event} />
        {photos > 0 && <span className={styles.photoBadge}>{photoCountLabel(photos)}</span>}
      </div>
      ...
```

Keep the rest of the card unchanged.

- [ ] **Step 2: Style it**

Append to `components/EventCard.module.css`:

```css
.posterWrap {
  position: relative;
}
.photoBadge {
  position: absolute;
  left: 10px;
  bottom: 10px;
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(35, 31, 26, 0.78);
  color: #fff;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
}
```

- [ ] **Step 3: Static checks and browser check**

Run: `npx tsc --noEmit && npx vitest run && npm run build`, then start on port 3100 with the fixture in place.

On `/events`, the Natsumatsuri card in "Looking back" shows "3 photos" bottom-left on its poster. Other past cards show no badge, and the upcoming cards show none either. Screenshot the Looking back row.

- [ ] **Step 4: Checkpoint**

Report the results and the screenshot. If the user says commit:

```bash
git add components/EventCard.tsx components/EventCard.module.css
git commit -m "feat(events): show a photo count on past event cards"
```

---

### Task 7: Clean up and final verification

- [ ] **Step 1: Remove the fixture**

```bash
cp <scratchpad>/events.json.bak content/events.json
rm public/images/uploads/events/natsumatsuri-summer-picnic-20261009-a00*.jpg
rmdir -p public/images/uploads/events 2>/dev/null || true
git status --short
```

Expected: `content/events.json` matches the Task 1 version, with empty `photos` and `photoCredit` for every event. `git status` shows only the intended source changes, or nothing if everything is committed.

- [ ] **Step 2: Full checks**

Run: `npx vitest run && npx tsc --noEmit && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 3: Checkpoint**

Report to the user:
- what was built, and the screenshots from Tasks 4–6;
- that the branch `event-galleries` is ready to merge into `main` with `--ff-only` when they say so;
- what's left for them: a real phone test of picking several photos at once from the library (iPhone Safari).
