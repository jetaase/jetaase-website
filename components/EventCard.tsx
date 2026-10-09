import Link from "next/link";
import { formatEventDate, photoCountLabel, type JetaaseEvent } from "@/lib/events";
import Poster from "./Poster";
import styles from "./EventCard.module.css";

export default function EventCard({ event, size = "default" }: { event: JetaaseEvent; size?: "default" | "small" }) {
  const small = size === "small";
  const when = formatEventDate(event.date, small ? "month" : "day");
  const meta = [when, event.location.toUpperCase()].filter(Boolean).join(" · ");
  const photos = small ? event.photos.length : 0; // only past ("Looking back") cards show it
  return (
    <Link href={`/events/${event.slug}`} className={`${styles.card} ${small ? styles.small : ""}`}>
      <div className={styles.posterWrap}>
        <Poster event={event} />
        {photos > 0 && <span className={styles.photoBadge}>{photoCountLabel(photos)}</span>}
      </div>
      <div className={styles.body}>
        <div className={styles.date}>{meta}</div>
        <div className={styles.title}>{event.title}</div>
        {!small && event.summary && <div className={styles.summary}>{event.summary}</div>}
      </div>
    </Link>
  );
}
