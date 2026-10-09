import Eyebrow from "./Eyebrow";
import styles from "./CalloutBox.module.css";

// A boxed "copy on the left, action on the right" section.
// filled: tan background. dashed: an invitation (suggest an event or link). outlined: white card.
export default function CalloutBox({
  variant = "filled",
  eyebrow,
  title,
  text,
  action,
}: {
  variant?: "filled" | "dashed" | "outlined";
  eyebrow?: string;
  title: string;
  text?: string;
  action: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={`${styles.box} ${styles[variant]}`}>
        <div className={styles.copy}>
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h2 className={styles.title}>{title}</h2>
          {text && <p className={styles.text}>{text}</p>}
        </div>
        {action}
      </div>
    </section>
  );
}
