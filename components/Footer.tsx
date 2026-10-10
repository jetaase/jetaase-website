import Image from "next/image";
import Link from "next/link";
import { FACEBOOK_URL, INFO_EMAIL, INSTAGRAM_URL } from "@/lib/site";
import styles from "./Footer.module.css";

// Explore mirrors the header nav, so every main page is one click away from the bottom too.
const EXPLORE = [
  { href: "/who-we-are", label: "Who we are" },
  { href: "/events", label: "Events" },
  { href: "/subchapters", label: "Subchapters" },
  { href: "/resources", label: "Resources" },
  { href: "/join", label: "Join us" },
];

const SHORTCUTS = [
  { href: "/who-we-are#officers", label: "Officers" },
  { href: "/resources#careers", label: "Job listings" },
  { href: "/events#culture", label: "Culture near you" },
];

const FOLLOW = [
  { href: FACEBOOK_URL, label: "Facebook" },
  { href: INSTAGRAM_URL, label: "Instagram" },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.about}>
          <div className={styles.brandRow}>
            <Image
              src="/images/b92ef44c-b122-4564-a847-083e7705cc55.png"
              alt=""
              width={44}
              height={44}
              className={styles.logo}
            />
            <span className={styles.wordmark}>JETAASE</span>
          </div>
          <p className={styles.blurb}>
            The JET Alumni Association of the Southeast, serving AL, GA, NC &amp; SC
            since the early 1990s.
          </p>
          <a href={`mailto:${INFO_EMAIL}`} className={styles.email}>
            {INFO_EMAIL}
          </a>
        </div>
        <div className={styles.columns}>
          <div className={styles.column}>
            <div className={styles.columnHeading}>Explore</div>
            {EXPLORE.map((l) => (
              <Link key={l.href} href={l.href} className={styles.columnLink}>{l.label}</Link>
            ))}
          </div>
          <div className={styles.column}>
            <div className={styles.columnHeading}>Shortcuts</div>
            {SHORTCUTS.map((l) => (
              <Link key={l.href} href={l.href} className={styles.columnLink}>{l.label}</Link>
            ))}
          </div>
          <div className={styles.column}>
            <div className={styles.columnHeading}>Follow us</div>
            {FOLLOW.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className={styles.columnLink}>
                {l.label} ↗
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.bottomBar}>
        <div className={styles.bottomInner}>
          © {new Date().getFullYear()} JETAASE · Connect. Remember. Engage.
        </div>
      </div>
    </footer>
  );
}
