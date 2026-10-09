import { readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeEvent, normalizePartner, type JetaaseEvent, type PartnerEvent } from "./events";
import { sortReps } from "./reps";
import { normalizeElection, type Election } from "./elections";

export type Chapter = "AL" | "GA" | "NC" | "SC";
export type BoardMember = {
  id: string; name: string; role: string;
  chapter: Chapter; bio: string; photo: string; order: number;
  email?: string;
};

export type State = "Alabama" | "Georgia" | "North Carolina" | "South Carolina";
export type SubchapterRep = {
  id: string; name: string; state: State; city?: string;
  placement: string; email: string; photo: string; order: number;
};

// Files the admin is allowed to commit through /api/github.
export const BOARD_PATH = "content/board.json";
export const REPS_PATH = "content/subchapter-reps.json";
export const EVENTS_PATH = "content/events.json";
export const PARTNERS_PATH = "content/partner-events.json";
export const ELECTIONS_PATH = "content/elections.json";
export const EDITABLE_PATHS = [BOARD_PATH, REPS_PATH, EVENTS_PATH, PARTNERS_PATH, ELECTIONS_PATH];

const CONTENT_DIR = join(process.cwd(), "content");

export function readRaw(file: string): string {
  return readFileSync(join(CONTENT_DIR, file), "utf8");
}

function readSorted<T extends { order: number }>(file: string): T[] {
  const items = JSON.parse(readRaw(file)) as T[];
  return items.slice().sort((a, b) => a.order - b.order);
}

export function readBoard(): BoardMember[] {
  return readSorted<BoardMember>("board.json");
}

// Sorted by state, not by `order` (see lib/reps.ts).
export function readReps(): SubchapterRep[] {
  return sortReps(JSON.parse(readRaw("subchapter-reps.json")) as SubchapterRep[]);
}

// Unsorted: pages split and sort events by date (see lib/events.ts).
export function readEvents(): JetaaseEvent[] {
  return (JSON.parse(readRaw("events.json")) as Partial<JetaaseEvent>[]).map(normalizeEvent);
}

export function readPartnerEvents(): PartnerEvent[] {
  return (JSON.parse(readRaw("partner-events.json")) as Partial<PartnerEvent>[]).map(normalizePartner);
}

// One notice, not a list; normalized so a hand-edited file can't break pages.
export function readElection(): Election {
  return normalizeElection(JSON.parse(readRaw("elections.json")));
}
