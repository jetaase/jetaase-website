import Link from "next/link";
import styles from "./NewsletterPrompt.module.css";

// The newsletter is part of membership, so this links to /join.
export default function NewsletterPrompt({ empty }: { empty?: boolean }) {
  return (
    <p className={`${styles.prompt} ${empty ? styles.empty : ""}`}>
      {empty ? "Nothing on the calendar yet. " : "Want the full list? "}
      <Link href="/join" className={styles.link}>
        {empty ? "Get the newsletter to hear first →" : "Get the newsletter →"}
      </Link>
    </p>
  );
}
