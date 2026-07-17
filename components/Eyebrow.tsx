import styles from "./Eyebrow.module.css";
export default function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className={styles.eyebrow}>{children}</div>;
}
