import styles from "./IconTile.module.css";

// Rounded square behind an icon. md (46px) beside headings, sm (36px) in lists.
export default function IconTile({
  tone = "tan",
  size = "md",
  children,
}: {
  tone?: "tan" | "blue" | "red" | "white";
  size?: "sm" | "md";
  children: React.ReactNode;
}) {
  return <span className={`${styles.tile} ${styles[tone]} ${styles[size]}`}>{children}</span>;
}
