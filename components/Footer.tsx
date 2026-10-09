import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.about}>
          <div className={styles.brandRow}>
            <img
              src="/images/b92ef44c-b122-4564-a847-083e7705cc55.png"
              alt="JETAASE"
              className={styles.logo}
            />
          </div>
          <p className={styles.blurb}>
            The JET Program Alumni Association of the Southeast. Chapter 4 of
            USJETAA, serving AL, GA, NC &amp; SC since the early 1990s.
          </p>
          <a href="mailto:info@jetaase.org" className={styles.email}>
            info@jetaase.org
          </a>
        </div>
        <div className={styles.columns}>
          <div className={styles.column}>
            <div className={styles.columnHeading}>About</div>
            <Link href="/who-we-are" className={styles.columnLink}>
              Who we are
            </Link>
            <Link href="/who-we-are#officers" className={styles.columnLink}>
              Officers
            </Link>
            <Link href="/resources" className={styles.columnLink}>
              Japan resources
            </Link>
            <a href="#" className={styles.columnLink}>
              Job listings
            </a>
          </div>
          <div className={styles.column}>
            <div className={styles.columnHeading}>Connect</div>
            <Link href="/events" className={styles.columnLink}>
              Events
            </Link>
            <Link href="/join" className={styles.columnLink}>
              Join
            </Link>
            <a
              href="https://facebook.com/jetaase"
              className={styles.columnLink}
            >
              Facebook
            </a>
            <a
              href="https://instagram.com/jetaase"
              className={styles.columnLink}
            >
              Instagram
            </a>
            <a
              href="https://www.jetaase.org/blog"
              className={styles.columnLink}
            >
              Blog
            </a>
          </div>
        </div>
      </div>
      <div className={styles.bottomBar}>
        <div className={styles.bottomInner}>
          © 2026 JETAASE · Connect. Remember. Engage.
        </div>
      </div>
    </footer>
  );
}
