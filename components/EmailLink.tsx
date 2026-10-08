import styles from "./EmailLink.module.css";

// Red "✉ address" link used on officer, rep, and subchapter cards.
// Pass className for per-card size and spacing.
export default function EmailLink({ email, className }: { email: string; className?: string }) {
  return (
    <a href={`mailto:${email}`} className={`${styles.link} ${className ?? ""}`}>
      <span aria-hidden="true">✉</span>
      <span className={styles.address}>{email}</span>
    </a>
  );
}
