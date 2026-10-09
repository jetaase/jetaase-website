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
// `today` catches last year's "Show until" date, which would save fine but never show.
export function validateElection(e: Election, today: string): string | null {
  if (e.enabled && !e.title.trim()) return "Add a headline before switching the notice on.";
  const missing = e.positions.findIndex((p) => !p.title.trim());
  if (missing >= 0) return `Position ${missing + 1}: add the role.`;
  if (e.showUntil && !isValidDate(e.showUntil)) return "Pick a valid “Show until” date.";
  if (e.deadline && !isValidDate(e.deadline)) return "Pick a valid nomination deadline.";
  if (e.enabled && e.showUntil && e.showUntil < today) {
    return "The “Show until” date has passed. Pick a later day or clear it.";
  }
  return null;
}

export function timelineSteps(text: string): string[] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}
