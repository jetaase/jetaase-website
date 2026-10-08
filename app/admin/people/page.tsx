import { requireSession } from "@/lib/auth-cookie";
import {
  readBoard, readReps, readRaw, BOARD_PATH, REPS_PATH,
  type BoardMember, type SubchapterRep,
} from "@/lib/content";
import { gitBlobSha } from "@/lib/git-sha";
import ListEditor, { type Field } from "../ListEditor";

const BOARD_FIELDS: Field[] = [
  { key: "role", label: "Role", placeholder: "e.g. Treasurer" },
  { key: "name", label: "Name" },
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
        title="Officers" itemLabel="role" idPrefix="m" titleKey="role"
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
