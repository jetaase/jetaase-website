# Past-event photo galleries — design

Status: approved in conversation (2026-10-09), awaiting written-spec review
Part 3 of 3 in the events work: (1) photo upload → (2) events editor + Events/home pages → **(3) past-event photo galleries**.

## Goal

After an event, a board member adds a curated set of photos (about 5–20) to it from `/admin/events`. The event's page at `/events/<slug>` shows them as a grid, and tapping a photo opens a full-screen lightbox.

**Success:** a board member on a phone opens a past event's card, picks 12 photos at once, adds a couple of captions and a photo credit, and clicks Save. About a minute later the event page shows the gallery, and the event's card on `/events` says "12 photos". One save produces one commit and one redeploy.

## Decisions

| Topic | Decision |
| --- | --- |
| Volume | A curated handful, about 5–20 photos per event. Nothing enforces a limit. |
| Storage | Same as posters: `public/images/uploads/events/`, uploaded as unpublished blobs when picked and committed on Save. No new service. |
| Processing | Same as posters: no crop, longest side 1600 px, re-encoded to JPEG in the browser. Any orientation. |
| Where it shows | On `/events/<slug>`, whenever the event has photos. Normally only past events will have any; this isn't enforced. |
| Viewing | Square-cropped thumbnail grid plus a lightbox that shows the whole photo. |
| Extras | Reordering, an optional caption per photo, an optional photo credit per event, and a "N photos" badge on past-event cards. |
| Thumbnails | `next/image` with `sizes`, so the grid loads small versions. The lightbox loads the 1600 px original. |
| Lightbox | Hand-built on the native `<dialog>`. No new dependency. |

## Data

`JetaaseEvent` gains two fields:

```ts
photos: EventPhoto[]; // display order
photoCredit: string;  // "" for none, e.g. "Photos by Jane Doe"

type EventPhoto = {
  id: string;      // "ph" + timestamp (+ index), set when added; stable key for the editor
  src: string;     // public URL under /images/uploads/events/
  caption: string; // "" for none
};
```

- Existing entries in `content/events.json` get `"photos": []` and `"photoCredit": ""`.
- `readEvents()` normalizes a missing `photos` to `[]` and a missing `photoCredit` to `""`, so a hand-edited file without them doesn't crash any page.
- New events start with both empty (`BLANK_EVENT`).

## Admin: the Photos section of an event card

The gallery is a new field kind, `kind: "gallery"`, rendered by a new `app/admin/GalleryField.tsx`. It sits at the bottom of each event card (after RSVP link), labelled **Photos**.

### Layout

- A wrapping row of tiles, one per photo. Each tile has:
  - a thumbnail (square, `object-fit: cover`),
  - **‹** and **›** buttons to move it earlier or later (disabled at the ends),
  - a caption input (placeholder "Caption (optional)"),
  - **Remove**.
- An **Add photos** button after the tiles. Its file input has `multiple` and `accept="image/*"`, so a phone opens the library with multi-select.
- A **Photo credit (optional)** text input under the tiles (placeholder "e.g. Photos by Jane Doe"). This is an ordinary text field placed right after the Photos field.
- With no photos: "No photos yet. Add them after the event." followed by the button.

### Adding

1. Each picked file is rendered to a JPEG in the browser (`renderJpeg(file, { kind: "photo" })`). Files that can't be decoded are skipped. A single message names how many were skipped: "1 file isn't a photo we can use. Try a JPG or PNG."
2. Each photo is appended as a tile immediately, showing the local preview with an **Uploading…** label.
3. Uploads run in parallel, each its own `/api/upload` call with `folder: "events"` and the event title as the name hint.
4. A tile whose upload fails shows "Upload failed — try again" and **Retry**. **Remove** drops it.
5. Save is disabled while any upload is running or has failed, the same rule as posters.

### Removing and undo

- **Unsaved upload:** Remove drops the tile. Its blob is never committed.
- **Published photo:** Remove keeps the tile, faded, with "Will be removed when you save" and **Undo**. Its caption input is disabled. The file is deleted in the Save commit, under the existing safety rules. A faded tile is not written to `events.json`.
- **Deleting the whole event:** marks all of its published photos for deletion, like the poster today.

### Editor state changes (`ListEditor.tsx`)

Upload state is keyed per event today (`pending[itemId]`, `originals[itemId]`, `uploadGen[itemId]`), so an event can only hold one photo in flight. It changes to per-slot keys:

- the poster's slot is `"<itemId>:<fieldKey>"`
- a gallery photo's slot is `"<itemId>:<fieldKey>:<photoId>"`

`pending`, `uploadGen`, and the poster `originals` use these slot keys. `buildSavePayload` doesn't care about the keys: it already commits only the uploads whose URL appears in the saved content, so it works unchanged with many uploads per event.

Gallery photos don't need an `originals` map. A published photo's `src` never changes in place: replacing a photo means removing one and adding another. Undo just clears the removed flag. While editing, a removed published photo stays in the item's `photos` array with a client-only `removed: true` flag. On save, `prepareItems` filters out removed photos and strips the flag.

### Saving

- `photos` is written in tile order, with `id`, `src`, and `caption` (trimmed). Tiles still uploading can't exist at save time, because Save is disabled.
- Commit message is unchanged: `chore(admin): update events`.

## Public pages

### `/events/<slug>`: Photos section

Shown below the details when `photos.length > 0`.

- **Heading:** "Photos", in the same serif style as other section headings on the site.
- **Grid:** 3 columns on desktop, 2 on phones (≤ 768 px), small gap. Square tiles, `object-fit: cover`, rounded like the poster.
  - Each tile is a link to the full image wrapping a `next/image` (`fill`, `sizes="(max-width: 768px) 50vw, 300px"`, lazy). A click opens the lightbox instead.
- **Credit:** `photoCredit` under the grid in the small mono style, if set.
- **Alt text:** the caption, or "Photo N from <event title>".
- **No-JS fallback:** because each tile is a real link, it still works without JavaScript.

`next.config.ts` gains `images.localPatterns` for `/images/**` and `qualities: [75]` (Next 16 requires `qualities`).

### Lightbox (`components/Lightbox.tsx`, client)

- A native `<dialog>` opened with `showModal()`, so it is modal, traps focus, and closes on Esc.
- **Shows:** the full photo, scaled to fit the screen (`object-fit: contain`, dark backdrop), the caption under it if set, and a counter "3 / 12".
- **Controls:**
  - **‹ ›** buttons. They wrap around from the last photo to the first and back.
  - Left and right arrow keys.
  - Horizontal swipe (pointer events, ≥ 50 px threshold).
  - **✕**, Esc, or a click on the backdrop closes it.
- **Focus:** returns to the tile that opened it.
- **Preloading:** the next and previous photos are preloaded, so swiping feels instant.
- **Scroll:** page scroll is locked while open (the `<dialog>` default plus `overflow: hidden` on `<html>`).

### `/events`: badge on past cards

- `EventCard` with `size="small"` shows a small "N photos" badge ("1 photo" when singular) when the event has photos.
- It sits in the poster frame's corner, styled like the existing date labels.
- Upcoming cards don't show it.

## Files

| File | Change |
| --- | --- |
| `lib/events.ts` | `EventPhoto` type, the new `JetaaseEvent` fields, a `photoCountLabel(n)` helper |
| `lib/content.ts` | `readEvents()` normalizes `photos` and `photoCredit` |
| `lib/editor-save.ts` | `prepareItems` drops removed gallery photos, strips client flags, trims captions (the `pending` map is keyed by slot instead of item id; `PendingPhoto` itself is unchanged) |
| `app/admin/ListEditor.tsx` | per-slot upload state; renders `kind: "gallery"` fields with `GalleryField` |
| `app/admin/GalleryField.tsx` + `.module.css` | new: tiles, add/remove/undo/reorder/caption, credit input |
| `app/admin/events/page.tsx` | Photos field, `photos` and `photoCredit` in `BLANK_EVENT` |
| `app/events/[slug]/page.tsx` + css | Photos section |
| `components/Gallery.tsx` + `components/Lightbox.tsx` + css | new: grid and lightbox (both client components; the grid holds the open-photo state) |
| `components/EventCard.tsx` + css | photo-count badge on small cards |
| `next.config.ts` | `images.localPatterns`, `images.qualities` |
| `content/events.json` | add empty `photos` and `photoCredit` to existing events |

## Error handling

| Situation | Behavior |
| --- | --- |
| Some picked files can't be decoded | Those files are skipped. The rest are added, with "N files aren't photos we can use. Try a JPG or PNG." |
| An upload fails | That tile shows the error and Retry. Save stays disabled until it's retried or removed. |
| Login expired during upload | The existing message: "Your login expired. Sign in again in a new tab, then retry." |
| Save conflict | The existing conflict message. Edits stay on screen. |
| `photos` missing from the JSON | Treated as `[]`. |

## Testing

**Unit (vitest):**
- `readEvents` normalization.
- `photoCountLabel`.
- `prepareItems` drops removed photos, strips flags, trims captions, and keeps order.
- `buildSavePayload` with several uploads on one event, plus a poster upload on another, commits exactly the referenced uploads.
- `handleSave` deletion safety: a gallery photo still referenced by `events.json` is not deleted.

**Browser (headless Chrome over CDP, following the usual recipe):**
- **Admin:** add 3 photos at once with `/api/upload` intercepted, reorder, caption, remove one and undo, then save with `/api/github` intercepted. Check the payload's `photos` order, captions, and uploads.
- **Public:** with a temporary `events.json` that has photos (restored afterwards), check the grid at desktop and phone widths, the lightbox open/next/prev/Esc and keyboard behavior, and the badge on `/events`.

## Out of scope

- Bulk download or zip.
- Video.
- Per-photo credits.
- Picking a "cover" photo to replace the poster on past cards.
- Limits on photo count.
- Thumbnails generated at upload time.
