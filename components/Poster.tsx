import { dateParts, type JetaaseEvent } from "@/lib/events";
import styles from "./Poster.module.css";

// Posters are square or portrait flyers: always shown whole in a 4:5 frame.
export default function Poster({
  event, className, priority,
}: {
  event: Pick<JetaaseEvent, "poster" | "title" | "date">;
  className?: string;
  priority?: boolean; // above the fold: don't lazy-load
}) {
  const { month, day } = dateParts(event.date);
  return (
    <div className={`${styles.frame} ${className ?? ""}`}>
      {event.poster ? (
        <img
          src={event.poster} alt={`Poster for ${event.title}`} className={styles.img}
          loading={priority ? "eager" : "lazy"}
        />
      ) : (
        <div className={styles.blank} aria-hidden="true">
          <span className={styles.month}>{month}</span>
          <span className={styles.day}>{day}</span>
        </div>
      )}
    </div>
  );
}
