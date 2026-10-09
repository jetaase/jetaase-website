import styles from "./Eyebrow.module.css";

// Small mono caps label above a heading. "hero" is the larger one above a page title.
export default function Eyebrow({
  children,
  size = "section",
  tone = "red",
}: {
  children: React.ReactNode;
  size?: "hero" | "section";
  tone?: "red" | "gold" | "inherit"; // inherit: take the surrounding text color (colored cards)
}) {
  return <div className={`${styles.eyebrow} ${styles[size]} ${styles[tone]}`}>{children}</div>;
}
