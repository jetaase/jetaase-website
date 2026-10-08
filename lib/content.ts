import { readFileSync } from "node:fs";
import { join } from "node:path";

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
export const EDITABLE_PATHS = [BOARD_PATH, REPS_PATH];

const CONTENT_DIR = join(process.cwd(), "content");

function readSorted<T extends { order: number }>(file: string): T[] {
  const raw = readFileSync(join(CONTENT_DIR, file), "utf8");
  const items = JSON.parse(raw) as T[];
  return items.slice().sort((a, b) => a.order - b.order);
}

export function readBoard(): BoardMember[] {
  return readSorted<BoardMember>("board.json");
}

export function readReps(): SubchapterRep[] {
  return readSorted<SubchapterRep>("subchapter-reps.json");
}
