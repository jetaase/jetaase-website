# Elections notice — design

Status: approved in conversation (2026-10-09), awaiting written-spec review

## Goal

The old site's blog was only really used once a year, to post the call for board nominations. This replaces it with an **elections notice** that the board switches on in `/admin`. While it's on, it shows on Who We Are and as a homepage banner, and it hides itself after a date. There is no blog section.

**Success:**
- In February, a board member opens the Elections tab and edits last year's notice: the year, the positions, the deadline and the timeline. They switch it on and click Save. About a minute later the homepage banner links to the notice on Who We Are.
- After the "Show until" date, both disappear without anyone touching anything.
- Anyone following an old `jetaase.org/blog/...` link lands on Who We Are.

## Decisions

| Topic | Decision |
| --- | --- |
| Scope | The call for nominations only: positions, who can run, how to run, timeline. Voting stays by email/form as today; ballots and candidate statements are out of scope. New officers simply appear on Who We Are. |
| On/off | A switch, plus a "Show until" date. Shown while `enabled` is on and today (Eastern) is on or before `showUntil`. An empty `showUntil` means "until switched off". |
| Placement | The full notice is a section on Who We Are, above Officers, at `#elections`. A slim homepage banner links to it. |
| Positions | A free list of role plus one-line description, typed in the admin. Covers officers and subchapter reps. It's kept after the notice is switched off, so next year starts from it. |
| Timeline | Free text, one step per line, e.g. "Feb 16–23: Self-nominations due". |
| Old blog | `/blog` and `/blog/*` permanently redirect (308) to `/who-we-are#elections`. |
| Initial content | `content/elections.json` is filled with the 2026–2027 post's content, switched off. |

## Data: `content/elections.json`

```ts
type ElectionPosition = {
  id: string;          // stable key for the editor, e.g. "pos1700000000000-0"
  title: string;       // "Secretary"
  description: string; // one line: "Keeps records, shares meeting notes, …"
};

type Election = {
  enabled: boolean;
  showUntil: string;  // YYYY-MM-DD or "" (until switched off)
  title: string;      // "2026–2027 board elections"
  intro: string;      // blank lines separate paragraphs
  positions: ElectionPosition[];
  howToRun: string;   // blank lines separate paragraphs
  deadline: string;   // YYYY-MM-DD or ""; nominations close at the end of this day
  timeline: string;   // one step per line
};
```

- `readElection()` in `lib/content.ts` normalizes a missing or malformed file field by field:
  - strings default to `""`, `enabled` to `false`, and `positions` to `[]`;
  - positions with no title are dropped;
  - a missing `id` is filled from the position's index.
- `content/elections.json` is added to `EDITABLE_PATHS`.

**Initial content**, from the 2026-02-12 post:
- **Title:** "2026–2027 board elections"
- **Intro:** anyone in our membership can run, and you don't need to live in Atlanta. Board meetings are online, monthly, about an hour, and outgoing officers train each role.
- **Positions:** President, Vice President, Secretary, Social Media Coordinator, Newsletter Editor and Discord Coordinator, each with the post's one-line description.
- **How to run:** email a platform under 200 words to president@jetaase.org by the deadline. Say where and when you were on JET and what you'd like to accomplish as an officer. A headshot is optional.
- **Deadline:** 2026-02-23. **Show until:** 2026-03-02.
- **Timeline:** "Feb 16–23: Self-nominations due", "Feb 25–27: Voting", "Mar 2: New officers announced".
- **Switched off.**

## Logic: `lib/elections.ts` (browser-safe)

- `normalizeElection(raw: unknown): Election`, as described above.
- `isElectionLive(e: Election, today: string): boolean`, which returns `e.enabled && (!isValidDate(e.showUntil) || today <= e.showUntil)`.
- `electionBanner(e: Election, today: string): string`, the banner sentence:
  - with a valid `deadline` and `today <= deadline`: `"Board elections: nominations are open until Feb 23."`, with the date formatted as month and day;
  - otherwise: `"Board elections are underway."`.
- "Today" is `todayInEastern(new Date())` from `lib/events.ts`.

## Admin: Elections tab (`/admin/elections`)

- `AdminTabs` gains a third tab, **Elections**.
- A new client component, `app/admin/ElectionEditor.tsx`, renders one form:
  - **Show the elections notice:** a checkbox for `enabled`, with the hint "Shows on Who We Are and as a homepage banner".
  - **Show until:** a date input, with the hint "Hides itself after this day. Leave empty to show until you switch it off."
  - **Headline**, **Intro** (textarea), **Nomination deadline** (date), **How to run** (textarea) and **Timeline** (textarea, hint "One step per line").
  - **Open positions:**
    - one row per position, with a Role input, a Description input, ↑ ↓ and Remove;
    - "+ Add position" below the rows;
    - "No open positions yet." when the list is empty.
- **Saving:** the editor uses the same sticky save bar markup, styles and `saveBarMessage` as `ListEditor`, and the same `/api/github` request with the per-file conflict check (`base` = the git blob SHA of `elections.json`).
  - There are no uploads or deletes.
  - The commit message is `chore(admin): update elections notice`.
  - A `beforeunload` warning appears while there are unsaved changes.
- **Validation before save** (shown in the bar as `Error: …`):
  - if `enabled` is on, the headline is required;
  - every position needs a role;
  - `showUntil` and `deadline` must be valid dates when they are filled in.
- **Saved message:** "Saved. The site updates in about a minute."

## Public pages

### Who We Are (`app/who-we-are/page.tsx`)

- `export const revalidate = 3600`, so the notice hides itself within an hour of `showUntil` passing.
- While `isElectionLive`, a `<section id="elections">` is placed above `#officers`. It contains:
  - the eyebrow "Board elections" and the headline as `h2`;
  - the intro as paragraphs (plain text, with blank lines splitting paragraphs, via `toParagraphs`);
  - **Open positions:** a list showing each role in bold, then its description;
  - **How to run:** paragraphs;
  - **Timeline:** a list, one item per non-empty line;
  - the styling follows the page's existing section styles. The admin-editable text is never rendered as HTML.
- While the notice isn't live, the section isn't rendered.

### Homepage banner (`app/page.tsx`)

- While `isElectionLive`, a slim banner appears directly under `<Header />`, before the hero. It shows `electionBanner(...)` followed by a link, "See open positions →", to `/who-we-are#elections`.
- The banner is full width, uses the site's tinted styling with an accent border, and is readable at 390 px.

## Redirects (`next.config.ts`)

```ts
async redirects() {
  return [
    { source: "/blog", destination: "/who-we-are#elections", permanent: true },
    { source: "/blog/:path*", destination: "/who-we-are#elections", permanent: true },
  ];
}
```

The redirects take effect once jetaase.org points at this site. Until then, Squarespace keeps serving the old blog.

## Files

| File | Change |
| --- | --- |
| `lib/elections.ts` + test | new: types, `normalizeElection`, `isElectionLive`, `electionBanner` |
| `lib/content.ts` | `ELECTIONS_PATH`, `readElection()`, added to `EDITABLE_PATHS` |
| `content/elections.json` | new, with the initial content above |
| `app/admin/elections/page.tsx` | new admin page |
| `app/admin/ElectionEditor.tsx` + css | new form editor |
| `app/admin/AdminTabs.tsx` | Elections tab |
| `app/who-we-are/page.tsx` + css | elections section, `revalidate` |
| `app/page.tsx` + css | banner |
| `next.config.ts` | blog redirects |

## Testing

**Unit:**
- `normalizeElection`: an empty or partial object, malformed positions, and missing ids.
- `isElectionLive`: off; on with no `showUntil`; on through `showUntil` inclusive; hidden the day after.
- `electionBanner`: before the deadline, on the deadline day, after it, and with no deadline.
- `readElection` returns a valid notice.
- `EDITABLE_PATHS` includes `content/elections.json`.

**Browser** (CDP, saves intercepted):
- **Admin:** edit fields, add, reorder and remove a position; the save payload has the expected JSON; a validation error shows in the bar.
- **Public, with a temporary file:**
  - **Notice on:** the Who We Are section and the homepage banner both render, at desktop and phone width. The banner wording changes after the deadline.
  - **Notice off, or past `showUntil`:** neither renders.
- **Redirect:** `/blog/2026/2/12/x` answers with a 308 to `/who-we-are#elections`.

## Out of scope

- Voting, ballots and candidate statements.
- An archive of past elections.
- A general blog or announcements system.
- Email notifications.
