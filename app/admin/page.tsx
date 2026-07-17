import { requireSession } from "@/lib/auth-cookie";
import LoginForm from "./LoginForm";
import styles from "./page.module.css";

export default async function AdminPage() {
  const authed = await requireSession();
  return (
    <main className={styles.wrap}>
      <h1>JETAASE Admin</h1>
      {authed ? <p>Signed in. (Board editor added in Task 13.)</p> : <LoginForm />}
    </main>
  );
}
