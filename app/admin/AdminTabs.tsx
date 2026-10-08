"use client";
import { usePathname } from "next/navigation";
import styles from "./AdminTabs.module.css";

const TABS = [
  { href: "/admin/events", label: "Events" },
  { href: "/admin/people", label: "People" },
];

// Plain <a>, not next/link: a full page load fires the editors'
// unsaved-changes warning, and client navigation would silently drop edits.
export default function AdminTabs() {
  const path = usePathname();
  return (
    <nav className={styles.tabs} aria-label="Admin sections">
      {TABS.map((t) => (
        <a key={t.href} href={t.href} className={styles.tab} aria-current={path === t.href ? "page" : undefined}>
          {t.label}
        </a>
      ))}
    </nav>
  );
}
