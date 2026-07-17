import { readFileSync } from "node:fs";
import { join } from "node:path";

export type Chapter = "AL" | "GA" | "NC" | "SC";
export type BoardMember = {
  id: string; name: string; role: string;
  chapter: Chapter; bio: string; photo: string; order: number;
};

const CONTENT_DIR = join(process.cwd(), "content");

export function readBoard(): BoardMember[] {
  const raw = readFileSync(join(CONTENT_DIR, "board.json"), "utf8");
  const members = JSON.parse(raw) as BoardMember[];
  return members.slice().sort((a, b) => a.order - b.order);
}
