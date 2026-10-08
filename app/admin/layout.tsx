import type { Metadata } from "next";
import { requireSession } from "@/lib/auth-cookie";
import LoginForm from "./LoginForm";
import AdminTabs from "./AdminTabs";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Admin" };

// Plain <a>, like the tabs: a full page load lets the editors warn about unsaved changes.
// eslint-disable-next-line @next/next/no-html-link-for-pages -- full load keeps the unsaved-changes warning
const backToSite = <a href="/" className={styles.back}>← Back to site</a>;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await requireSession())) {
    return (
      <main className={styles.login}>
        {backToSite}
        <h1>JETAASE Admin</h1>
        <LoginForm />
      </main>
    );
  }
  return (
    <main className={styles.editor}>
      {backToSite}
      <h1 className={styles.heading}>JETAASE Admin</h1>
      <p className={styles.intro}>
        Changes go live about a minute after you save. Each section saves separately.
      </p>
      <AdminTabs />
      {children}
    </main>
  );
}
