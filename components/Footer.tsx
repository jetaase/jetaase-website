import Link from "next/link";
import { FACEBOOK_URL, INFO_EMAIL, INSTAGRAM_URL } from "@/lib/site";
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
            The JET Alumni Association of the Southeast, serving AL, GA, NC &amp; SC
            since the early 1990s.
          </p>
          <a href={`mailto:${INFO_EMAIL}`} className={styles.email}>
            {INFO_EMAIL}
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
            <Link href="/resources#careers" className={styles.columnLink}>
              Job listings
            </Link>
          </div>
          <div className={styles.column}>
            <div className={styles.columnHeading}>Connect</div>
            <Link href="/events" className={styles.columnLink}>
              Events
            </Link>
            <Link href="/subchapters" className={styles.columnLink}>
              Subchapters
            </Link>
            <Link href="/join" className={styles.columnLink}>
              Join
            </Link>
            <a
              href={FACEBOOK_URL}
              className={styles.columnLink}
            >
              Facebook
            </a>
            <a
              href={INSTAGRAM_URL}
              className={styles.columnLink}
            >
              Instagram
            </a>
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
