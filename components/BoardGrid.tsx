import type { BoardMember } from "@/lib/content";
import styles from "./BoardGrid.module.css";

export default function BoardGrid({ members }: { members: BoardMember[] }) {
  return (
    <div className={styles.grid}>
      {members.map((m) => (
        <article key={m.id} className={styles.card}>
          <img src={m.photo} alt={m.name} className={styles.photo} />
          <h3 className={styles.name}>{m.name}</h3>
          <div className={styles.role}>
            {m.role} · {m.chapter}
          </div>
          {m.bio && <p className={styles.bio}>{m.bio}</p>}
          {m.email && (
            <a href={`mailto:${m.email}`} className={styles.email}>
              {m.email}
            </a>
          )}
        </article>
      ))}
    </div>
  );
}
