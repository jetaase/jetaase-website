"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "./Button";
import { CloseIcon, MenuIcon } from "./icons";
import styles from "./Header.module.css";

const NAV = [
  { href: "/who-we-are", label: "Who we are" },
  { href: "/events", label: "Events" },
  { href: "/subchapters", label: "Subchapters" },
  { href: "/resources", label: "Resources" },
];

// Site nav. On phones the links fold into a Menu button; "Join us" stays visible.
// The current section is marked with aria-current (an event page counts as Events).
export default function HeaderNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <nav
      className={styles.nav}
      aria-label="Main"
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
    >
      <ul id="site-menu" className={`${styles.links} ${open ? styles.open : ""}`}>
        {NAV.map((n) => {
          const current = path === n.href || path.startsWith(`${n.href}/`);
          return (
            <li key={n.href}>
              <Link
                href={n.href} className={styles.link} onClick={close}
                aria-current={current ? "page" : undefined}
              >
                {n.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <Button href="/join" size="sm">
        Join us
      </Button>
      <button
        type="button" className={styles.menuBtn}
        aria-expanded={open} aria-controls="site-menu"
        onClick={() => setOpen(!open)}
      >
        {open ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
        <span className={styles.menuLabel}>{open ? "Close" : "Menu"}</span>
      </button>
    </nav>
  );
}
