# Elections Notice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Board members switch on an elections notice in `/admin/elections`. While it's live, it shows as a section on Who We Are and as a homepage banner, and it hides itself after a "Show until" date. Old `/blog` links redirect to it.

**Architecture:**
- **Data:** one object in `content/elections.json`, read through `readElection()`.
- **Pure logic** lives in a browser-safe `lib/elections.ts`: normalizing, the live check, banner wording, validation and timeline lines.
- **Admin:** a small dedicated client `ElectionEditor`. It reuses `ListEditor.module.css`, `saveBarMessage` and `saveErrorMessage`, and posts the same `/api/github` save body, with no uploads.
- **Public pages** re-render hourly (`revalidate = 3600`), so the notice hides itself without a deploy.

**Tech Stack:** Next.js 16 App Router (read `node_modules/next/dist/docs/` before using an unfamiliar API), React 19, CSS Modules, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-09-elections-notice-design.md`

## Global Constraints

- **Commits:** do not commit or push unless the user explicitly asks. "Checkpoint" means: stop, run the listed checks, and report. Commit only if told to.
- **Browser checks:** never save from `/admin` against the real repo. Intercept `/api/github` with CDP Fetch, and start the server with `GITHUB_TOKEN=dummy GITHUB_BRANCH=dummy-branch`.
- **"Today":** always `todayInEastern(new Date())` from `lib/events.ts`.
- **Browser-safe:** `lib/elections.ts` ships to the browser. No Node-only imports.
- **Plain text:** admin-entered text is rendered as plain text, never as HTML. Paragraphs come from `toParagraphs`.
- **Copy, verbatim:**
  - Banner before or on the deadline: "Board elections: nominations are open until Feb 23." (date as `Mon D`)
  - Banner otherwise: "Board elections are underway."
  - Banner link: "See open positions →"
  - Section eyebrow: "Board elections"
  - Subheadings: "Open positions", "How to run", "Timeline"
  - Admin saved message: "Saved. The site updates in about a minute."
  - Commit message: `chore(admin): update elections notice`
- **Existing editors and pages** behave exactly as before.

## Review Focus

1. **The day after "Show until" (Eastern).** The notice must be gone from both pages within an hour, without a deploy. Pinned in Task 1 (`isElectionLive` boundary tests) and Task 4 (both pages export `revalidate = 3600`).
2. **Deadline day versus the day after.** The banner says "open until" on the deadline itself and "underway" the next day. Pinned in Task 1 (`electionBanner`).
3. **A hand-edited `elections.json`** with missing fields, a non-array `positions`, or positions without ids or roles. Pages and the admin must not crash. Pinned in Task 1 (`normalizeElection`) and Task 2 (`readElection`).
4. **Switching the notice on with an empty headline, or saving a position with no role.** Save is refused with a sentence in the save bar. Pinned in Task 1 (`validateElection`) and Task 3, browser step.
5. **Editing while someone else saved** (stale base SHA). The existing conflict message shows and edits stay on screen. This is covered by the existing `handleSave` tests, because the editor sends `base`. Task 3, browser step, checks that `base` is in the payload.

---

### Task 1: Election logic (`lib/elections.ts`)

**Files:**
- Create: `lib/elections.ts`, `lib/elections.test.ts`

**Interfaces:**
- Produces:
  - `type ElectionPosition = { id: string; title: string; description: string }`
  - `type Election = { enabled: boolean; showUntil: string; title: string; intro: string; positions: ElectionPosition[]; howToRun: string; deadline: string; timeline: string }`
  - `normalizeElection(raw: unknown): Election`
  - `isElectionLive(e: Election, today: string): boolean`
  - `electionBanner(e: Election, today: string): string`
  - `validateElection(e: Election): string | null`
  - `timelineSteps(text: string): string[]`

- [ ] **Step 1: Write the failing tests** in `lib/elections.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  normalizeElection, isElectionLive, electionBanner, validateElection, timelineSteps, type Election,
} from "./elections";

const base: Election = {
  enabled: true, showUntil: "2027-03-02", title: "2026–2027 board elections", intro: "",
  positions: [{ id: "a", title: "Secretary", description: "Keeps records." }],
  howToRun: "", deadline: "2027-02-23", timeline: "",
};

describe("normalizeElection", () => {
  it("turns nothing into a switched-off, empty notice", () => {
    expect(normalizeElection(undefined)).toEqual({
      enabled: false, showUntil: "", title: "", intro: "", positions: [], howToRun: "", deadline: "", timeline: "",
    });
  });
  it("only treats enabled: true as on", () => {
    expect(normalizeElection({ enabled: "yes" }).enabled).toBe(false);
    expect(normalizeElection({ enabled: true }).enabled).toBe(true);
  });
  it("replaces a non-array positions value", () => {
    expect(normalizeElection({ positions: "President" }).positions).toEqual([]);
  });
  it("drops positions without a role and fills missing ids", () => {
    const e = normalizeElection({ positions: [{ title: "President" }, { title: "  " }, "x", { id: "k", title: "VP", description: 3 }] });
    expect(e.positions).toEqual([
      { id: "pos-0", title: "President", description: "" },
      { id: "k", title: "VP", description: "" },
    ]);
  });
});

describe("isElectionLive", () => {
  it("is hidden while switched off", () => {
    expect(isElectionLive({ ...base, enabled: false }, "2027-02-01")).toBe(false);
  });
  it("shows through the Show until day, inclusive", () => {
    expect(isElectionLive(base, "2027-03-02")).toBe(true);
  });
  it("hides itself the day after", () => {
    expect(isElectionLive(base, "2027-03-03")).toBe(false);
  });
  it("shows until switched off when Show until is empty", () => {
    expect(isElectionLive({ ...base, showUntil: "" }, "2099-01-01")).toBe(true);
  });
});

describe("electionBanner", () => {
  it("says nominations are open through the deadline day", () => {
    expect(electionBanner(base, "2027-02-10")).toBe("Board elections: nominations are open until Feb 23.");
    expect(electionBanner(base, "2027-02-23")).toBe("Board elections: nominations are open until Feb 23.");
  });
  it("says underway after the deadline or with no deadline", () => {
    expect(electionBanner(base, "2027-02-24")).toBe("Board elections are underway.");
    expect(electionBanner({ ...base, deadline: "" }, "2027-02-10")).toBe("Board elections are underway.");
  });
});

describe("validateElection", () => {
  it("accepts a complete notice", () => {
    expect(validateElection(base)).toBeNull();
  });
  it("needs a headline to switch the notice on", () => {
    expect(validateElection({ ...base, title: " " })).toBe("Add a headline before switching the notice on.");
    expect(validateElection({ ...base, enabled: false, title: "" })).toBeNull();
  });
  it("needs a role for every position", () => {
    expect(validateElection({ ...base, positions: [...base.positions, { id: "b", title: "", description: "x" }] }))
      .toBe("Position 2: add the role.");
  });
  it("checks the dates when filled in", () => {
    expect(validateElection({ ...base, showUntil: "2027-02-30" })).toBe("Pick a valid “Show until” date.");
    expect(validateElection({ ...base, deadline: "soon" })).toBe("Pick a valid nomination deadline.");
    expect(validateElection({ ...base, showUntil: "", deadline: "" })).toBeNull();
  });
});

describe("timelineSteps", () => {
  it("splits on lines and drops blank ones", () => {
    expect(timelineSteps("Feb 16–23: Nominations\n\n  Feb 25–27: Voting  \n")).toEqual([
      "Feb 16–23: Nominations", "Feb 25–27: Voting",
    ]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/elections.test.ts`
Expected: FAIL. `./elections` cannot be resolved.

- [ ] **Step 3: Implement** `lib/elections.ts`:

```ts
// The board elections notice: data, the show/hide rule, and banner copy.
// Keep this file free of Node-only imports; it ships to the browser.
import { isValidDate } from "./events";

export type ElectionPosition = { id: string; title: string; description: string };

export type Election = {
  enabled: boolean;
  showUntil: string; // YYYY-MM-DD, or "" to show until switched off
  title: string;
  intro: string; // blank lines separate paragraphs
  positions: ElectionPosition[];
  howToRun: string; // blank lines separate paragraphs
  deadline: string; // YYYY-MM-DD or ""; nominations close at the end of this day
  timeline: string; // one step per line
};

const str = (v: unknown) => (typeof v === "string" ? v : "");
const obj = (v: unknown) => (v && typeof v === "object" ? v : {}) as Record<string, unknown>;

// Hand-edited files may be missing fields; fill them so pages never crash.
export function normalizeElection(raw: unknown): Election {
  const r = obj(raw);
  const positions = (Array.isArray(r.positions) ? r.positions : [])
    .map((p, i) => {
      const o = obj(p);
      return { id: str(o.id) || `pos-${i}`, title: str(o.title), description: str(o.description) };
    })
    .filter((p) => p.title.trim());
  return {
    enabled: r.enabled === true,
    showUntil: str(r.showUntil), title: str(r.title), intro: str(r.intro), positions,
    howToRun: str(r.howToRun), deadline: str(r.deadline), timeline: str(r.timeline),
  };
}

export function isElectionLive(e: Election, today: string): boolean {
  return e.enabled && (!isValidDate(e.showUntil) || today <= e.showUntil);
}

function monthDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" })
    .format(new Date(Date.UTC(y, m - 1, d)));
}

export function electionBanner(e: Election, today: string): string {
  return isValidDate(e.deadline) && today <= e.deadline
    ? `Board elections: nominations are open until ${monthDay(e.deadline)}.`
    : "Board elections are underway.";
}

// The first thing stopping a save, as a sentence for the save bar, or null.
export function validateElection(e: Election): string | null {
  if (e.enabled && !e.title.trim()) return "Add a headline before switching the notice on.";
  const missing = e.positions.findIndex((p) => !p.title.trim());
  if (missing >= 0) return `Position ${missing + 1}: add the role.`;
  if (e.showUntil && !isValidDate(e.showUntil)) return "Pick a valid “Show until” date.";
  if (e.deadline && !isValidDate(e.deadline)) return "Pick a valid nomination deadline.";
  return null;
}

export function timelineSteps(text: string): string[] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all PASS, and tsc is clean.

- [ ] **Step 5: Checkpoint.** If the user says commit: `git add lib/elections.ts lib/elections.test.ts && git commit -m "feat(elections): add the elections notice logic"`

---

### Task 2: Content file and reader

**Files:**
- Create: `content/elections.json`
- Modify: `lib/content.ts`, `lib/content.test.ts`

**Interfaces:**
- Consumes: `normalizeElection`, `Election` (Task 1).
- Produces:
  - `ELECTIONS_PATH = "content/elections.json"`, which is added to `EDITABLE_PATHS`
  - `readElection(): Election`

- [ ] **Step 1: Write the failing tests.** Append to `lib/content.test.ts`, and add `readElection` to the import from `./content` and `isElectionLive` from `./elections`:

```ts
describe("readElection", () => {
  it("returns a valid notice that starts switched off", () => {
    const e = readElection();
    expect(e.title).toBeTruthy();
    expect(e.positions.length).toBeGreaterThan(0);
    expect(isElectionLive(e, "2026-02-20")).toBe(false);
  });
});

describe("EDITABLE_PATHS (elections)", () => {
  it("lets the admin save the elections notice", () => {
    expect(EDITABLE_PATHS).toContain("content/elections.json");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/content.test.ts`
Expected: FAIL, because `readElection` is not exported.

- [ ] **Step 3: Implement**

Create `content/elections.json`:

```json
{
  "enabled": false,
  "showUntil": "2026-03-02",
  "title": "2026–2027 board elections",
  "intro": "JETAASE is looking for candidates for its 2026–2027 board. Anyone in our membership can run, and you don't need to live in Atlanta.\n\nBoard meetings are held online once a month for about an hour, and outgoing officers train whoever takes on their role.",
  "positions": [
    { "id": "pos-president", "title": "President", "description": "Provides overall leadership and strategy, presides over board meetings, and represents JETAASE externally." },
    { "id": "pos-vp", "title": "Vice President", "description": "Supports the President, helps move projects forward, and represents JETAASE when needed." },
    { "id": "pos-secretary", "title": "Secretary", "description": "Keeps records, shares meeting notes, and supports continuity across leadership changes." },
    { "id": "pos-social", "title": "Social Media Coordinator", "description": "Creates and schedules content, promotes events and alumni, and keeps an eye on engagement." },
    { "id": "pos-newsletter", "title": "Newsletter Editor", "description": "Gathers news and writes our email newsletter at least quarterly. No Constant Contact experience needed." },
    { "id": "pos-discord", "title": "Discord Coordinator", "description": "Manages and moderates our Discord server, organizes channels, and shares announcements." }
  ],
  "howToRun": "Email a platform of under 200 words to president@jetaase.org by the deadline. Introduce yourself (where and when you were on JET) and say what you'd like to accomplish as an officer. A headshot is optional.",
  "deadline": "2026-02-23",
  "timeline": "Feb 16–23: Self-nominations due\nFeb 25–27: Voting\nMar 2: New officers announced"
}
```

In `lib/content.ts`:
- Add `import { normalizeElection, type Election } from "./elections";`.
- Add `export const ELECTIONS_PATH = "content/elections.json";` next to the other paths, and include it in `EDITABLE_PATHS`.
- Add:

```ts
// One notice, not a list; normalized so a hand-edited file can't break pages.
export function readElection(): Election {
  return normalizeElection(JSON.parse(readRaw("elections.json")));
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all PASS, and tsc is clean. The existing `handleSave` tests still pass: the new path is only an allowlist entry.

- [ ] **Step 5: Checkpoint.** If the user says commit: `git add content/elections.json lib/content.ts lib/content.test.ts && git commit -m "feat(elections): add the elections notice content"`

---

### Task 3: Admin Elections tab

**Files:**
- Create: `app/admin/ElectionEditor.tsx`, `app/admin/ElectionEditor.module.css`, `app/admin/elections/page.tsx`
- Modify: `app/admin/AdminTabs.tsx`

**Interfaces:**
- Consumes:
  - from Task 1: `Election`, `ElectionPosition`, `validateElection`;
  - from Task 2: `readElection`, `ELECTIONS_PATH`;
  - existing: `saveBarMessage` and `saveErrorMessage` (`lib/editor-save.ts`), `movePhoto` (`lib/gallery.ts`, generic `<T>`), `readRaw`, `gitBlobSha`, `requireSession`, `ListEditor.module.css` classes (`section`, `header`, `title`, `fields`, `field`, `wide`, `hint`, `card`, `secondary`, `danger`, `primary`, `saveBar`, `saveBarError`, `saveBarText`).
- Produces: `<ElectionEditor initial={Election} path={string} base={Record<string, string>} />`

- [ ] **Step 1: Add the tab.** In `app/admin/AdminTabs.tsx`, add `{ href: "/admin/elections", label: "Elections" }` after People.

- [ ] **Step 2: Create `app/admin/elections/page.tsx`**

```tsx
import { requireSession } from "@/lib/auth-cookie";
import { readElection, readRaw, ELECTIONS_PATH } from "@/lib/content";
import { gitBlobSha } from "@/lib/git-sha";
import ElectionEditor from "../ElectionEditor";

export default async function ElectionsAdminPage() {
  // The layout shows the login form; this guards the data too.
  if (!(await requireSession())) return null;
  return (
    <ElectionEditor
      initial={readElection()} path={ELECTIONS_PATH}
      base={{ [ELECTIONS_PATH]: gitBlobSha(readRaw("elections.json")) }}
    />
  );
}
```

- [ ] **Step 3: Create `app/admin/ElectionEditor.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { saveBarMessage, saveErrorMessage, type SaveBody } from "@/lib/editor-save";
import { movePhoto as moveItem } from "@/lib/gallery"; // generic list move
import { validateElection, type Election, type ElectionPosition } from "@/lib/elections";
import list from "./ListEditor.module.css";
import styles from "./ElectionEditor.module.css";

const SAVED = "Saved. The site updates in about a minute.";
const MESSAGE = "chore(admin): update elections notice";

// One form for the single elections notice (content/elections.json).
export default function ElectionEditor({
  initial, path, base,
}: { initial: Election; path: string; base: Record<string, string> }) {
  const [e, setE] = useState(initial);
  const [baseShas, setBaseShas] = useState(base);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!dirty) return;
    const warn = (ev: BeforeUnloadEvent) => { ev.preventDefault(); ev.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update(fn: (prev: Election) => Election) {
    setE(fn);
    setDirty(true);
    setStatus("");
  }
  const set = <K extends keyof Election>(key: K, value: Election[K]) => update((p) => ({ ...p, [key]: value }));
  const setPositions = (fn: (ps: ElectionPosition[]) => ElectionPosition[]) =>
    update((p) => ({ ...p, positions: fn(p.positions) }));
  const setPosition = (id: string, key: "title" | "description", value: string) =>
    setPositions((ps) => ps.map((x) => (x.id === id ? { ...x, [key]: value } : x)));

  async function save() {
    const problem = validateElection(e);
    if (problem) return setStatus(`Error: ${problem}`);
    setSaving(true);
    setStatus("Saving…");
    try {
      const body: SaveBody = {
        files: [{ path, content: JSON.stringify(e, null, 2) + "\n" }],
        uploads: [], deletes: [], base: baseShas, message: MESSAGE,
      };
      let res: Response;
      try {
        res = await fetch("/api/github", {
          method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
        });
      } catch {
        return setStatus(`Error: ${saveErrorMessage(null)}`);
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setStatus(`Error: ${saveErrorMessage(res.status, data.error)}`);
      setBaseShas((b) => ({ ...b, ...data.blobShas }));
      setDirty(false);
      setStatus(SAVED);
    } finally {
      setSaving(false);
    }
  }

  const text = (key: "title" | "showUntil" | "deadline", label: string, opts: { type?: string; hint?: string; placeholder?: string } = {}) => (
    <label className={list.field}>
      <span>{label}</span>
      <input type={opts.type ?? "text"} value={e[key]} placeholder={opts.placeholder} onChange={(ev) => set(key, ev.target.value)} />
      {opts.hint && <small className={list.hint}>{opts.hint}</small>}
    </label>
  );
  const area = (key: "intro" | "howToRun" | "timeline", label: string, hint: string, rows = 4) => (
    <label className={`${list.field} ${list.wide}`}>
      <span>{label}</span>
      <textarea value={e[key]} rows={rows} onChange={(ev) => set(key, ev.target.value)} />
      <small className={list.hint}>{hint}</small>
    </label>
  );
  const barMessage = saveBarMessage({ dirty, saving, busy: false, status });

  return (
    <section className={list.section}>
      <div className={list.header}>
        <h2 className={list.title}>Elections notice</h2>
      </div>
      <fieldset disabled={saving} className={list.fieldset}>
        <div className={`${list.card} ${styles.card}`}>
          <label className={styles.toggle}>
            <input type="checkbox" checked={e.enabled} onChange={(ev) => set("enabled", ev.target.checked)} />
            <span>
              <strong>Show the elections notice</strong>
              <small className={list.hint}>Shows on Who We Are and as a homepage banner.</small>
            </span>
          </label>
          <div className={list.fields}>
            {text("showUntil", "Show until", { type: "date", hint: "Hides itself after this day. Leave empty to show until you switch it off." })}
            {text("deadline", "Nomination deadline", { type: "date", hint: "The banner says nominations are open until this day." })}
            {text("title", "Headline", { placeholder: "e.g. 2026–2027 board elections" })}
            {area("intro", "Intro", "Who can run and what the role involves. Leave a blank line between paragraphs.")}
          </div>

          <h3 className={styles.subhead}>Open positions</h3>
          {e.positions.length === 0 && <p className={list.hint}>No open positions yet.</p>}
          <ol className={styles.positions}>
            {e.positions.map((p, i) => (
              <li key={p.id} className={styles.position}>
                <input aria-label={`Role ${i + 1}`} placeholder="Role, e.g. Secretary" value={p.title} onChange={(ev) => setPosition(p.id, "title", ev.target.value)} />
                <input aria-label={`Description ${i + 1}`} placeholder="One line about what it involves" value={p.description} onChange={(ev) => setPosition(p.id, "description", ev.target.value)} />
                <span className={styles.posActions}>
                  <button type="button" onClick={() => setPositions((ps) => moveItem(ps, i, -1))} disabled={i === 0} aria-label="Move up">↑</button>
                  <button type="button" onClick={() => setPositions((ps) => moveItem(ps, i, 1))} disabled={i === e.positions.length - 1} aria-label="Move down">↓</button>
                  <button type="button" className={list.danger} onClick={() => setPositions((ps) => ps.filter((x) => x.id !== p.id))}>Remove</button>
                </span>
              </li>
            ))}
          </ol>
          <button
            type="button" className={list.secondary}
            onClick={() => setPositions((ps) => [...ps, { id: `pos${Date.now()}`, title: "", description: "" }])}
          >
            + Add position
          </button>

          <div className={`${list.fields} ${styles.after}`}>
            {area("howToRun", "How to run", "How to nominate yourself, and by when. Leave a blank line between paragraphs.")}
            {area("timeline", "Timeline", "One step per line, e.g. Feb 25–27: Voting", 3)}
          </div>
        </div>
      </fieldset>
      {barMessage && (
        <div className={`${list.saveBar} ${status.startsWith("Error") ? list.saveBarError : ""}`}>
          <span className={list.saveBarText} role="status"><strong>Elections notice</strong> · {barMessage}</span>
          <button className={list.primary} onClick={save} disabled={!dirty || saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Create `app/admin/ElectionEditor.module.css`**

```css
.card {
  padding: 1rem 1.25rem 1.25rem;
}
.toggle {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}
.toggle input {
  width: 1.1rem;
  height: 1.1rem;
  margin-top: 0.15rem;
}
.toggle span {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.subhead {
  margin: 1.5rem 0 0.5rem;
  font-size: 0.95rem;
}
.positions {
  list-style: none;
  padding: 0;
  margin: 0 0 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.position {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) auto;
  gap: 0.5rem;
  align-items: center;
}
.position input {
  padding: 0.45rem 0.6rem;
  border: 1px solid #d6cdb9;
  border-radius: 6px;
  font: inherit;
  font-size: 0.95rem;
  min-width: 0;
}
.posActions {
  display: flex;
  gap: 0.3rem;
}
.after {
  margin-top: 1.25rem;
}
@media (max-width: 640px) {
  .position {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Static checks**

Run: `npx tsc --noEmit && npx vitest run && npx eslint app/admin`
Expected: clean, with 0 errors. If `react-hooks/purity` flags `Date.now()` in the "+ Add position" handler, move it into a named `addPosition()` function, as `ListEditor.add()` does, and re-run.

- [ ] **Step 6: Browser check** (build, start on port 3100 with the dummy env, intercept `/api/github`, capture the body and reply 200 `{ commitUrl: "x", blobShas: {} }`). On `/admin/elections`:
1. The Elections tab is present and current. The form shows the initial content: six positions, switched off, and no save bar.
2. Tick the switch, clear the headline, and click Save in the bar. The bar shows "Error: Add a headline before switching the notice on." and nothing is captured.
3. Type a headline, add a position, leave its role empty, and Save. The bar shows "Error: Position 7: add the role."
4. Fill the role, move it up with ↑, remove "Discord Coordinator", set Show until to 2026-12-31, and Save. Check the captured body:
   - `files[0].path === "content/elections.json"`;
   - the parsed content has `enabled: true`, the new position at index 5, no Discord Coordinator, and `showUntil: "2026-12-31"`;
   - `base["content/elections.json"]` is present, `uploads` and `deletes` are `[]`, and the message is `chore(admin): update elections notice`.
5. The bar reads "Saved. The site updates in about a minute."

Take screenshots of the form at desktop width and at 390 px.

- [ ] **Step 7: Checkpoint.** If the user says commit: `git add app/admin/ElectionEditor.tsx app/admin/ElectionEditor.module.css app/admin/elections/page.tsx app/admin/AdminTabs.tsx && git commit -m "feat(admin): add an Elections tab to edit the elections notice"`

---

### Task 4: Who We Are section and homepage banner

**Files:**
- Create: `components/ElectionNotice.tsx` + `.module.css`, `components/ElectionBanner.tsx` + `.module.css`
- Modify: `app/who-we-are/page.tsx`, `app/page.tsx`

**Interfaces:**
- Consumes: `readElection` (Task 2); `isElectionLive`, `electionBanner`, `timelineSteps` (Task 1); `todayInEastern`, `toParagraphs` (`lib/events.ts`).
- Produces: `<ElectionNotice election={Election} />` and `<ElectionBanner text={string} />`.

- [ ] **Step 1: Create `components/ElectionNotice.tsx`**

```tsx
import { timelineSteps, type Election } from "@/lib/elections";
import { toParagraphs } from "@/lib/events";
import styles from "./ElectionNotice.module.css";

// The board elections call for nominations, shown on Who We Are while live.
export default function ElectionNotice({ election: e }: { election: Election }) {
  const steps = timelineSteps(e.timeline);
  return (
    <section id="elections" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.eyebrow}>Board elections</div>
        <h2 className={styles.title}>{e.title}</h2>
        {toParagraphs(e.intro).map((p, i) => <p key={i} className={styles.text}>{p}</p>)}
        {e.positions.length > 0 && (
          <>
            <h3 className={styles.subhead}>Open positions</h3>
            <ul className={styles.positions}>
              {e.positions.map((p) => (
                <li key={p.id}>
                  <strong>{p.title}</strong>
                  {p.description && <span> — {p.description}</span>}
                </li>
              ))}
            </ul>
          </>
        )}
        {e.howToRun.trim() && (
          <>
            <h3 className={styles.subhead}>How to run</h3>
            {toParagraphs(e.howToRun).map((p, i) => <p key={i} className={styles.text}>{p}</p>)}
          </>
        )}
        {steps.length > 0 && (
          <>
            <h3 className={styles.subhead}>Timeline</h3>
            <ul className={styles.timeline}>{steps.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `components/ElectionNotice.module.css`**

```css
.section {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 8px 40px 40px;
  scroll-margin-top: 96px;
}
.inner {
  background: #fff;
  border: 1px solid var(--border);
  border-left: 5px solid var(--red);
  border-radius: 14px;
  padding: 32px 36px;
  max-width: 820px;
}
.eyebrow {
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--red);
  margin-bottom: 10px;
}
.title {
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: 34px;
  margin: 0 0 14px;
  letter-spacing: -0.01em;
}
.text {
  font-size: 17px;
  line-height: 1.7;
  color: #3a352d;
  margin: 0 0 12px;
  white-space: pre-line;
}
.subhead {
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 24px 0 10px;
}
.positions,
.timeline {
  margin: 0;
  padding-left: 1.2em;
  font-size: 17px;
  line-height: 1.6;
  color: #3a352d;
}
.positions li,
.timeline li {
  margin-bottom: 6px;
}
@media (max-width: 768px) {
  .section {
    padding: 8px 16px 32px;
  }
  .inner {
    padding: 24px 20px;
  }
  .title {
    font-size: 28px;
  }
}
```

- [ ] **Step 3: Create `components/ElectionBanner.tsx` and its CSS**

```tsx
import Link from "next/link";
import styles from "./ElectionBanner.module.css";

// Homepage strip pointing to the elections notice on Who We Are.
export default function ElectionBanner({ text }: { text: string }) {
  return (
    <div className={styles.banner}>
      <p className={styles.inner}>
        <span>{text}</span>{" "}
        <Link href="/who-we-are#elections" className={styles.link}>See open positions →</Link>
      </p>
    </div>
  );
}
```

```css
.banner {
  background: #fff4e5;
  border-top: 1px solid #f3dcc0;
  border-bottom: 1px solid #f3dcc0;
}
.inner {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 12px 40px;
  font-size: 16px;
  color: var(--ink);
}
.link {
  font-weight: 700;
  color: var(--red);
  white-space: nowrap;
}
@media (max-width: 768px) {
  .inner {
    padding: 12px 16px;
    font-size: 15px;
  }
}
```

- [ ] **Step 4: Wire the pages**

`app/who-we-are/page.tsx`:
- Add these imports:
  - `ElectionNotice` from `@/components/ElectionNotice`
  - `readElection` (alongside `readBoard`/`readReps`)
  - `isElectionLive` from `@/lib/elections`
  - `todayInEastern` from `@/lib/events`
- Add, under the metadata:

```ts
// Re-render hourly so the elections notice hides itself after its date.
export const revalidate = 3600;
```

- At the top of the component:

```ts
  const election = readElection();
  const showElection = isElectionLive(election, todayInEastern(new Date()));
```

- Directly before `{/* OFFICERS */}`:

```tsx
      {showElection && <ElectionNotice election={election} />}
```

`app/page.tsx`:
- Add these imports:
  - `ElectionBanner` from `@/components/ElectionBanner`
  - `readElection` (alongside `readEvents`)
  - `isElectionLive` and `electionBanner` from `@/lib/elections`
- Compute `const today = todayInEastern(new Date());` once, and use it in the existing `splitEvents` call.
- Then:

```ts
  const election = readElection();
```

- Directly after `<Header />`:

```tsx
      {isElectionLive(election, today) && <ElectionBanner text={electionBanner(election, today)} />}
```

- [ ] **Step 5: Static checks**

Run: `npx tsc --noEmit && npx vitest run && npx eslint app components && npm run build`
Expected: clean, and the build succeeds.

- [ ] **Step 6: Browser check** with a temporary `content/elections.json`. Back it up to the scratchpad first.
1. **Notice on:** set `enabled: true`, `showUntil` to today + 30 days and `deadline` to today + 5 days. Rebuild and start.
   - The homepage shows the banner under the header: "Board elections: nominations are open until <Mon D>. See open positions →".
   - The link goes to `/who-we-are#elections`, and the section shows above Officers with the title, intro, 6 positions, How to run and Timeline.
   - Screenshot the banner and the section at 1280 px and 390 px.
2. **After the deadline:** set `deadline` to yesterday and rebuild. The banner reads "Board elections are underway."
3. **Past "Show until":** set `showUntil` to yesterday and rebuild. There's no banner and no section.
4. **Switched off:** set `enabled: false` and rebuild. There's no banner and no section.
5. **Clean up:** restore the backup and rebuild.

- [ ] **Step 7: Checkpoint.** If the user says commit: `git add components/ElectionNotice.tsx components/ElectionNotice.module.css components/ElectionBanner.tsx components/ElectionBanner.module.css app/who-we-are/page.tsx app/page.tsx && git commit -m "feat(elections): show the elections notice on Who We Are and as a homepage banner"`

---

### Task 5: Old blog redirects

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add redirects** to `nextConfig` (read `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/redirects.md` first):

```ts
  // The old Squarespace blog was only used for election posts.
  async redirects() {
    return [
      { source: "/blog", destination: "/who-we-are#elections", permanent: true },
      { source: "/blog/:path*", destination: "/who-we-are#elections", permanent: true },
    ];
  },
```

- [ ] **Step 2: Verify**

Run `npm run build`, start on port 3100, then:

```bash
curl -sI http://localhost:3100/blog | grep -iE "^(HTTP|location)"
curl -sI http://localhost:3100/blog/2026/2/12/2026-2027-jetaase-election-nominations | grep -iE "^(HTTP|location)"
curl -sI "http://localhost:3100/blog/tag/Elections" | grep -iE "^(HTTP|location)"
```

Expected: `308` with `location: /who-we-are#elections` for all three. `/who-we-are` itself still returns 200.

If the `#elections` fragment is dropped from `location`, record a ruling and fall back to `/who-we-are`. The cost is that visitors land at the top of the page.

- [ ] **Step 3: Checkpoint.** If the user says commit: `git add next.config.ts && git commit -m "feat: redirect the old blog to the elections notice"`

---

### Task 6: Final verification

- [ ] Run: `npx vitest run && npx tsc --noEmit && npm run lint && npm run build`. Expected: all green, with 0 lint errors.
- [ ] Run `git status --short`: only intended files, and no temporary content left behind.
- [ ] Report the screenshots and the redirect output to the user.
