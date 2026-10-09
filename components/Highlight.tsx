import styles from "./Highlight.module.css";

// The thick blue underline under one word of a heading.
export default function Highlight({ children }: { children: React.ReactNode }) {
  return <span className={styles.highlight}>{children}</span>;
}
