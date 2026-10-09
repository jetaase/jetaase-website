import Link from "next/link";
import styles from "./ElectionBanner.module.css";

// Homepage strip pointing to the elections notice on Who We Are.
export default function ElectionBanner({ text }: { text: string }) {
  return (
    <div className={styles.banner}>
      <p className={styles.inner}>
        <span>{text}</span>{" "}
        <Link href="/who-we-are#elections" className={styles.link}>See open positions →</Link>
      </p>
    </div>
  );
}
