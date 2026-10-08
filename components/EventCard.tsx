import Link from "next/link";
import { formatEventDate, type JetaaseEvent } from "@/lib/events";
import Poster from "./Poster";
import styles from "./EventCard.module.css";

export default function EventCard({ event, size = "default" }: { event: JetaaseEvent; size?: "default" | "small" }) {
  const small = size === "small";
  const when = formatEventDate(event.date, small ? "month" : "day");
  const meta = [when, event.location.toUpperCase()].filter(Boolean).join(" · ");
  return (
    <Link href={`/events/${event.slug}`} className={`${styles.card} ${small ? styles.small : ""}`}>
      <Poster event={event} />
      <div className={styles.body}>
        <div className={styles.date}>{meta}</div>
        <div className={styles.title}>{event.title}</div>
        {!small && event.summary && <div className={styles.summary}>{event.summary}</div>}
      </div>
    </Link>
  );
}
