import type { BoardMember } from "@/lib/content";
import EmailLink from "./EmailLink";
import styles from "./BoardGrid.module.css";
import { headshotSrc } from "@/lib/uploads";

export default function BoardGrid({ members }: { members: BoardMember[] }) {
  return (
    <div className={styles.grid}>
      {members.map((m) => (
        <article key={m.id} className={styles.card}>
          <img src={headshotSrc(m.photo)} alt={m.name} className={styles.photo} />
          <h3 className={styles.name}>{m.name}</h3>
          <div className={styles.role}>
            {m.role} · {m.chapter}
          </div>
          {/* Always render these slots so each card keeps the same rows. */}
          <p className={styles.bio}>{m.bio}</p>
          {m.email ? (
            <EmailLink email={m.email} className={styles.email} />
          ) : (
            <span />
          )}
        </article>
      ))}
    </div>
  );
}
