import { requireSession } from "@/lib/auth-cookie";
import { readBoard } from "@/lib/content";
import LoginForm from "./LoginForm";
import BoardEditor from "./BoardEditor";
import styles from "./page.module.css";

export default async function AdminPage() {
  const authed = await requireSession();
  return (
    <main className={styles.wrap}>
      <h1>JETAASE Admin</h1>
      {authed ? <BoardEditor initial={readBoard()} /> : <LoginForm />}
    </main>
  );
}
