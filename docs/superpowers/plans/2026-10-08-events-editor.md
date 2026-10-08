# Events Editor and Event Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Board members edit JETAASE and partner events in `/admin/events`. The Events page, a page per event, and the homepage "Upcoming events" block are built from that data. Events move into "Looking back" on their own once their date passes.

**Architecture:**
- Events live in two JSON files under `content/`, edited by the existing generic `ListEditor`. `ListEditor` gains date, URL, and textarea inputs, validation, date sorting, a collapsed past group, and slug assignment.
- Pure date and slug logic lives in a browser-safe `lib/events.ts`, shared by the admin and the public pages.
- The public pages read the JSON with `fs` at render time and use `export const revalidate = 3600`, so the past/upcoming split refreshes about hourly with no deploy.

**Tech Stack:** Next.js 16 App Router (read `node_modules/next/dist/docs/` before using an API you're unsure of), React 19, CSS Modules, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-08-events-editor-design.md`

## Global Constraints

- **Commits:** do not commit or push unless the user explicitly asks. Each "Checkpoint" step means: stop, run the checks listed, and report. Commit with the given message only if the user has said to commit.
- **Testing saves:** never save from `/admin` against the real repo. In browser checks, intercept `/api/upload` and `/api/github` with CDP Fetch.
- **Time zone:** "today" is always the date in `America/New_York`, formatted `YYYY-MM-DD`. An event is past starting the day after its date.
- **Revalidation:** `export const revalidate = 3600` on `app/page.tsx`, `app/events/page.tsx`, and `app/events/[slug]/page.tsx`.
- **Posters:** always shown whole (`object-fit: contain`), never cropped, inside a 4:5 portrait frame on a `#f4ede0` tinted panel. Uploaded with `kind: "photo"` to folder `events`.
- **Newsletter prompt:** copy is "Want the full list? Get the newsletter →", linking to `/join`. Empty-state copy is "Nothing on the calendar yet. Get the newsletter to hear first."
- **Removed features:** do not build "Add to calendar", `.ics`, or a calendar subscription. Remove the existing placeholder buttons and links for them.
- **Browser-safe libraries:** `lib/events.ts` and `lib/editor-save.ts` ship to the browser. No Node-only imports in either.
- **Existing editors:** the Officers and Subchapter-reps editors must behave exactly as before. All `ListEditor` additions are optional props or optional field settings.
- **Copy style:** plain, friendly sentences for non-technical board members. No jargon in admin messages.

## Review Focus

1. **Midnight Eastern versus UTC.** Between 8 pm and midnight Eastern, UTC is already "tomorrow". An event dated today must still show as upcoming then. Pinned in Task 1 (`todayInEastern` tests at 03:59Z and 04:00Z).
2. **Displaying `YYYY-MM-DD` dates.** Parsing `"2026-10-03"` with `new Date()` and formatting in local time shows Oct 2 in US time zones. Every display format must read Oct 3. Pinned in Task 1 (`formatEventDate` tests).
3. **Renaming a published event.** The slug must not change, or shared links break. Pinned in Task 3 (`prepareItems` keeps existing slugs) and Task 1 (`assignSlugs`).
4. **Saving an event with a missing date or a non-http RSVP link.** Save must be refused with a sentence naming the event and the problem, not a broken page later. Pinned in Task 3 (`validate` tests). Task 4 also opens the past group and highlights the card if the problem is there.
5. **A hand-edited `events.json` with a bad date.** The pages must not crash. The event is skipped from the lists and its page still renders. Pinned in Task 1 (`splitEvents` skips invalid dates) and Task 8 (the page handles `isValidDate` being false).

---

## File Map

| File | Responsibility |
| --- | --- |
| `lib/events.ts` (new) | Event types and pure date and slug logic: `isValidDate`, `todayInEastern`, `splitEvents`, `upcomingPartners`, `makeSlug`, `assignSlugs`, `formatEventDate`, `dateParts`, `toParagraphs` |
| `lib/events.test.ts` (new) | Tests for the above |
| `lib/content.ts` | Adds `EVENTS_PATH`, `PARTNERS_PATH`, `readEvents()`, `readPartnerEvents()`, and extends `EDITABLE_PATHS` |
| `lib/content.test.ts` | Tests the new readers against the seed files |
| `content/events.json`, `content/partner-events.json` (new) | Seed data |
| `content/events/` | Deleted |
| `lib/editor-save.ts` | Adds `validate` and `prepareItems` |
| `lib/editor-save.test.ts` | Tests for the above |
| `app/admin/ListEditor.tsx` + `.module.css` | Field `type`, `required`, and `hint`; `byDate` and `slugs` props; validation on save; empty photo for `kind: "photo"` |
| `app/admin/PhotoField.tsx` + `.module.css` | 4:5 contain preview and an empty "No poster" state for `kind: "photo"` |
| `app/admin/layout.tsx` (new) | Login gate, heading, and tabs |
| `app/admin/AdminTabs.tsx` + `.module.css` (new) | Tab links with `aria-current` |
| `app/admin/page.tsx` | Redirects to `/admin/events` |
| `app/admin/people/page.tsx` (new) | Officers and Reps editors (moved) |
| `app/admin/events/page.tsx` (new) | Events and Partner events editors |
| `components/Poster.tsx` + `.module.css` (new) | 4:5 poster frame, with a date panel when there's no poster |
| `components/EventCard.tsx` + `.module.css` (new) | Linked event card (`default` and `small` sizes) |
| `components/NewsletterPrompt.tsx` + `.module.css` (new) | The "Get the newsletter" line, and the empty-state variant |
| `app/page.tsx` + `page.module.css` | Homepage events block built from data |
| `app/events/page.tsx` + `page.module.css` | Events page built from data, with the modal removed |
| `app/events/[slug]/page.tsx` + `page.module.css` (new) | Event page |
| `app/layout.tsx` | `metadataBase`, needed for Open Graph poster URLs |

---

### Task 1: Event types and date/slug logic (`lib/events.ts`)

**Files:**
- Create: `lib/events.ts`
- Test: `lib/events.test.ts`

**Interfaces:**
- Consumes: `slugify(nameHint: string): string` from `lib/uploads.ts`. It returns `"photo"` for input with no letters or digits.
- Produces:
  - `type JetaaseEvent = { id: string; order: number; slug: string; title: string; date: string; time: string; location: string; summary: string; details: string; poster: string; rsvpUrl: string }`
  - `type PartnerEvent = { id: string; order: number; title: string; host: string; date: string; time: string; location: string; link: string }`
  - `isValidDate(date: string): boolean`
  - `todayInEastern(now: Date): string`
  - `splitEvents<T extends { date: string }>(events: T[], today: string): { next: T | undefined; upcoming: T[]; past: T[] }`
  - `upcomingPartners<T extends { date: string }>(partners: T[], today: string): T[]`
  - `makeSlug(title: string, date: string, taken: Set<string>): string`
  - `assignSlugs<T extends Record<string, unknown>>(items: T[]): T[]`
  - `formatEventDate(date: string, style: "weekday" | "day" | "month" | "long"): string`
  - `dateParts(date: string): { month: string; day: string }`
  - `toParagraphs(text: string): string[]`

- [ ] **Step 1: Write the failing tests**

Create `lib/events.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  isValidDate, todayInEastern, splitEvents, upcomingPartners,
  makeSlug, assignSlugs, formatEventDate, dateParts, toParagraphs,
} from "./events";

describe("isValidDate", () => {
  it("accepts real YYYY-MM-DD dates", () => {
    expect(isValidDate("2026-10-03")).toBe(true);
    expect(isValidDate("2028-02-29")).toBe(true);
  });
  it("rejects malformed or impossible dates", () => {
    for (const d of ["", "2026-1-3", "10/03/2026", "2026-02-30", "2026-13-01", "nope"]) {
      expect(isValidDate(d)).toBe(false);
    }
  });
});

describe("todayInEastern", () => {
  it("is still yesterday in Eastern late in the evening (EDT, UTC-4)", () => {
    expect(todayInEastern(new Date("2026-10-09T03:59:00Z"))).toBe("2026-10-08");
    expect(todayInEastern(new Date("2026-10-09T04:00:00Z"))).toBe("2026-10-09");
  });
  it("follows standard time in winter (EST, UTC-5)", () => {
    expect(todayInEastern(new Date("2026-12-01T04:59:00Z"))).toBe("2026-11-30");
    expect(todayInEastern(new Date("2026-12-01T05:00:00Z"))).toBe("2026-12-01");
  });
});

describe("splitEvents", () => {
  const e = (id: string, date: string) => ({ id, date });
  const today = "2026-10-08";

  it("treats an event today as upcoming and yesterday's as past", () => {
    const r = splitEvents([e("y", "2026-10-07"), e("t", "2026-10-08")], today);
    expect(r.next?.id).toBe("t");
    expect(r.past.map((x) => x.id)).toEqual(["y"]);
  });
  it("sorts upcoming soonest first and past newest first", () => {
    const r = splitEvents(
      [e("a", "2026-12-01"), e("b", "2026-01-01"), e("c", "2026-10-20"), e("d", "2026-06-01"), e("f", "2026-11-01")],
      today,
    );
    expect(r.next?.id).toBe("c");
    expect(r.upcoming.map((x) => x.id)).toEqual(["f", "a"]);
    expect(r.past.map((x) => x.id)).toEqual(["d", "b"]);
  });
  it("skips events with invalid dates", () => {
    const r = splitEvents([e("bad", "soon"), e("ok", "2026-10-09")], today);
    expect(r.next?.id).toBe("ok");
    expect(r.upcoming).toEqual([]);
    expect(r.past).toEqual([]);
  });
  it("has no next event when nothing is upcoming", () => {
    const r = splitEvents([e("old", "2025-01-01")], today);
    expect(r.next).toBeUndefined();
    expect(r.upcoming).toEqual([]);
  });
});

describe("upcomingPartners", () => {
  it("keeps today and later, soonest first, skipping invalid dates", () => {
    const r = upcomingPartners(
      [{ id: "1", date: "2026-11-01" }, { id: "2", date: "2026-10-08" }, { id: "3", date: "2026-10-07" }, { id: "4", date: "x" }],
      "2026-10-08",
    );
    expect(r.map((x) => x.id)).toEqual(["2", "1"]);
  });
});

describe("makeSlug", () => {
  it("joins the slugified title and the month", () => {
    expect(makeSlug("Fall Welcome!", "2026-10-03", new Set())).toBe("fall-welcome-2026-10");
  });
  it("strips accents and punctuation", () => {
    expect(makeSlug("Café Night: Ōsaka Edition", "2026-11-12", new Set())).toBe("cafe-night-osaka-edition-2026-11");
  });
  it("adds -2, -3 when the slug is taken", () => {
    const taken = new Set(["meetup-2026-10", "meetup-2026-10-2"]);
    expect(makeSlug("Meetup", "2026-10-01", taken)).toBe("meetup-2026-10-3");
  });
  it("falls back to 'event' for a blank title and leaves out an invalid date", () => {
    expect(makeSlug("  ", "", new Set())).toBe("event");
  });
});

describe("assignSlugs", () => {
  it("fills in only missing slugs and never changes existing ones", () => {
    const items = [
      { id: "1", title: "Renamed Event", date: "2026-10-03", slug: "fall-welcome-2026-10" },
      { id: "2", title: "Fall Welcome", date: "2026-10-20", slug: "" },
      { id: "3", title: "Fall Welcome", date: "2026-10-25" },
    ];
    expect(assignSlugs(items).map((i) => i.slug)).toEqual([
      "fall-welcome-2026-10", "fall-welcome-2026-10-2", "fall-welcome-2026-10-3",
    ]);
  });
  it("does not modify the input array", () => {
    const items = [{ id: "1", title: "A", date: "2026-10-03" }];
    assignSlugs(items);
    expect("slug" in items[0]).toBe(false);
  });
});

describe("formatEventDate", () => {
  // 2026-10-03 is a Saturday. Every style must show the 3rd, never the 2nd.
  it("formats without shifting the day", () => {
    expect(formatEventDate("2026-10-03", "weekday")).toBe("SAT · OCT 03");
    expect(formatEventDate("2026-10-03", "day")).toBe("OCT 03");
    expect(formatEventDate("2026-06-01", "month")).toBe("JUN 2026");
    expect(formatEventDate("2026-10-03", "long")).toBe("Saturday, October 3, 2026");
  });
  it("returns an empty string for an invalid date", () => {
    expect(formatEventDate("soon", "long")).toBe("");
  });
});

describe("dateParts", () => {
  it("gives the short month and day number", () => {
    expect(dateParts("2026-10-03")).toEqual({ month: "OCT", day: "3" });
    expect(dateParts("bad")).toEqual({ month: "", day: "" });
  });
});

describe("toParagraphs", () => {
  it("splits on blank lines and drops empty pieces", () => {
    expect(toParagraphs("One\nstill one\n\n\n  Two  \n \nThree")).toEqual(["One\nstill one", "Two", "Three"]);
    expect(toParagraphs("   ")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/events.test.ts`
Expected: FAIL, "Failed to resolve import "./events"".

- [ ] **Step 3: Implement `lib/events.ts`**

```ts
// Event data plus the date and slug logic shared by the public pages and the
// admin. Keep this file free of Node-only imports; it ships to the browser.
import { slugify } from "./uploads";

export type JetaaseEvent = {
  id: string; order: number;
  slug: string; // set on first save, never changed, so shared links keep working
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // free text, e.g. "2:00–6:00 PM"
  location: string; summary: string;
  details: string; // blank lines separate paragraphs
  poster: string; // public URL, or "" for none
  rsvpUrl: string; // "" or an http(s) URL
};

export type PartnerEvent = {
  id: string; order: number;
  title: string; host: string;
  date: string; time: string; location: string;
  link: string; // "" or an http(s) URL
};

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidDate(date: string): boolean {
  const m = DATE_RE.exec(date);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

// Today's date where the events happen. en-CA formats as YYYY-MM-DD.
export function todayInEastern(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

const soonestFirst = (a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date);

// An event stays upcoming through its own date; it's past from the next day.
export function splitEvents<T extends { date: string }>(events: T[], today: string) {
  const valid = events.filter((e) => isValidDate(e.date));
  const ahead = valid.filter((e) => e.date >= today).sort(soonestFirst);
  const past = valid.filter((e) => e.date < today).sort((a, b) => soonestFirst(b, a));
  return { next: ahead[0] as T | undefined, upcoming: ahead.slice(1), past };
}

export function upcomingPartners<T extends { date: string }>(partners: T[], today: string): T[] {
  return partners.filter((p) => isValidDate(p.date) && p.date >= today).sort(soonestFirst);
}

export function makeSlug(title: string, date: string, taken: Set<string>): string {
  const name = title.trim() ? slugify(title) : "event";
  const base = isValidDate(date) ? `${name}-${date.slice(0, 7)}` : name;
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

// Gives every item without a slug a unique one. Existing slugs never change.
export function assignSlugs<T extends Record<string, unknown>>(items: T[]): T[] {
  const taken = new Set(items.map((it) => String(it.slug ?? "")).filter(Boolean));
  return items.map((it) => {
    if (it.slug) return it;
    const slug = makeSlug(String(it.title ?? ""), String(it.date ?? ""), taken);
    taken.add(slug);
    return { ...it, slug };
  });
}

// Formats in UTC from a UTC-midnight date, so the day never shifts.
function fmt(date: string, opts: Intl.DateTimeFormatOptions): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatEventDate(date: string, style: "weekday" | "day" | "month" | "long"): string {
  if (!isValidDate(date)) return "";
  const mon = fmt(date, { month: "short" });
  const dd = fmt(date, { day: "2-digit" });
  switch (style) {
    case "weekday": return `${fmt(date, { weekday: "short" })} · ${mon} ${dd}`.toUpperCase();
    case "day": return `${mon} ${dd}`.toUpperCase();
    case "month": return `${mon} ${fmt(date, { year: "numeric" })}`.toUpperCase();
    case "long": return fmt(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }
}

export function dateParts(date: string): { month: string; day: string } {
  if (!isValidDate(date)) return { month: "", day: "" };
  return { month: fmt(date, { month: "short" }).toUpperCase(), day: fmt(date, { day: "numeric" }) };
}

export function toParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/events.test.ts`
Expected: PASS (all tests). If a `formatEventDate` assertion differs only in the separator, check that you used `" · "` (U+00B7 with spaces).

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all pass. Suggested commit: `feat(events): event types and date/slug helpers`.

---

### Task 2: Seed content and readers

**Files:**
- Create: `content/events.json`, `content/partner-events.json`
- Delete: `content/events/2026-fall-welcome.json`, `content/events/2026-summer-social.json` (the whole `content/events/` directory)
- Modify: `lib/content.ts`
- Test: `lib/content.test.ts`

**Interfaces:**
- Consumes: `JetaaseEvent`, `PartnerEvent`, and `isValidDate` from `lib/events.ts`.
- Produces: `EVENTS_PATH = "content/events.json"`, `PARTNERS_PATH = "content/partner-events.json"`, `readEvents(): JetaaseEvent[]`, `readPartnerEvents(): PartnerEvent[]`, and `EDITABLE_PATHS` including both new paths.

- [ ] **Step 1: Write the failing tests**

Append to `lib/content.test.ts`. Also change its import line to `import { readBoard, readReps, readEvents, readPartnerEvents, EDITABLE_PATHS } from "./content";` and add `import { isValidDate } from "./events";`.

```ts
describe("readEvents", () => {
  it("returns events with valid dates and unique slugs", () => {
    const events = readEvents();
    expect(events.length).toBeGreaterThanOrEqual(1);
    for (const e of events) {
      expect(e.id && e.title && e.slug).toBeTruthy();
      expect(isValidDate(e.date)).toBe(true);
      expect(typeof e.poster).toBe("string");
      expect(typeof e.rsvpUrl).toBe("string");
    }
    const slugs = events.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("readPartnerEvents", () => {
  it("returns partner events with a host and a valid date", () => {
    for (const p of readPartnerEvents()) {
      expect(p.id && p.title && p.host).toBeTruthy();
      expect(isValidDate(p.date)).toBe(true);
    }
  });
});

describe("EDITABLE_PATHS", () => {
  it("lets the admin save both event files", () => {
    expect(EDITABLE_PATHS).toEqual(expect.arrayContaining(["content/events.json", "content/partner-events.json"]));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/content.test.ts`
Expected: FAIL, `readEvents` is not exported.

- [ ] **Step 3: Create the seed files and delete the old samples**

Run: `git rm -r content/events`

Create `content/events.json`. These placeholders stand in until the board adds real events. Dates are relative to 2026-10-08: four upcoming and four past.

```json
[
  {
    "id": "e1",
    "slug": "new-year-mochitsuki-2026-01",
    "title": "New Year Mochitsuki",
    "date": "2026-01-10",
    "time": "11:00 AM – 2:00 PM",
    "location": "Charlotte, NC",
    "summary": "Pounding mochi together to ring in the new year.",
    "details": "Our New Year tradition: mochi pounding, zōni, and catching up after the holidays.",
    "poster": "",
    "rsvpUrl": "",
    "order": 1
  },
  {
    "id": "e2",
    "slug": "spring-ramen-crawl-2026-04",
    "title": "Spring Ramen Crawl",
    "date": "2026-04-18",
    "time": "6:00 PM",
    "location": "Greenville, SC",
    "summary": "Three shops, one night, a lot of noodles.",
    "details": "We visited three of Greenville's ramen shops in one evening.",
    "poster": "",
    "rsvpUrl": "",
    "order": 2
  },
  {
    "id": "e3",
    "slug": "hanami-riverside-walk-2026-06",
    "title": "Hanami Riverside Walk",
    "date": "2026-06-06",
    "time": "10:00 AM",
    "location": "Savannah, GA",
    "summary": "A slow morning walk along the river.",
    "details": "A relaxed walk along the Savannah riverfront, followed by lunch.",
    "poster": "",
    "rsvpUrl": "",
    "order": 3
  },
  {
    "id": "e4",
    "slug": "natsumatsuri-summer-picnic-2026-08",
    "title": "Natsumatsuri Summer Picnic",
    "date": "2026-08-09",
    "time": "2:00 – 6:00 PM",
    "location": "Piedmont Park, Atlanta, GA",
    "summary": "Food, games, and reunions in the park.",
    "details": "Our biggest reunion of the year. Grills going, games on the lawn, and the whole Southeast JET family in one place.\n\nBring the family. Kids and non-members are welcome.",
    "poster": "",
    "rsvpUrl": "",
    "order": 4
  },
  {
    "id": "e5",
    "slug": "applying-to-jet-info-night-2026-10",
    "title": "Applying to JET: Info Night",
    "date": "2026-10-24",
    "time": "8:00 PM",
    "location": "Online",
    "summary": "For prospective applicants, from alumni.",
    "details": "Thinking about applying to JET? Alumni walk through the application, the interview, and what life on the program is really like.\n\nBring your questions.",
    "poster": "",
    "rsvpUrl": "",
    "order": 5
  },
  {
    "id": "e6",
    "slug": "monthly-nihongo-meetup-2026-11",
    "title": "Monthly Nihongo Meetup",
    "date": "2026-11-12",
    "time": "6:30 PM",
    "location": "Charlotte, NC",
    "summary": "Japanese conversation practice, all levels welcome.",
    "details": "Practice your Japanese over drinks. Every level is welcome, from beginners to near-native.",
    "poster": "",
    "rsvpUrl": "",
    "order": 6
  },
  {
    "id": "e7",
    "slug": "returnee-welcome-home-dinner-2026-11",
    "title": "Returnee Welcome Home Dinner",
    "date": "2026-11-21",
    "time": "7:00 PM",
    "location": "Raleigh, NC",
    "summary": "Greeting the Southeast's newest returnees.",
    "details": "Just back from Japan? Join us for an izakaya-style dinner to welcome this year's returnees home.",
    "poster": "",
    "rsvpUrl": "",
    "order": 7
  },
  {
    "id": "e8",
    "slug": "bonenkai-year-end-party-2026-12",
    "title": "Bōnenkai Year-End Party",
    "date": "2026-12-12",
    "time": "7:00 PM",
    "location": "Atlanta, GA",
    "summary": "Forget the year's troubles, JET style.",
    "details": "Our end-of-year party. Food, drinks, and a toast to the year.",
    "poster": "",
    "rsvpUrl": "",
    "order": 8
  }
]
```

Create `content/partner-events.json`. These are generic placeholders, not real events. The board replaces them.

```json
[
  {
    "id": "p1",
    "title": "Partner event placeholder",
    "host": "JETAA USA",
    "date": "2026-11-07",
    "time": "",
    "location": "Online",
    "link": "",
    "order": 1
  }
]
```

- [ ] **Step 4: Add the readers to `lib/content.ts`**

Add a type import at the top: `import type { JetaaseEvent, PartnerEvent } from "./events";`

Replace the `EDITABLE_PATHS` block with:

```ts
// Files the admin is allowed to commit through /api/github.
export const BOARD_PATH = "content/board.json";
export const REPS_PATH = "content/subchapter-reps.json";
export const EVENTS_PATH = "content/events.json";
export const PARTNERS_PATH = "content/partner-events.json";
export const EDITABLE_PATHS = [BOARD_PATH, REPS_PATH, EVENTS_PATH, PARTNERS_PATH];
```

Append:

```ts
// Unsorted: pages split and sort events by date (see lib/events.ts).
export function readEvents(): JetaaseEvent[] {
  return JSON.parse(readRaw("events.json")) as JetaaseEvent[];
}

export function readPartnerEvents(): PartnerEvent[] {
  return JSON.parse(readRaw("partner-events.json")) as PartnerEvent[];
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run`
Expected: all pass, including `lib/admin-api.test.ts`. Its fake GitHub returns 404 for the new paths, so the reference scan skips them.

- [ ] **Step 6: Checkpoint**

Run: `npx tsc --noEmit`
Expected: no errors. Suggested commit: `feat(events): seed event content and readers`.

---

### Task 3: Validation and save preparation (`lib/editor-save.ts`)

**Files:**
- Modify: `lib/editor-save.ts`
- Test: `lib/editor-save.test.ts`

**Interfaces:**
- Consumes: `assignSlugs` and `isValidDate` from `lib/events.ts`.
- Produces:
  - `type CheckedField = { key: string; label: string; type?: "date" | "url" | "textarea"; required?: boolean }`. `ListEditor`'s `Field` is assignable to it.
  - `validate(fields: CheckedField[], items: Record<string, unknown>[], itemLabel: string): { id: string; message: string } | null`
  - `prepareItems<T extends Record<string, unknown>>(items: T[], opts: { byDate?: boolean; slugs?: boolean }): T[]`

- [ ] **Step 1: Write the failing tests**

Add to `lib/editor-save.test.ts`. Change the import to also bring in `validate` and `prepareItems`.

```ts
describe("validate", () => {
  const fields = [
    { key: "title", label: "Event name", required: true },
    { key: "date", label: "Date", type: "date" as const, required: true },
    { key: "rsvpUrl", label: "RSVP link (optional)", type: "url" as const },
    { key: "link", label: "Event link (optional)", type: "url" as const },
  ];
  const good = { id: "e1", title: "Fall Welcome", date: "2026-10-03", rsvpUrl: "https://forms.gle/x", link: "" };

  it("passes complete items", () => {
    expect(validate(fields, [good], "event")).toBeNull();
  });
  it("names the event by title when a required field is empty", () => {
    expect(validate(fields, [good, { ...good, id: "e2", date: "" }], "event"))
      .toEqual({ id: "e2", message: '"Fall Welcome": add the date.' });
  });
  it("names the event by position when it has no title", () => {
    expect(validate(fields, [good, { ...good, id: "e2", title: " " }], "event"))
      .toEqual({ id: "e2", message: "Event 2: add the event name." });
  });
  it("uses the item label for position names", () => {
    expect(validate(fields, [{ ...good, title: "" }], "partner event")?.message)
      .toBe("Partner event 1: add the event name.");
  });
  it("rejects a link that doesn't start with http, keeping acronyms", () => {
    expect(validate(fields, [{ ...good, rsvpUrl: "forms.gle/x" }], "event")?.message)
      .toBe('"Fall Welcome": the RSVP link should start with https://');
    expect(validate(fields, [{ ...good, link: "www.jetaa.org" }], "event")?.message)
      .toBe('"Fall Welcome": the event link should start with https://');
  });
  it("accepts http and https links and empty optional links", () => {
    expect(validate(fields, [{ ...good, rsvpUrl: "http://x.org", link: "" }], "event")).toBeNull();
  });
  it("rejects an impossible date", () => {
    expect(validate(fields, [{ ...good, date: "2026-02-30" }], "event")?.message)
      .toBe('"Fall Welcome": pick a valid date.');
  });
  it("uses the name field when there is no title (people editors)", () => {
    const people = [{ key: "name", label: "Name", required: true }, { key: "email", label: "Email", required: true }];
    expect(validate(people, [{ id: "m1", name: "Ann", email: "" }], "officer")?.message)
      .toBe('"Ann": add the email.');
  });
});

describe("prepareItems", () => {
  const items = [
    { id: "a", title: "Late", date: "2026-12-01", slug: "late-2026-12" },
    { id: "b", title: "Early", date: "2026-01-05" },
    { id: "c", title: "Middle", date: "2026-06-01", slug: "" },
  ];
  it("returns items unchanged without options", () => {
    expect(prepareItems(items, {})).toEqual(items);
  });
  it("sorts by date, soonest first, when byDate is set", () => {
    expect(prepareItems(items, { byDate: true }).map((i) => i.id)).toEqual(["b", "c", "a"]);
  });
  it("fills missing slugs only when slugs is set", () => {
    const out = prepareItems(items, { byDate: true, slugs: true });
    expect(out.map((i) => i.slug)).toEqual(["early-2026-01", "middle-2026-06", "late-2026-12"]);
    expect(prepareItems(items, { byDate: true })[0]).not.toHaveProperty("slug");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/editor-save.test.ts`
Expected: FAIL, `validate` is not a function.

- [ ] **Step 3: Implement**

Add `import { assignSlugs, isValidDate } from "./events";` at the top of `lib/editor-save.ts`, below the existing import. Append:

```ts
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

// Final touches before saving: date order (stable) and slugs for new items.
export function prepareItems<T extends Record<string, unknown>>(
  items: T[], opts: { byDate?: boolean; slugs?: boolean },
): T[] {
  let out = items.slice();
  if (opts.slugs) out = assignSlugs(out);
  if (opts.byDate) out.sort((a, b) => String(a.date ?? "").localeCompare(String(b.date ?? "")));
  return out;
}
```

Note: the spec sketches `validate` returning `string | null`. The plan returns `{ id, message }` so the editor can highlight the card and open the past group. The message text matches the spec.

Note: `prepareItems` assigns slugs before sorting, so when two new events share a title and month, the `-2` suffix goes to the one lower in the editor list. That's fine; the slug only needs to be unique and stable.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/editor-save.test.ts`
Expected: PASS. If the "assigns slugs" expectation fails on order, re-read the note above: slugs are assigned in input order, and the test inputs have distinct titles, so order doesn't matter there.

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all pass. Suggested commit: `feat(admin): save validation and date-ordered, slugged event saves`.

---

### Task 4: `ListEditor` and `PhotoField` support for events

**Files:**
- Modify: `app/admin/ListEditor.tsx` (full replacement below)
- Modify: `app/admin/ListEditor.module.css`
- Modify: `app/admin/PhotoField.tsx`
- Modify: `app/admin/PhotoField.module.css`

**Interfaces:**
- Consumes: `validate`, `prepareItems`, `buildSavePayload`, `saveErrorMessage`, and `uploadErrorMessage` from `lib/editor-save.ts`; `todayInEastern` from `lib/events.ts`.
- Produces:
  - `Field` gains optional `type?: "date" | "url" | "textarea"`, `required?: boolean`, and `hint?: string`.
  - `ListEditor` props gain optional `byDate?: boolean` and `slugs?: boolean`.
  - With `kind: "photo"`, an empty value means "no photo" (`""`).

This task is UI. Its pure logic was tested in Tasks 1 and 3, and the UI is verified in the browser in Task 9. Officers and Reps must look and behave exactly as before.

- [ ] **Step 1: Replace `app/admin/ListEditor.tsx`**

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import PhotoField, { type PhotoView } from "./PhotoField";
import { blobToBase64 } from "@/lib/image";
import {
  buildSavePayload, prepareItems, saveErrorMessage, uploadErrorMessage, validate, type PendingPhoto,
} from "@/lib/editor-save";
import { todayInEastern } from "@/lib/events";
import { isUploadPath, toPublicUrl, toRepoPath, type UploadFolder } from "@/lib/uploads";
import styles from "./ListEditor.module.css";

type Item = { id: string; order: number } & Record<string, unknown>;

export type Field = {
  key: string;
  label: string;
  options?: string[]; // renders a <select> instead of a text input
  placeholder?: string;
  kind?: "headshot" | "photo"; // renders a photo picker instead of a text input
  type?: "date" | "url" | "textarea"; // input type for plain fields
  required?: boolean; // checked on save
  hint?: string; // helper text under the input
};

type Props<T extends Item> = {
  title: string;
  path: string;
  commitMessage: string;
  itemLabel: string;
  idPrefix: string;
  fields: Field[];
  blank: Omit<T, "id" | "order">;
  initial: T[];
  base: Record<string, string>; // git blob SHA of `path` as served, for conflict checks
  uploadFolder: UploadFolder;
  byDate?: boolean; // sort by `date` and fold past items into a collapsed group
  slugs?: boolean; // give new items a permanent `slug` on save
};

const HEADSHOT_PLACEHOLDER = "/images/board-placeholder.png";
const SAVED = "Saved. New photos appear once the site finishes updating (about a minute).";

// What a photo field holds when it has no photo.
const emptyPhoto = (f: Field) => (f.kind === "headshot" ? HEADSHOT_PLACEHOLDER : "");
const nameOf = (it: Item) => String(it.name || it.title || "");

// Worked out on load and after each save, never while typing, so a card
// doesn't jump into the closed group mid-edit.
function pastIdsOf(items: Item[]): string[] {
  const today = todayInEastern(new Date());
  return items.filter((it) => String(it.date ?? "") < today).map((it) => it.id);
}

export default function ListEditor<T extends Item>({
  title, path, commitMessage, itemLabel, idPrefix, fields, blank, initial, base, uploadFolder, byDate, slugs,
}: Props<T>) {
  const [items, setItems] = useState<T[]>(() => (byDate ? prepareItems(initial, { byDate }) : initial));
  const [pastIds, setPastIds] = useState<string[]>(() => (byDate ? pastIdsOf(initial) : []));
  const [showPast, setShowPast] = useState(false);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  // Photos picked this session, keyed by item id.
  const [pending, setPending] = useState<Record<string, PendingPhoto>>({});
  // Published upload files to delete on the next save.
  const [deletes, setDeletes] = useState<string[]>([]);
  // Each item's photo as published, recorded the first time it changes.
  const [originals, setOriginals] = useState<Record<string, string>>({});
  const [baseShas, setBaseShas] = useState(base);
  const busy = Object.values(pending).some((p) => p.status !== "uploaded");
  // Per-item upload generation: removing or undoing bumps it, so a late
  // upload result for a photo that's no longer wanted is ignored.
  const uploadGen = useRef<Record<string, number>>({});
  const bumpGen = (id: string) => (uploadGen.current[id] = (uploadGen.current[id] ?? 0) + 1);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Functional updates: uploads finish asynchronously, after other edits.
  function update(fn: (prev: T[]) => T[]) {
    setItems(fn);
    setDirty(true);
    setStatus("");
  }
  function setField(id: string, key: string, value: string) {
    update((prev) => prev.map((it) => (it.id === id ? { ...it, [key]: value } : it)));
  }
  function move(index: number, delta: number) {
    update((prev) => {
      const next = prev.slice();
      const [it] = next.splice(index, 1);
      next.splice(index + delta, 0, it);
      return next;
    });
  }
  function remove(it: T) {
    bumpGen(it.id);
    for (const f of fields) if (f.kind) markForDelete(String(originals[it.id] ?? it[f.key] ?? ""));
    dropPending(it.id);
    update((prev) => prev.filter((x) => x.id !== it.id));
  }
  function add() {
    const fresh = { ...blank, id: `${idPrefix}${Date.now()}`, order: 0 } as T;
    if (byDate) Object.assign(fresh, { date: todayInEastern(new Date()) });
    update((prev) => [...prev, fresh]);
  }

  // ── Photos ──

  function rememberOriginal(it: T, key: string) {
    setOriginals((o) => (it.id in o ? o : { ...o, [it.id]: String(it[key] ?? "") }));
  }
  // Only published uploads are deleted; this session's unsaved uploads simply drop.
  function markForDelete(publicUrl: string) {
    const repoPath = toRepoPath(publicUrl);
    if (isUploadPath(repoPath)) setDeletes((d) => (d.includes(repoPath) ? d : [...d, repoPath]));
  }
  function dropPending(id: string) {
    setPending((p) => {
      const rest = { ...p };
      delete rest[id];
      return rest;
    });
  }
  async function upload(it: T, key: string, jpeg: Blob, previewUrl: string) {
    const gen = bumpGen(it.id);
    const current = () => uploadGen.current[it.id] === gen;
    setPending((p) => ({ ...p, [it.id]: { status: "uploading", previewUrl, jpeg } }));
    setDirty(true);
    const fail = (error: string) => {
      if (current()) setPending((p) => ({ ...p, [it.id]: { status: "failed", previewUrl, jpeg, error } }));
    };
    let res: Response;
    try {
      res = await fetch("/api/upload", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ folder: uploadFolder, nameHint: nameOf(it), dataBase64: await blobToBase64(jpeg) }),
      });
    } catch {
      return fail(uploadErrorMessage(null));
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return fail(uploadErrorMessage(res.status, data.error));
    if (!current()) return;
    setPending((p) => ({ ...p, [it.id]: { status: "uploaded", previewUrl, jpeg, upload: data } }));
    setField(it.id, key, toPublicUrl(data.path));
  }
  function pickPhoto(it: T, key: string, jpeg: Blob, previewUrl: string) {
    const original = String(originals[it.id] ?? it[key] ?? "");
    rememberOriginal(it, key);
    markForDelete(original);
    void upload(it, key, jpeg, previewUrl);
  }
  function removePhoto(it: T, f: Field) {
    bumpGen(it.id);
    const original = String(originals[it.id] ?? it[f.key] ?? "");
    rememberOriginal(it, f.key);
    markForDelete(original);
    dropPending(it.id);
    setField(it.id, f.key, emptyPhoto(f));
  }
  function undoRemove(it: T, key: string) {
    const original = originals[it.id];
    if (original === undefined) return;
    bumpGen(it.id);
    setDeletes((d) => d.filter((x) => x !== toRepoPath(original)));
    dropPending(it.id);
    setField(it.id, key, original);
  }

  async function save() {
    const problem = validate(fields, items, itemLabel);
    if (problem) {
      setErrorId(problem.id);
      if (pastIds.includes(problem.id)) setShowPast(true);
      setStatus(`Error: ${problem.message}`);
      requestAnimationFrame(() =>
        document.getElementById(`card-${problem.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
      return;
    }
    setErrorId(null);
    setSaving(true);
    setStatus("Saving…");
    try {
      const ready = prepareItems(items, { byDate, slugs });
      const payload = buildSavePayload({ path, message: commitMessage, items: ready, pending, deletes, base: baseShas });
      let res: Response;
      try {
        res = await fetch("/api/github", {
          method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
        });
      } catch {
        setStatus(`Error: ${saveErrorMessage(null)}`);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(`Error: ${saveErrorMessage(res.status, data.error)}`);
        return;
      }
      setBaseShas((b) => ({ ...b, ...data.blobShas }));
      // Order always follows list position, so reorders and removals never collide.
      // The fieldset is disabled while saving, so `ready` has every edit.
      setItems(ready.map((it, i) => ({ ...it, order: i + 1 })));
      if (byDate) setPastIds(pastIdsOf(ready));
      setPending({});
      setDeletes([]);
      setOriginals({});
      setDirty(false);
      setStatus(SAVED);
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  function renderInput(it: T, f: Field) {
    const value = String(it[f.key] ?? "");
    const id = `${it.id}-${f.key}`;
    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setField(it.id, f.key, e.target.value);
    let input: React.ReactNode;
    if (f.options) {
      input = (
        <select id={id} value={value} onChange={onChange}>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    } else if (f.type === "textarea") {
      input = <textarea id={id} value={value} placeholder={f.placeholder} rows={6} onChange={onChange} />;
    } else {
      input = (
        <input
          id={id} value={value} placeholder={f.placeholder} onChange={onChange}
          type={f.type ?? "text"} inputMode={f.type === "url" ? "url" : undefined}
        />
      );
    }
    return (
      <label key={f.key} htmlFor={id} className={`${styles.field} ${f.type === "textarea" ? styles.wide : ""}`}>
        <span>{f.label}{f.required && <span className={styles.required} aria-hidden="true"> *</span>}</span>
        {input}
        {f.hint && <small className={styles.hint}>{f.hint}</small>}
      </label>
    );
  }

  function renderCard(it: T, i: number) {
    return (
      <li key={it.id} id={`card-${it.id}`} className={`${styles.card} ${errorId === it.id ? styles.cardError : ""}`}>
        <div className={styles.cardHeader}>
          <strong>{nameOf(it) || `New ${itemLabel}`}</strong>
          <div className={styles.actions}>
            {!byDate && (
              <>
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">↓</button>
              </>
            )}
            <button onClick={() => remove(it)} className={styles.danger}>Remove</button>
          </div>
        </div>
        <div className={styles.fields}>
          {fields.map((f) => {
            if (!f.kind) return renderInput(it, f);
            const p = pending[it.id];
            const original = originals[it.id];
            const view: PhotoView = {
              src: p?.previewUrl ?? String(it[f.key] || emptyPhoto(f)),
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
                onRetry={() => p && void upload(it, f.key, p.jpeg, p.previewUrl)}
              />
            );
          })}
        </div>
      </li>
    );
  }

  const current = items.filter((it) => !pastIds.includes(it.id));
  const past = items.filter((it) => pastIds.includes(it.id)).reverse(); // newest first

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <button className={styles.primary} onClick={save} disabled={!dirty || saving || busy}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
      {status && <p className={styles.status} role="status">{status}</p>}

      {/* Disabled while saving, so nothing changes under an in-flight save. */}
      <fieldset disabled={saving} className={styles.fieldset}>
      <ol className={styles.list}>
        {current.map((it) => renderCard(it, items.indexOf(it)))}
      </ol>
      <button className={styles.secondary} onClick={add}>+ Add {itemLabel}</button>
      {past.length > 0 && (
        <div className={styles.pastGroup}>
          <button
            className={styles.pastToggle} onClick={() => setShowPast((s) => !s)} aria-expanded={showPast}
          >
            {showPast ? "▾" : "▸"} Past {itemLabel}s ({past.length})
          </button>
          {showPast && <ol className={styles.list}>{past.map((it) => renderCard(it, items.indexOf(it)))}</ol>}
        </div>
      )}
      </fieldset>
    </section>
  );
}
```

Things to check against the old file:
- Without `byDate`, `pastIds` is always `[]`, so `current` is all items in array order, `past` is empty, and the arrows render with the same indexes as before.
- The upload `nameHint` is now `nameOf(it)`, which is `name` for people and `title` for events.
- Every other line of photo logic is unchanged.

- [ ] **Step 2: Add styles to `app/admin/ListEditor.module.css`**

Change the `.field input, .field select` selector to `.field input, .field select, .field textarea`, and add `resize: vertical; line-height: 1.5;` only for textarea:

```css
.field textarea {
  resize: vertical;
  line-height: 1.5;
}

.wide {
  grid-column: 1 / -1;
}

.required {
  color: var(--red);
}

.hint {
  font-weight: 400;
  color: var(--ink-muted);
  font-size: 0.75rem;
}

.cardError {
  border-color: var(--red);
  box-shadow: 0 0 0 2px rgba(237, 28, 36, 0.15);
}

.pastGroup {
  margin-top: 1.5rem;
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

.section .pastToggle {
  border: 0;
  background: none;
  padding: 0.25rem 0;
  font-weight: 600;
  color: var(--ink-muted);
}
```

- [ ] **Step 3: Update `app/admin/PhotoField.tsx` for posters**

Replace the `<img … />` element at the top of the returned JSX with:

```tsx
      {view.src ? (
        <img
          src={view.src}
          alt=""
          className={`${kind === "headshot" ? styles.thumbRound : styles.thumb} ${view.pendingDelete ? styles.faded : ""}`}
        />
      ) : (
        <div className={`${styles.thumb} ${styles.empty}`}>No poster</div>
      )}
```

Also change the pick button label so an empty poster reads "Add photo":

```tsx
            {view.status === "uploading" ? "Uploading…" : view.src ? "Change photo" : "Add photo"}
```

When there's no photo, hide Remove, since there's nothing to remove:

```tsx
          {view.pendingDelete || view.canUndo
            ? <button type="button" onClick={onUndoRemove}>Undo</button>
            : view.src && <button type="button" onClick={onRemove} className={styles.danger}>Remove</button>}
```

- [ ] **Step 4: Update `app/admin/PhotoField.module.css`**

Split `.thumb` from `.thumbRound` so posters show whole at 4:5:

```css
.thumb {
  width: 64px;
  height: 80px;
  object-fit: contain;
  border-radius: 8px;
  background: #efe7d6;
  flex-shrink: 0;
}
.thumbRound {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 50%;
  background: #efe7d6;
  flex-shrink: 0;
}
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 0.7rem;
  color: var(--ink-muted);
}
```

Delete the old combined `.thumb, .thumbRound { … }` and `.thumbRound { border-radius: 50%; }` rules.

- [ ] **Step 5: Checkpoint**

Run: `npx vitest run && npx tsc --noEmit && npx eslint app/admin`
Expected: all pass, with no new lint errors. (Existing `<img>` warnings, `@next/next/no-img-element`, are accepted in this codebase.) Suggested commit: `feat(admin): date, link, and long-text fields, date sorting, and poster previews in ListEditor`.

---

### Task 5: Split `/admin` into Events and People

**Files:**
- Create: `app/admin/layout.tsx`, `app/admin/AdminTabs.tsx`, `app/admin/AdminTabs.module.css`, `app/admin/people/page.tsx`, `app/admin/events/page.tsx`
- Modify: `app/admin/page.tsx`

**Interfaces:**
- Consumes: from Task 4, `ListEditor` with `Field.type`, `required`, `hint`, `byDate`, and `slugs`; from Task 2, `readEvents`, `readPartnerEvents`, `EVENTS_PATH`, and `PARTNERS_PATH`; from `lib/auth-cookie.ts`, `requireSession`; and the existing `LoginForm`.
- Produces: the routes `/admin` (redirect), `/admin/events`, and `/admin/people`.

- [ ] **Step 1: Create `app/admin/layout.tsx`**

```tsx
import { requireSession } from "@/lib/auth-cookie";
import LoginForm from "./LoginForm";
import AdminTabs from "./AdminTabs";
import styles from "./page.module.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await requireSession())) {
    return (
      <main className={styles.login}>
        <h1>JETAASE Admin</h1>
        <LoginForm />
      </main>
    );
  }
  return (
    <main className={styles.editor}>
      <h1 className={styles.heading}>JETAASE Admin</h1>
      <p className={styles.intro}>
        Changes go live about a minute after you save. Each section saves separately.
      </p>
      <AdminTabs />
      {children}
    </main>
  );
}
```

- [ ] **Step 2: Create `app/admin/AdminTabs.tsx` and its CSS**

```tsx
"use client";
import { usePathname } from "next/navigation";
import styles from "./AdminTabs.module.css";

const TABS = [
  { href: "/admin/events", label: "Events" },
  { href: "/admin/people", label: "People" },
];

// Plain <a>, not next/link: a full page load fires the editors'
// unsaved-changes warning, and client navigation would silently drop edits.
export default function AdminTabs() {
  const path = usePathname();
  return (
    <nav className={styles.tabs} aria-label="Admin sections">
      {TABS.map((t) => (
        // eslint-disable-next-line @next/next/no-html-link-for-pages -- see comment above
        <a key={t.href} href={t.href} className={styles.tab} aria-current={path === t.href ? "page" : undefined}>
          {t.label}
        </a>
      ))}
    </nav>
  );
}
```

`app/admin/AdminTabs.module.css`:

```css
.tabs {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid var(--border);
  margin: 0 0 2rem;
}
.tab {
  padding: 0.6rem 1.1rem;
  font-weight: 600;
  color: var(--ink-muted);
  border-bottom: 3px solid transparent;
  margin-bottom: -1px;
}
.tab[aria-current="page"] {
  color: var(--ink);
  border-bottom-color: var(--red);
}
```

- [ ] **Step 3: Move the people editors to `app/admin/people/page.tsx`**

```tsx
import { requireSession } from "@/lib/auth-cookie";
import {
  readBoard, readReps, readRaw, BOARD_PATH, REPS_PATH,
  type BoardMember, type SubchapterRep,
} from "@/lib/content";
import { gitBlobSha } from "@/lib/git-sha";
import ListEditor, { type Field } from "../ListEditor";

const BOARD_FIELDS: Field[] = [
  { key: "name", label: "Name" },
  { key: "role", label: "Role", placeholder: "e.g. Treasurer" },
  { key: "chapter", label: "State", options: ["AL", "GA", "NC", "SC"] },
  { key: "bio", label: "JET placement", placeholder: "e.g. Nagano Prefecture, 2017–2022" },
  { key: "email", label: "Email", placeholder: "e.g. treasurer@jetaase.org" },
  { key: "photo", label: "Photo", kind: "headshot" },
];

const REP_FIELDS: Field[] = [
  { key: "name", label: "Name" },
  { key: "state", label: "State", options: ["Alabama", "Georgia", "North Carolina", "South Carolina"] },
  { key: "city", label: "City (optional)", placeholder: "e.g. Charlotte" },
  { key: "placement", label: "JET placement", placeholder: "e.g. Kyoto Prefecture, 2022–2024" },
  { key: "email", label: "Email" },
  { key: "photo", label: "Photo", kind: "headshot" },
];

const BLANK_MEMBER: Omit<BoardMember, "id" | "order"> = {
  name: "", role: "", chapter: "GA", bio: "", email: "",
  photo: "/images/board-placeholder.png",
};

const BLANK_REP: Omit<SubchapterRep, "id" | "order"> = {
  name: "", state: "Georgia", city: "", placement: "", email: "",
  photo: "/images/board-placeholder.png",
};

export default async function PeopleAdminPage() {
  // The layout shows the login form; this guards the data too.
  if (!(await requireSession())) return null;
  return (
    <>
      <ListEditor
        title="Officers" itemLabel="officer" idPrefix="m"
        base={{ [BOARD_PATH]: gitBlobSha(readRaw("board.json")) }} uploadFolder="board"
        path={BOARD_PATH} commitMessage="chore(admin): update board members"
        fields={BOARD_FIELDS} blank={BLANK_MEMBER} initial={readBoard()}
      />
      <ListEditor
        title="Subchapter representatives" itemLabel="representative" idPrefix="r"
        base={{ [REPS_PATH]: gitBlobSha(readRaw("subchapter-reps.json")) }} uploadFolder="reps"
        path={REPS_PATH} commitMessage="chore(admin): update subchapter reps"
        fields={REP_FIELDS} blank={BLANK_REP} initial={readReps()}
      />
    </>
  );
}
```

(The field lists are copied unchanged from the old `app/admin/page.tsx`. No `required` flags are added, so the people editors behave as before.)

- [ ] **Step 4: Create `app/admin/events/page.tsx`**

```tsx
import { requireSession } from "@/lib/auth-cookie";
import {
  readEvents, readPartnerEvents, readRaw, EVENTS_PATH, PARTNERS_PATH,
} from "@/lib/content";
import type { JetaaseEvent, PartnerEvent } from "@/lib/events";
import { gitBlobSha } from "@/lib/git-sha";
import ListEditor, { type Field } from "../ListEditor";

const EVENT_FIELDS: Field[] = [
  { key: "title", label: "Event name", required: true },
  { key: "date", label: "Date", type: "date", required: true },
  { key: "time", label: "Time", placeholder: "e.g. 2:00–6:00 PM" },
  { key: "location", label: "Location", placeholder: "e.g. Piedmont Park, Atlanta, GA or Online" },
  { key: "summary", label: "Short summary", placeholder: "One line for the event card" },
  { key: "details", label: "Full details", type: "textarea", hint: "Leave a blank line between paragraphs" },
  { key: "poster", label: "Poster", kind: "photo" },
  { key: "rsvpUrl", label: "RSVP link (optional)", type: "url", placeholder: "e.g. a Google Form link" },
];

const PARTNER_FIELDS: Field[] = [
  { key: "title", label: "Event name", required: true },
  { key: "host", label: "Host", required: true, placeholder: "e.g. JETAA USA" },
  { key: "date", label: "Date", type: "date", required: true },
  { key: "time", label: "Time", placeholder: "e.g. 7:00 PM" },
  { key: "location", label: "Location", placeholder: "e.g. Atlanta, GA or Online" },
  { key: "link", label: "Event link (optional)", type: "url", placeholder: "The host's page for this event" },
];

// ListEditor fills in today's date for new items.
const BLANK_EVENT: Omit<JetaaseEvent, "id" | "order"> = {
  slug: "", title: "", date: "", time: "", location: "", summary: "", details: "", poster: "", rsvpUrl: "",
};

const BLANK_PARTNER: Omit<PartnerEvent, "id" | "order"> = {
  title: "", host: "", date: "", time: "", location: "", link: "",
};

export default async function EventsAdminPage() {
  // The layout shows the login form; this guards the data too.
  if (!(await requireSession())) return null;
  return (
    <>
      <ListEditor
        title="Events" itemLabel="event" idPrefix="e" byDate slugs
        base={{ [EVENTS_PATH]: gitBlobSha(readRaw("events.json")) }} uploadFolder="events"
        path={EVENTS_PATH} commitMessage="chore(admin): update events"
        fields={EVENT_FIELDS} blank={BLANK_EVENT} initial={readEvents()}
      />
      <ListEditor
        title="Partner events" itemLabel="partner event" idPrefix="p" byDate
        base={{ [PARTNERS_PATH]: gitBlobSha(readRaw("partner-events.json")) }} uploadFolder="events"
        path={PARTNERS_PATH} commitMessage="chore(admin): update partner events"
        fields={PARTNER_FIELDS} blank={BLANK_PARTNER} initial={readPartnerEvents()}
      />
    </>
  );
}
```

Two notes:
- `readEvents()` and `readPartnerEvents()` return `JetaaseEvent[]` and `PartnerEvent[]`. They satisfy `ListEditor`'s `T extends { id: string; order: number } & Record<string, unknown>` because both have `id` and `order`, and because they are declared with `type`, not `interface`. Type aliases are assignable to `Record<string, unknown>`; interfaces are not. Keep them as `type`.
- The spec lists "host" as "Hosted by". The plan uses "Host" so the validation message reads "add the host."

- [ ] **Step 5: Replace `app/admin/page.tsx` with a redirect**

```tsx
import { redirect } from "next/navigation";

// Old bookmarks of /admin land on the page used most.
export default function AdminPage() {
  redirect("/admin/events");
}
```

- [ ] **Step 6: Checkpoint**

Run: `npx vitest run && npx tsc --noEmit && npx eslint app/admin && npm run build`
Expected:
- Everything passes.
- The build route table lists `/admin`, `/admin/events`, and `/admin/people` as dynamic (ƒ), because they read cookies.

Suggested commit: `feat(admin): split admin into Events and People tabs and add the event editors`.

---

### Task 6: Poster, EventCard, newsletter prompt, and the homepage block

**Files:**
- Create: `components/Poster.tsx`, `components/Poster.module.css`, `components/EventCard.tsx`, `components/EventCard.module.css`, `components/NewsletterPrompt.tsx`, `components/NewsletterPrompt.module.css`
- Modify: `app/page.tsx` (the `{/* EVENTS */}` section and the imports), `app/page.module.css` (remove `.eventCard` through `.eventDesc`)

**Interfaces:**
- Consumes: `JetaaseEvent`, `dateParts`, `formatEventDate`, `splitEvents`, and `todayInEastern` from `lib/events.ts`; `readEvents` from `lib/content.ts`.
- Produces:
  - `<Poster event={{ poster, title, date }} className? priority? />`: a 4:5 frame.
  - `<EventCard event size?="default"|"small" />`: a linked card.
  - `<NewsletterPrompt empty? />`: `empty` shows the empty-state copy.

- [ ] **Step 1: Create `components/Poster.tsx` and its CSS**

```tsx
import { dateParts, type JetaaseEvent } from "@/lib/events";
import styles from "./Poster.module.css";

// Posters are square or portrait flyers: always shown whole in a 4:5 frame.
export default function Poster({
  event, className, priority,
}: {
  event: Pick<JetaaseEvent, "poster" | "title" | "date">;
  className?: string;
  priority?: boolean; // above the fold: don't lazy-load
}) {
  const { month, day } = dateParts(event.date);
  return (
    <div className={`${styles.frame} ${className ?? ""}`}>
      {event.poster ? (
        <img
          src={event.poster} alt={`Poster for ${event.title}`} className={styles.img}
          loading={priority ? "eager" : "lazy"}
        />
      ) : (
        <div className={styles.blank} aria-hidden="true">
          <span className={styles.month}>{month}</span>
          <span className={styles.day}>{day}</span>
        </div>
      )}
    </div>
  );
}
```

`components/Poster.module.css`:

```css
.frame {
  aspect-ratio: 4 / 5;
  background: #f4ede0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.blank {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #a48365;
}
.month {
  font-family: var(--font-mono);
  font-size: 14px;
  letter-spacing: 0.2em;
}
.day {
  font-family: var(--font-serif);
  font-size: 64px;
  line-height: 1;
  color: var(--ink);
}
```

- [ ] **Step 2: Create `components/EventCard.tsx` and its CSS**

```tsx
import Link from "next/link";
import { formatEventDate, type JetaaseEvent } from "@/lib/events";
import Poster from "./Poster";
import styles from "./EventCard.module.css";

export default function EventCard({ event, size = "default" }: { event: JetaaseEvent; size?: "default" | "small" }) {
  const small = size === "small";
  const when = formatEventDate(event.date, small ? "month" : "day");
  const meta = [when, event.location.toUpperCase()].filter(Boolean).join(" · ");
  return (
    <Link href={`/events/${event.slug}`} className={`${styles.card} ${small ? styles.small : ""}`}>
      <Poster event={event} />
      <div className={styles.body}>
        <div className={styles.date}>{meta}</div>
        <div className={styles.title}>{event.title}</div>
        {!small && event.summary && <div className={styles.summary}>{event.summary}</div>}
      </div>
    </Link>
  );
}
```

`components/EventCard.module.css`:

```css
.card {
  display: flex;
  flex-direction: column;
  border: 1px solid #e6ddca;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  color: inherit;
  transition: box-shadow 0.15s, transform 0.15s;
}
.card:hover {
  box-shadow: 0 12px 30px -18px rgba(35, 31, 26, 0.45);
  transform: translateY(-2px);
}
.body {
  padding: 20px 22px 22px;
}
.date {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--red);
  margin-bottom: 8px;
}
.title {
  font-weight: 700;
  font-size: 18px;
  margin-bottom: 6px;
}
.summary {
  font-size: 14px;
  color: #7a715e;
}
.small .body {
  padding: 12px 14px 14px;
}
.small .date {
  color: #8a8069;
  font-size: 11px;
}
.small .title {
  font-size: 15px;
  margin-bottom: 0;
}
```

- [ ] **Step 3: Create `components/NewsletterPrompt.tsx` and its CSS**

```tsx
import Link from "next/link";
import styles from "./NewsletterPrompt.module.css";

// The newsletter is part of membership, so this links to /join.
export default function NewsletterPrompt({ empty }: { empty?: boolean }) {
  return (
    <p className={`${styles.prompt} ${empty ? styles.empty : ""}`}>
      {empty ? "Nothing on the calendar yet. " : "Want the full list? "}
      <Link href="/join" className={styles.link}>
        {empty ? "Get the newsletter to hear first →" : "Get the newsletter →"}
      </Link>
    </p>
  );
}
```

`components/NewsletterPrompt.module.css`:

```css
.prompt {
  margin: 0;
  font-size: 16px;
  color: #6a6252;
}
.link {
  font-weight: 700;
  color: var(--red);
}
.empty {
  border: 1.5px dashed #cfc6b4;
  border-radius: 14px;
  padding: 28px;
  text-align: center;
  font-size: 18px;
}
```

- [ ] **Step 4: Rebuild the homepage events block in `app/page.tsx`**

Add these imports:

```tsx
import EventCard from "@/components/EventCard";
import NewsletterPrompt from "@/components/NewsletterPrompt";
import { readEvents } from "@/lib/content";
import { splitEvents, todayInEastern } from "@/lib/events";
```

Above `export default function Home()`, add:

```tsx
// Re-render hourly so past events drop off without a deploy.
export const revalidate = 3600;
```

At the top of `Home()`, add:

```tsx
  const { next, upcoming } = splitEvents(readEvents(), todayInEastern(new Date()));
  const shown = next ? [next, ...upcoming.slice(0, 2)] : [];
```

Replace the `<div className={styles.eventsGrid}> … </div>` inside `{/* EVENTS */}` (the three hard-coded cards) with:

```tsx
        {shown.length > 0 ? (
          <div className={styles.eventsGrid}>
            {shown.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        ) : (
          <NewsletterPrompt empty />
        )}
```

In `app/page.module.css`, delete the now-unused `.eventCard`, `.eventPhoto`, `.eventPhotoLabel`, `.eventBody`, `.eventDate`, `.eventTitle`, and `.eventDesc` rules. Keep `.events`, `.eventsHeader`, `.seeAllLink`, `.eventsGrid`, and its media query.

- [ ] **Step 5: Checkpoint**

Run: `npx tsc --noEmit && npx eslint app/page.tsx components && npm run build`
Expected:
- Everything passes.
- In the build route table, `/` shows `Revalidate 1h`. Next 16 prints a revalidate column for ISR routes; if the format differs, confirm `/` is not marked dynamic (ƒ).

Then run `npm run dev` and open `http://localhost:3000/#events`. With the seed data and today = 2026-10-08, three cards show: Applying to JET: Info Night, Monthly Nihongo Meetup, and Returnee Welcome Home Dinner. Each has a dated blank poster panel and links to `/events/<slug>` (that page 404s until Task 8).

Suggested commit: `feat(home): upcoming events block built from event data`.

---

### Task 7: Rebuild the Events page from data

**Files:**
- Modify: `app/events/page.tsx` (full replacement below)
- Modify: `app/events/page.module.css`

**Interfaces:**
- Consumes: from Task 6, `Poster`, `EventCard`, and `NewsletterPrompt`; from Task 1, `splitEvents`, `upcomingPartners`, `todayInEastern`, and `formatEventDate`; from Task 2, `readEvents` and `readPartnerEvents`.
- Produces: the `/events` page, ISR with 1h revalidation.

- [ ] **Step 1: Replace `app/events/page.tsx`**

```tsx
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import CultureBand from "@/components/CultureBand";
import Poster from "@/components/Poster";
import EventCard from "@/components/EventCard";
import NewsletterPrompt from "@/components/NewsletterPrompt";
import { readEvents, readPartnerEvents } from "@/lib/content";
import { formatEventDate, splitEvents, todayInEastern, upcomingPartners } from "@/lib/events";
import styles from "./page.module.css";

// Re-render hourly so events move into "Looking back" without a deploy.
export const revalidate = 3600;

export default function EventsPage() {
  const today = todayInEastern(new Date());
  const { next, upcoming, past } = splitEvents(readEvents(), today);
  const partners = upcomingPartners(readPartnerEvents(), today);

  return (
    <div className={styles.pageRoot}>
      <Header />

      <Hero
        eyebrow="What's coming up"
        title="Events"
        subtitle="Picnics, meetups, welcome dinners, and info nights across the Southeast."
      />

      {/* NEXT UP */}
      <section className={styles.featured}>
        {next ? (
          <div className={styles.featuredGrid}>
            <div className={styles.featuredPoster}>
              <Poster event={next} priority />
              <span className={styles.featuredBadge}>NEXT UP</span>
            </div>
            <div className={styles.featuredBody}>
              <div className={styles.featuredDate}>
                {[formatEventDate(next.date, "weekday"), next.time.toUpperCase()].filter(Boolean).join(" · ")}
              </div>
              <h2 className={styles.featuredTitle}>{next.title}</h2>
              {next.location && <div className={styles.featuredLocation}>{next.location}</div>}
              {next.summary && <p className={styles.featuredDesc}>{next.summary}</p>}
              <div className={styles.featuredActions}>
                {next.rsvpUrl && (
                  <a href={next.rsvpUrl} target="_blank" rel="noopener noreferrer" className={styles.rsvpBtn}>
                    RSVP
                  </a>
                )}
                <Link href={`/events/${next.slug}`} className={styles.detailsBtn}>
                  Details →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <NewsletterPrompt empty />
        )}
      </section>

      {/* MORE UPCOMING */}
      {upcoming.length > 0 && (
        <section className={styles.upcoming}>
          <h2 className={styles.sectionTitle}>More upcoming</h2>
          <div className={styles.upcomingGrid}>
            {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {/* ALSO HAPPENING — partner events */}
      {partners.length > 0 && (
        <section className={styles.partners}>
          <h2 className={styles.partnersTitle}>Also happening</h2>
          <p className={styles.partnersIntro}>Events from our friends at JETAA USA, the consulate, and others.</p>
          <ul className={styles.partnerList}>
            {partners.map((p) => {
              const row = (
                <>
                  <span className={styles.partnerDate}>{formatEventDate(p.date, "day")}</span>
                  <span className={styles.partnerMain}>
                    <span className={styles.partnerTitle}>{p.title}</span>
                    <span className={styles.partnerMeta}>
                      {[p.time, p.location].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className={styles.hostTag}>{p.host}</span>
                </>
              );
              return (
                <li key={p.id}>
                  {p.link ? (
                    <a href={p.link} target="_blank" rel="noopener noreferrer" className={styles.partnerRow}>{row}</a>
                  ) : (
                    <div className={styles.partnerRow}>{row}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* NEWSLETTER */}
      {next && (
        <section className={styles.newsletter}>
          <NewsletterPrompt />
        </section>
      )}

      {/* LOOKING BACK */}
      {past.length > 0 && (
        <section className={styles.lookingBackSection}>
          <div className={styles.lookingBackInner}>
            <div className={styles.lookingBackHeader}>
              <div>
                <div className={styles.lookingBackEyebrow}>Looking back</div>
                <h2 className={styles.sectionTitle}>A few recent get-togethers</h2>
              </div>
              <a href="https://instagram.com/jetaase" className={styles.instagramLink}>
                See more on Instagram →
              </a>
            </div>
            <div className={styles.pastGrid}>
              {past.slice(0, 6).map((e) => <EventCard key={e.id} event={e} size="small" />)}
            </div>
          </div>
        </section>
      )}

      <CultureBand />

      {/* SUGGEST AN EVENT */}
      <section className={styles.suggest}>
        <div className={styles.suggestBox}>
          <div className={styles.suggestCopy}>
            <h2 className={styles.suggestTitle}>Have an event idea?</h2>
            <p className={styles.suggestText}>
              Reunions, language tables, hikes — if you&apos;d like to host or
              suggest something in your area, we&apos;ll help make it happen.
            </p>
          </div>
          <a href="mailto:events@jetaase.org" className={styles.suggestBtn}>
            Suggest an event →
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
```

The spec says the newsletter prompt is "always shown". When nothing is upcoming, the Next up empty state already carries the newsletter link, so the separate prompt is shown only when `next` exists, to avoid saying it twice. If the reviewer reads "always" literally, this is the deliberate reason.

- [ ] **Step 2: Update `app/events/page.module.css`**

Delete these rules:
- `.featuredPhotoWrap`, `.featuredPhoto`, `.upcomingHeader`, `.subscribeLink`
- `.upcomingCard` through `.upcomingDetailsBtn` (including `.upcomingPhoto` and `.upcomingPhotoOnline`)
- `.pastPhotoWrap`, `.pastDate`, `.pastTitle`
- every `.modal*` rule
- `.photoCredit` and `.photoCredit:hover`

Change `.featuredGrid`'s columns so the poster takes the narrower column:

```css
.featuredGrid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  border: 1px solid #e6ddca;
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
}
```

Change `.detailsBtn` so it works as a link instead of a button: remove `background: none;`, `cursor: pointer;`, and `font-family: var(--font-body);`, and add `display: inline-block;`.

Change `.featuredActions` to add `flex-wrap: wrap;`.

Add `margin-bottom: 22px;` to `.sectionTitle`, and add a `.lookingBackHeader .sectionTitle { margin-bottom: 0; }` override so the Looking back header spacing is unchanged.

Change `.pastGrid` to smaller, denser columns:

```css
.pastGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 18px;
}
```

Delete `.pastGrid`'s old `@media (max-width: 768px)` block.

Add:

```css
.featuredPoster {
  position: relative;
}
.featuredLocation {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 12px;
}

/* ALSO HAPPENING */
.partners {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 28px 40px 8px;
}
.partnersTitle {
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: 26px;
  margin: 0 0 4px;
}
.partnersIntro {
  margin: 0 0 16px;
  color: #6a6252;
  font-size: 15px;
}
.partnerList {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid #e6ddca;
}
.partnerRow {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 14px 4px;
  border-bottom: 1px solid #e6ddca;
  color: inherit;
}
a.partnerRow:hover .partnerTitle {
  text-decoration: underline;
}
.partnerDate {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--red);
}
.partnerMain {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.partnerTitle {
  font-weight: 700;
}
.partnerMeta {
  font-size: 14px;
  color: #7a715e;
}
.hostTag {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: #e8f0ff;
  color: #3d5f96;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}
@media (max-width: 600px) {
  .partnerRow {
    grid-template-columns: 56px minmax(0, 1fr);
  }
  .hostTag {
    grid-column: 2;
    justify-self: start;
  }
}

/* NEWSLETTER */
.newsletter {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 20px 40px 8px;
}
```

The phone layout comes from the existing `@media (max-width: 768px) { .featuredGrid { grid-template-columns: 1fr; } }`, which stays. On phones the poster frame is full width, so also add inside that media query:

```css
  .featuredPoster {
    max-width: 420px;
    width: 100%;
    margin: 0 auto;
  }
```

- [ ] **Step 3: Checkpoint**

Run: `npx tsc --noEmit && npx eslint app/events && npm run build`
Expected: everything passes, and `/events` shows `Revalidate 1h` (not dynamic).

With `npm run dev`, `/events` with the seed data shows:
- Next up: Applying to JET: Info Night, with no RSVP button and a Details link.
- More upcoming: three cards.
- Also happening: one row tagged JETAA USA.
- The newsletter line.
- Looking back: four small cards, Natsumatsuri first.
- The Culture band and the suggest box.
- No "Subscribe to calendar" link, no modal.

Suggested commit: `feat(events): build the Events page from event data`.

---

### Task 8: Event page (`/events/[slug]`) and Open Graph base URL

**Files:**
- Create: `app/events/[slug]/page.tsx`, `app/events/[slug]/page.module.css`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `readEvents`; `Poster`; and `formatEventDate`, `isValidDate`, `todayInEastern`, and `toParagraphs`.
- Produces: the `/events/<slug>` pages, ISR with 1h revalidation, with unknown slugs returning 404.

- [ ] **Step 1: Add `metadataBase` to `app/layout.tsx`**

Without it, a relative poster URL in `openGraph.images` fails the build. Change the metadata export to:

```tsx
// Absolute base for Open Graph image URLs. Vercel sets this on every deploy.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "JETAASE Southeast",
  description:
    "Japan Exchange and Teaching Alumni Association, Southeast US — AL, GA, NC, SC.",
};
```

- [ ] **Step 2: Create `app/events/[slug]/page.tsx`**

Before writing, confirm the Next 16 signatures in `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-static-params.md` and `generate-metadata.md`. `params` is a `Promise`.

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Poster from "@/components/Poster";
import { readEvents } from "@/lib/content";
import { formatEventDate, isValidDate, todayInEastern, toParagraphs } from "@/lib/events";
import styles from "./page.module.css";

export const revalidate = 3600;

type Params = { params: Promise<{ slug: string }> };

const findEvent = (slug: string) => readEvents().find((e) => e.slug === slug);

export function generateStaticParams() {
  return readEvents().filter((e) => e.slug).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const event = findEvent((await params).slug);
  if (!event) return {};
  const description = event.summary || undefined;
  return {
    title: `${event.title} · JETAASE Events`,
    description,
    openGraph: { title: event.title, description, images: event.poster ? [event.poster] : undefined },
  };
}

export default async function EventPage({ params }: Params) {
  const event = findEvent((await params).slug);
  if (!event) notFound();
  const isPast = isValidDate(event.date) && event.date < todayInEastern(new Date());
  const when = [formatEventDate(event.date, "long"), event.time].filter(Boolean).join(" · ");

  return (
    <div className={styles.pageRoot}>
      <Header />
      <main className={styles.main}>
        <Link href="/events" className={styles.back}>← All events</Link>
        <div className={styles.grid}>
          <Poster event={event} className={styles.poster} priority />
          <div className={styles.info}>
            {when && <div className={styles.date}>{when}</div>}
            <h1 className={styles.title}>{event.title}</h1>
            {event.location && <div className={styles.location}>{event.location}</div>}
            {isPast ? (
              <p className={styles.passed}>This event has passed.</p>
            ) : (
              event.rsvpUrl && (
                <a href={event.rsvpUrl} target="_blank" rel="noopener noreferrer" className={styles.rsvpBtn}>
                  RSVP
                </a>
              )
            )}
          </div>
        </div>
        {event.details && (
          <div className={styles.details}>
            {toParagraphs(event.details).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 3: Create `app/events/[slug]/page.module.css`**

```css
.pageRoot {
  width: 100%;
}
.main {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 40px 72px;
}
.back {
  display: inline-block;
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 24px;
}
.grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  gap: 40px;
  align-items: start;
}
.poster {
  border-radius: 14px;
}
.info {
  padding-top: 8px;
}
.date {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--red);
  margin-bottom: 12px;
}
.title {
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: 44px;
  line-height: 1.05;
  margin: 0 0 12px;
}
.location {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 24px;
}
.rsvpBtn {
  background: var(--red);
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  padding: 14px 32px;
  border-radius: 999px;
  display: inline-block;
}
.passed {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8a8069;
}
.details {
  margin-top: 40px;
  max-width: 680px;
  font-size: 17px;
  line-height: 1.7;
  color: #3a352d;
  white-space: pre-line; /* keep single line breaks inside a paragraph */
}
.details p {
  margin: 0 0 1em;
}
@media (max-width: 768px) {
  .main {
    padding: 20px 16px 56px;
  }
  .grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  /* Keep the title near the top: cap the poster at 60% of the screen height. */
  .poster {
    width: min(100%, 48vh);
    margin: 0 auto;
  }
  .title {
    font-size: 34px;
  }
}
```

- [ ] **Step 4: Checkpoint**

Run: `npx vitest run && npx tsc --noEmit && npx eslint app && npm run build`
Expected:
- Everything passes.
- The route table shows `/events/[slug]` as SSG/ISR with 8 prerendered paths and `Revalidate 1h`.

With `npm run dev`:
- `/events/applying-to-jet-info-night-2026-10` shows the full long date, both details paragraphs, and no RSVP button (empty `rsvpUrl`).
- `/events/natsumatsuri-summer-picnic-2026-08` shows "This event has passed."
- `/events/nope` shows the 404 page.
- `curl -s localhost:3000/events/natsumatsuri-summer-picnic-2026-08 | grep -o '<title>[^<]*'` prints `<title>Natsumatsuri Summer Picnic · JETAASE Events`.

Suggested commit: `feat(events): a page for each event, with share previews`.

---

### Task 9: End-to-end verification in the browser

**Files:** none changed, unless a check fails. Fix the failure in the owning task's files.

Follow the visual-check recipe from the user's workflow notes:
- Drive Chrome over CDP with a tall viewport, then crop to the region that changed.
- Wait about 3 s after load before touching file inputs.
- Use CDP device emulation for phone widths (390px).
- Intercept `POST /api/upload` with CDP `Fetch` (reply `200 {"path":"public/images/uploads/events/test-20261008-abcd.jpg","sha":"S"}`) and `POST /api/github` (reply `200 {"commitUrl":"x","blobShas":{}}`), and record the request bodies. Nothing may reach GitHub.
- You need an admin session: sign in through the form using the password from the user's `.env.local`. Never print it.

- [ ] **Step 1: Public pages, desktop (1280px) and phone (390px)**

1. `/events` with seed data, as Task 7 describes. Check:
   - posters are 4:5 with dated panels
   - the Next up poster column is narrower
   - the partner row wraps cleanly on a phone
2. Temporarily give two seed events posters: copy a vertical image and a square image from `public/images/` into `public/images/uploads/events/` and set `poster` in a scratch copy of `content/events.json`. Also do the same with one horizontal image, for example `public/images/atlanta-skyline.jpg`. Confirm in each case that the whole image is visible, with bands where needed and no cropping. Restore `content/events.json` and delete the copies afterwards (`git status` must be clean except for intended changes).
3. Temporarily set every date in a scratch `content/events.json` to 2025. Confirm:
   - `/events` shows the empty state, no "More upcoming", no separate newsletter line, and a full Looking back (6 cards)
   - the homepage shows the empty-state prompt

   Then restore the file.
4. An event page, upcoming and past, at both widths. On a phone, the title must be visible without scrolling past the poster on a 390×844 screen.
5. The homepage `#events` block.

- [ ] **Step 2: Admin, desktop and phone**

1. `/admin` redirects to `/admin/events`.
2. The People tab shows Officers and Reps exactly as before: arrows, circular headshots, Remove.
3. On Events:
   - Cards are sorted soonest first, with no arrows.
   - "▸ Past events (4)" is collapsed and opens on click.
   - The details textarea spans the full width.
   - The poster preview is a 4:5 "No poster" box with an "Add photo" button.
4. Add an event and leave the name blank, then click Save. Expect:
   - "Error: Event 9: add the event name." (or the matching position)
   - the card is outlined in red and scrolled into view
   - no `/api/github` request was sent
5. Fill in the name and set the RSVP link to `forms.gle/x`, then Save. Expect "Error: "<name>": the RSVP link should start with https://".
6. Fix the link and add a poster (intercepted upload). Save, then check the intercepted `/api/github` body:
   - `files[0].path` is `content/events.json`
   - items are in date order
   - the new item has a `slug` like `<name>-YYYY-MM`
   - existing slugs are unchanged
   - `uploads` contains the intercepted path
7. Type into a field so the editor is dirty, then click the People tab. The browser's leave-page warning appears.
8. Partner events: blank host → "add the host."; save works and the body path is `content/partner-events.json`.

- [ ] **Step 3: Full checks**

Run: `npx vitest run && npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 4: Report to the user**

Summarize what was verified, with cropped screenshots of `/events` (desktop and phone), an event page, and `/admin/events`. List anything that failed or was skipped. Remind the user of these points:
- The seed events (and the placeholder partner row) go live on the next push to `main`, and the board should replace them.
- After deploying, confirm hourly regeneration on Vercel: `curl -sI https://<site>/events | grep -i x-vercel-cache` shows `HIT` or `STALE`, not `MISS` every time.
- The iPhone portrait-upload test is still owed from part 1, and can now include a poster.

Do not commit or push unless the user asks.
