import Link from "next/link";
import styles from "./Header.module.css";

const NAV = [
  { href: "/who-we-are", label: "Who we are" },
  { href: "/events", label: "Events" },
  { href: "/subchapters", label: "Subchapters" },
  { href: "/resources", label: "Resources" },
];

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <img
            src="/images/b92ef44c-b122-4564-a847-083e7705cc55.png"
            alt="JETAASE"
            className={styles.logo}
          />
        </Link>
        <nav className={styles.nav}>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={styles.link}>
              {n.label}
            </Link>
          ))}
          <Link href="/join" className={styles.joinBtn}>
            Join us
          </Link>
        </nav>
      </div>
    </header>
  );
}
