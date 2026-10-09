import Eyebrow from "./Eyebrow";
import styles from "./Hero.module.css";

export default function Hero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <section className={styles.hero}>
      {eyebrow && <Eyebrow size="hero">{eyebrow}</Eyebrow>}
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </section>
  );
}
