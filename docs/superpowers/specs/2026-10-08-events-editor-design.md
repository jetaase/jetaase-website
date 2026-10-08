# Events editor and event pages — design

Status: approved in conversation (2026-10-08), awaiting written-spec review
Part 2 of 3 in the events work: (1) photo upload ✅ → **(2) events editor + Events/home pages** → (3) past-event photo galleries.

## Goal

Board members add and edit events from `/admin` without touching code. The Events page, each event's own page, and the homepage "Upcoming events" block are built from that data instead of hard-coded placeholders. Events move into "Looking back" on their own once their date passes.

**Success:**
1. A board member adds an event with a poster and an RSVP link, then clicks Save.
2. About a minute later, the event appears as "Next up" on `/events`, on the homepage, and at its own shareable `/events/<slug>` link.
3. The day after the event, it shows under "Looking back" without anyone touching it.

## Decisions

| Topic | Decision |
| --- | --- |
| Storage | Two JSON lists: `content/events.json` (JETAASE events) and `content/partner-events.json` (partner events). Both are edited by the existing `ListEditor`. The leftover `content/events/*.json` samples are deleted. |
| Two kinds of event | JETAASE-hosted events are the main focus: "Next up", the upcoming cards, and "Looking back". Partner events (JETAA USA, consulate, etc.) appear in a smaller "Also happening" list, tagged with the host. |
| Event details | Each JETAASE event has its own page at `/events/<slug>`, so it can be shared and so part 3 can add a gallery there. Partner events have no page; their row links to the host's page. |
| Slugs | Built from the title and month (e.g. `fall-welcome-2026-10`) the first time an event is saved, then never changed, so shared links keep working. A suffix (`-2`, `-3`) keeps slugs unique. |
| Posters | Uploaded with the plain `photo` kind to the `events` folder. Always shown whole (`object-fit: contain` on a tinted panel), never cropped. Optional. Posters are square or vertical (portrait), so every poster area uses a **4:5 portrait frame**: vertical posters fill it, and square ones get thin bands top and bottom. A rare horizontal poster still shows whole, just smaller. (Event *photos* in the part 3 galleries can be any orientation; that's separate.) |
| RSVP | A per-event link, usually a Google Form. Optional; if empty, no RSVP button is shown. |
| Time | Free text (e.g. "2:00–6:00 PM"). No structured start/end times. |
| Add to calendar | Not built. The placeholder button and the "Subscribe to calendar" link are removed. |
| When an event is past | Starting the day after its date, in Eastern time (`America/New_York`). |
| Auto-moving to "Looking back" | The Events page, event pages, and homepage use `export const revalidate = 3600`, so they regenerate in the background about once an hour. No redeploy is needed. Saving in `/admin` still redeploys immediately. |
| Newsletter prompt | "Want the full list? Get the newsletter," linking to `/join`. |
| Admin layout | `/admin` is split into `/admin/events` and `/admin/people`, with a shared tab header. `/admin` redirects to `/admin/events`. |

## Data

### `content/events.json`

An array of:

```ts
type JetaaseEvent = {
  id: string;        // "e<timestamp>", from ListEditor
  order: number;     // written by ListEditor; ignored for display (date order wins)
  slug: string;      // filled on first save, then never changed
  title: string;     // required
  date: string;      // required, "YYYY-MM-DD"
  time: string;      // free text, may be ""
  location: string;  // e.g. "Piedmont Park, Atlanta, GA" or "Online"
  summary: string;   // one line, shown on cards
  details: string;   // longer text for the event page; blank lines separate paragraphs
  poster: string;    // public URL, or "" for none
  rsvpUrl: string;   // "" or an http(s) URL
};
```

### `content/partner-events.json`

An array of:

```ts
type PartnerEvent = {
  id: string;       // "p<timestamp>"
  order: number;
  title: string;    // required
  host: string;     // required, e.g. "JETAA USA", "Consulate General of Japan in Atlanta"
  date: string;     // required, "YYYY-MM-DD"
  time: string;
  location: string;
  link: string;     // "" or an http(s) URL; the row links here when set
};
```

Both paths are added to `EDITABLE_PATHS`. That allows `/api/github` to save them, and the existing "is this photo still referenced?" check for deleting old photos will scan them too.

### Seed content

`events.json` starts with the current placeholder events (Natsumatsuri Summer Picnic, Monthly Nihongo Meetup, Returnee Welcome Home Dinner, Applying to JET: Info Night, and the three "Looking back" events). They get realistic dates around today, no posters, and no RSVP links, so every section has something to show at launch. `partner-events.json` starts with one or two plausible placeholder rows. The board replaces all of these from `/admin`.

## Public pages

### Shared logic: `lib/events.ts`

- **Types:** `JetaaseEvent` and `PartnerEvent` (above).
- **`todayInEastern(now: Date): string`:** today's date in `America/New_York`, as `YYYY-MM-DD`.
- **`splitEvents(events, today)` → `{ next, upcoming, past }`**
  - `next`: the soonest event dated today or later.
  - `upcoming`: the rest of today-or-later events, soonest first.
  - `past`: events dated before today, newest first.
  - Events with an invalid date are left out.
- **`upcomingPartners(partners, today)`:** partner events dated today or later, soonest first.
- **`makeSlug(title, date, taken: Set<string>)`:** slugifies the title (reusing `slugify` from `lib/uploads.ts`), appends `-YYYY-MM`, and adds `-2`, `-3`, … if the slug is already taken.
- **`formatEventDate(date)`:** the display formats the cards and pages need, e.g. `SAT · OCT 03` and `Saturday, October 3, 2026`. Dates are formatted without converting time zones, so an event never shows as the day before.

`lib/content.ts` gains `readEvents()`, `readPartnerEvents()`, `EVENTS_PATH`, and `PARTNERS_PATH`.

### Events page: `/events`

Top to bottom:

1. **Hero:** unchanged except the subtitle, which becomes "Picnics, meetups, welcome dinners, and info nights across the Southeast."
2. **Next up:** the `next` event, shown large.
   - Poster on the left in a 4:5 frame, shown whole on a tinted panel, with the "NEXT UP" badge. The poster column is the narrower one (about 2 of 5 columns), so a tall poster doesn't make the block huge.
   - Date and time, title, location, and summary on the right.
   - Two buttons: **RSVP** (only if `rsvpUrl` is set; opens in a new tab) and **Details →** (links to the event page).
   - **Empty state** (no upcoming events): "Nothing on the calendar yet. Get the newsletter to hear first," linking to `/join`.
3. **More upcoming:** the `upcoming` events as `EventCard`s (poster, `OCT 03 · LOCATION`, title, summary). The whole card links to the event page. Hidden if empty.
4. **Also happening:** upcoming partner events in a compact list. Each row shows the date, title, a host tag, and the location, and links to `link` in a new tab if one is set. Hidden if empty.
5. **Newsletter prompt:** "Want the full list? Get the newsletter →", linking to `/join`. Always shown.
6. **Looking back:** the 6 most recent `past` events as smaller cards (poster, `JUN 2026 · LOCATION`, title), each linking to its event page. The existing "See more on Instagram →" link stays. Hidden if there are no past events.
7. **Culture band** and **"Have an event idea?"**: unchanged.

The static details-modal markup and its CSS are removed.

### Event page: `/events/[slug]`

- `generateStaticParams` returns every slug in `events.json`, and `revalidate = 3600`.
- An unknown slug calls `notFound()`.
- **Layout:**
  - Header, then a two-column block: the poster in a 4:5 frame, shown whole on the left (stacked on top on phones, capped in height so the title is still near the top of the screen).
  - On the right: the full date (`Saturday, October 3, 2026`), time, title, location, and **RSVP**.
  - Below the block: `details`, split into paragraphs on blank lines and rendered as plain text, so no HTML is injected.
  - A "← All events" link back to `/events`.
- **Once past:** the RSVP button is replaced by "This event has passed." Part 3 adds a gallery to this page.
- **Metadata:**
  - `generateMetadata` sets the page title (`<title> · JETAASE Events`) and the description (the summary).
  - The poster is used as the Open Graph image, so shared links show a preview.

### Homepage "Upcoming events"

- Shows `next` plus the first 2 of `upcoming` (up to 3 cards), using the same `EventCard`.
- "See all events →" stays.
- Empty state: the same newsletter line as on the Events page.
- `revalidate = 3600` on the homepage.

### `components/EventCard.tsx`

- **Shows:** poster area (4:5 frame, whole image on a tinted panel; with no poster, a tinted panel showing the large day and month), date line, title, and summary.
- **Props:** the event plus `size: "default" | "small"`. Small is used for "Looking back".
- **Behavior:** the whole card is a link to `/events/<slug>`.
- **Used by:** the homepage and the Events page.

## Admin

### Routes

| Route | Contents |
| --- | --- |
| `app/admin/layout.tsx` | Checks the session. If signed out, renders the existing login screen instead of the page. If signed in, renders the "JETAASE Admin" heading, the intro line, and two tabs: **Events · People**. |
| `app/admin/page.tsx` | `redirect("/admin/events")`. |
| `app/admin/events/page.tsx` | The **Events** and **Partner events** editors. |
| `app/admin/people/page.tsx` | The existing **Officers** and **Subchapter representatives** editors, moved over unchanged. |

**Tab links:**
- The tabs are plain `<a>` elements, not `next/link`. A full page load triggers the existing "unsaved changes" warning, while client-side navigation would silently lose unsaved edits.
- The current tab is marked with `aria-current="page"`. The layout doesn't know the path, so a small client component reads it with `usePathname`.

**Login:** `LoginForm` calls `router.refresh()` after signing in, which re-renders the layout, so login works the same on both pages.

### Events editor fields

| Field key | Label | Input |
| --- | --- | --- |
| `title` | Event name | text, required |
| `date` | Date | `type: "date"`, required |
| `time` | Time | text, placeholder "e.g. 2:00–6:00 PM" |
| `location` | Location | text, placeholder "e.g. Piedmont Park, Atlanta, GA or Online" |
| `summary` | Short summary | text, placeholder "One line for the event card" |
| `details` | Full details | `type: "textarea"`, hint "Leave a blank line between paragraphs" |
| `poster` | Poster | `kind: "photo"` |
| `rsvpUrl` | RSVP link (optional) | `type: "url"`, placeholder "e.g. a Google Form link" |

- `itemLabel: "event"`, `idPrefix: "e"`, `uploadFolder: "events"`.
- Commit message: `chore(admin): update events`.
- New events start with today's date and empty strings everywhere else, including `poster: ""`.

### Partner events editor fields

`title` (Event name, required), `host` (Hosted by, required, placeholder "e.g. JETAA USA"), `date` (required), `time`, `location`, `link` (`type: "url"`, label "Event link (optional)").

- `itemLabel: "partner event"`, `idPrefix: "p"`, no photo fields.
- Commit message: `chore(admin): update partner events`.

### `ListEditor` changes

All are optional props or field options, so the Officers and Reps editors behave exactly as before.

**`Field` additions**
- `type?: "date" | "url" | "textarea"`: renders `<input type="date">`, `<input type="url" inputMode="url">`, or `<textarea rows={6}>`.
- `required?: boolean`: adds a "required" marker to the label and is enforced by `validate` (below).
- `hint?: string`: small helper text under the input.

**`byDate?: boolean` prop.** When set:
- Items are shown sorted by date, soonest first. Up/down buttons are hidden.
- Items dated before today are grouped under a collapsed **"Past events (N)"** toggle, closed by default, at the bottom of the list.
  - A past event with a validation error, or one the editor just changed the date on, stays visible. Editing never makes a card jump into the closed group mid-edit. Grouping is worked out on load and after each save, not on every keystroke.
- Saved order in the file follows the date sort.

**`slugs?: boolean` prop.** When set, any item without a `slug` gets one from `makeSlug` when the save payload is built. Slugs already taken by other items count as taken. Existing slugs are never changed.

**Photo fields with no placeholder.** `PhotoField` already handles empty values through `view.src`. With `kind: "photo"`, "Remove" sets the value to `""` instead of the headshot placeholder, and the preview shows an empty "No poster" panel. (Today `PLACEHOLDER` is hard-coded in `ListEditor`. It becomes "headshot → placeholder image, photo → empty".)

**Photo previews must not crop.** Posters are square or vertical flyers, unlike headshots. `PhotoField` currently draws a circular thumbnail. For `kind: "photo"` it draws a 4:5 portrait thumbnail with `object-fit: contain`.

### Validation: `lib/editor-save.ts`

`validate(fields, items, itemLabel): string | null` returns the first problem as a plain sentence, or `null` if there are none:

- Required field empty → `Event 2 ("Fall Welcome"): add a date.` (uses the item's title if it has one)
- `type: "url"` value not empty and not starting with `http://` or `https://` → `Event 2 ("Fall Welcome"): the RSVP link should start with https://`
- `type: "date"` value not a real `YYYY-MM-DD` date → `…: pick a date.`

`save()` calls `validate` first. If it returns a message, it shows `Error: <message>` in the status line and sends nothing.

## Error handling and edge cases

- **No poster:** cards and the Next up block show a tinted panel with the day and month. Nothing looks broken.
- **Invalid date in the JSON** (e.g. hand-edited): `splitEvents` skips that event, and `generateStaticParams` still includes it so its page renders. The page doesn't crash.
- **No RSVP link:** no RSVP button.
- **Duplicate titles in the same month:** handled by the slug suffix.
- **Renaming an event after it's published:** the slug stays the same, so old links still work. (A noticeably mismatched slug is acceptable.)
- **Deleting an event:** its page 404s after the next deploy. Its poster is deleted in the same commit, the same way removed officer photos are.
- **Hourly regeneration on Vercel:** the pages read the content with `fs`, and the admin already does this at runtime on Vercel. Verify after deploy that `/events` regenerates (check the `x-vercel-cache` header and the generated time). If file tracing ever leaves out `content/`, switch the readers to static `import` of the JSON.

## Out of scope

- Add to calendar, `.ics` files, a calendar subscription.
- Galleries and past-event details beyond what is listed above (part 3).
- Search or filtering on the Events page.
- The deferred photo-upload minors (broken preview until redeploy, unreleased object URLs, 4-hex suffix collisions, crop dialog focus). These stay deferred unless they get in the way.

## Testing

**Unit tests (Vitest)**
- `lib/events.test.ts`:
  - `todayInEastern` just before and after midnight Eastern, including across the DST change
  - `splitEvents`: an event today counts as upcoming, yesterday's as past, invalid dates are skipped, sort orders are correct, and `next` is undefined when there are no upcoming events
  - `makeSlug`: format, collisions, accents and punctuation
  - `formatEventDate`: no off-by-one day
- `lib/editor-save.test.ts`:
  - `validate`: each rule, the message wording, and items that pass
  - Payload building: slugs filled in only where missing, and date-sorted order

**Visual check (headless Chrome over CDP, per the usual recipe)**
- `/events` with next, upcoming, partner, and past events, with a vertical poster, a square poster, and one horizontal image (to confirm it still shows whole), at desktop and phone widths.
- `/events` with no upcoming events (empty state).
- An event page, upcoming and past.
- The homepage events block.
- The admin pages, at desktop and phone widths:
  - `/admin/events` and `/admin/people`
  - the tab switch and its unsaved-changes warning
  - the date sort and the collapsed past group
  - a validation error message
  - adding a poster
- `/api/upload` and `/api/github` are intercepted with CDP Fetch, so nothing is committed to `main`.

**Build:** `npm run build` succeeds, and the event pages are listed as ISR with a 1h revalidate.
