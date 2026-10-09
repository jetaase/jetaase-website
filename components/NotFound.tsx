import Hero from "./Hero";
import Button from "./Button";
import EmailLink from "./EmailLink";
import { INFO_EMAIL } from "@/lib/site";
import styles from "./NotFound.module.css";

// The 404 message and ways out, shared by app/not-found.tsx (unknown URLs)
// and app/(site)/not-found.tsx (e.g. an event slug that doesn't exist).
export default function NotFound() {
  return (
    <>
      <Hero
        eyebrow="404 · Page not found"
        title="We couldn't find that page"
        subtitle="The link may be old, or the page may have moved. Try one of these instead."
      />
      <div className={styles.body}>
        <div className={styles.actions}>
          <Button href="/">Go to the homepage</Button>
          <Button href="/events" variant="ghost">Events</Button>
          <Button href="/subchapters" variant="ghost">Subchapters</Button>
          <Button href="/resources" variant="ghost">Resources</Button>
        </div>
        <p className={styles.help}>
          Still stuck? Email us at <EmailLink email={INFO_EMAIL} />
        </p>
      </div>
    </>
  );
}
