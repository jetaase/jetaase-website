import { requireSession } from "@/lib/auth-cookie";
import LoginForm from "./LoginForm";
import AdminTabs from "./AdminTabs";
import styles from "./page.module.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await requireSession())) {
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
      <AdminTabs />
      {children}
    </main>
  );
}
