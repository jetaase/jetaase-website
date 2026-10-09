import Button from "./Button";
import styles from "./JoinCta.module.css";

// Full-width blue band asking people to join, near the bottom of a page.
export default function JoinCta({
  title = "Ready to reconnect?",
  text = "Membership is free and takes two minutes. Join alumni across the Southeast and stay in the loop on events, jobs, and reunions.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className={styles.band}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.text}>{text}</p>
        </div>
        <Button href="/join" variant="navy" size="lg">
          Join JETAASE →
        </Button>
      </div>
    </section>
  );
}
