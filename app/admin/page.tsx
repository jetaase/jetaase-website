import { requireSession } from "@/lib/auth-cookie";
import {
  readBoard, readReps, BOARD_PATH, REPS_PATH,
  type BoardMember, type SubchapterRep,
} from "@/lib/content";
import LoginForm from "./LoginForm";
import ListEditor, { type Field } from "./ListEditor";
import styles from "./page.module.css";

const BOARD_FIELDS: Field[] = [
  { key: "name", label: "Name" },
  { key: "role", label: "Role", placeholder: "e.g. Treasurer" },
  { key: "chapter", label: "State", options: ["AL", "GA", "NC", "SC"] },
  { key: "bio", label: "JET placement", placeholder: "e.g. Nagano Prefecture, 2017–2022" },
  { key: "email", label: "Email", placeholder: "e.g. treasurer@jetaase.org" },
  { key: "photo", label: "Photo path", placeholder: "/images/board/name.jpg" },
];

const REP_FIELDS: Field[] = [
  { key: "name", label: "Name" },
  { key: "state", label: "State", options: ["Alabama", "Georgia", "North Carolina", "South Carolina"] },
  { key: "city", label: "City (optional)", placeholder: "e.g. Charlotte" },
  { key: "placement", label: "JET placement", placeholder: "e.g. Kyoto Prefecture, 2022–2024" },
  { key: "email", label: "Email" },
  { key: "photo", label: "Photo path", placeholder: "/images/board/name.jpg" },
];

const BLANK_MEMBER: Omit<BoardMember, "id" | "order"> = {
  name: "", role: "", chapter: "GA", bio: "", email: "",
  photo: "/images/board-placeholder.png",
};

const BLANK_REP: Omit<SubchapterRep, "id" | "order"> = {
  name: "", state: "Georgia", city: "", placement: "", email: "",
  photo: "/images/board-placeholder.png",
};

export default async function AdminPage() {
  const authed = await requireSession();
  if (!authed) {
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
      <ListEditor
        title="Officers" itemLabel="officer" idPrefix="m"
        path={BOARD_PATH} commitMessage="chore(admin): update board members"
        fields={BOARD_FIELDS} blank={BLANK_MEMBER} initial={readBoard()}
      />
      <ListEditor
        title="Subchapter representatives" itemLabel="representative" idPrefix="r"
        path={REPS_PATH} commitMessage="chore(admin): update subchapter reps"
        fields={REP_FIELDS} blank={BLANK_REP} initial={readReps()}
      />
    </main>
  );
}
