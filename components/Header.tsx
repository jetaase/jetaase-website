import Link from "next/link";
import HeaderNav from "./HeaderNav";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <img
            src="/images/b92ef44c-b122-4564-a847-083e7705cc55.png"
            alt=""
            className={styles.logo}
          />
          <span className={styles.wordmark}>
            <span className={styles.wordmarkName}>JETAASE</span>
            <span className={styles.wordmarkFull}>
              JET Alumni Association of the Southeast
            </span>
          </span>
        </Link>
        <HeaderNav />
      </div>
    </header>
  );
}
