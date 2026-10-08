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

// Today's date where the events happen, as YYYY-MM-DD. Built from parts,
// since locales' short-date patterns differ between browser versions.
export function todayInEastern(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
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
  // slugify falls back to "photo" when nothing is left (e.g. a Japanese-only title).
  const name = /[a-z0-9]/i.test(title.normalize("NFKD")) ? slugify(title) : "event";
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
