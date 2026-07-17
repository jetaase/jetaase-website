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
          <p className={styles.bio}>{m.bio}</p>
        </article>
      ))}
    </div>
  );
}
