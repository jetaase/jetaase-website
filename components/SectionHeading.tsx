import Link from "next/link";
import Eyebrow from "./Eyebrow";
import styles from "./SectionHeading.module.css";

// Heading block at the top of a section: optional eyebrow and icon, the title,
// an optional intro line, and an optional "See all →" style link on the right.
export default function SectionHeading({
  eyebrow,
  title,
  intro,
  icon,
  link,
  size = "md",
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  icon?: React.ReactNode;
  link?: { href: string; label: string };
  size?: "md" | "sm";
  as?: "h2" | "h3";
}) {
  const external = link && /^https?:/.test(link.href);
  return (
    <div className={styles.heading}>
      <div className={styles.main}>
        {icon}
        <div>
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <Tag className={`${styles.title} ${styles[size]}`}>{title}</Tag>
          {intro && <p className={styles.intro}>{intro}</p>}
        </div>
      </div>
      {link &&
        (external ? (
          <a href={link.href} target="_blank" rel="noopener noreferrer" className={styles.link}>{link.label}</a>
        ) : (
          <Link href={link.href} className={styles.link}>{link.label}</Link>
        ))}
    </div>
  );
}
