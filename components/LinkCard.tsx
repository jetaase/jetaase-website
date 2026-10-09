import Link from "next/link";
import styles from "./LinkCard.module.css";

// White bordered card that links somewhere. Outside links open in a new tab and show ↗.
// compact: a single row with just the title, for stacked lists.
export default function LinkCard({
  href,
  title,
  description,
  icon,
  compact,
}: {
  href: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  compact?: boolean;
}) {
  const external = /^https?:/.test(href);
  const cls = `${styles.card} ${compact ? styles.compact : ""}`;
  const body = (
    <>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.titleRow}>
        <span className={styles.title}>{title}</span>
        {external && <span className={styles.arrow} aria-hidden="true">↗</span>}
      </span>
      {description && !compact && <span className={styles.desc}>{description}</span>}
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>
  ) : (
    <Link href={href} className={cls}>{body}</Link>
  );
}
