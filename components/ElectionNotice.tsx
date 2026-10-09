import { timelineSteps, type Election } from "@/lib/elections";
import { toParagraphs } from "@/lib/events";
import styles from "./ElectionNotice.module.css";

// The board elections call for nominations, shown on Who We Are while live.
export default function ElectionNotice({ election: e }: { election: Election }) {
  const steps = timelineSteps(e.timeline);
  return (
    <section id="elections" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.eyebrow}>Board elections</div>
        <h2 className={styles.title}>{e.title}</h2>
        {toParagraphs(e.intro).map((p, i) => <p key={i} className={styles.text}>{p}</p>)}
        {e.positions.length > 0 && (
          <>
            <h3 className={styles.subhead}>Open positions</h3>
            <ul className={styles.positions}>
              {e.positions.map((p) => (
                <li key={p.id}>
                  <strong>{p.title}</strong>
                  {p.description && <span> — {p.description}</span>}
                </li>
              ))}
            </ul>
          </>
        )}
        {e.howToRun.trim() && (
          <>
            <h3 className={styles.subhead}>How to run</h3>
            {toParagraphs(e.howToRun).map((p, i) => <p key={i} className={styles.text}>{p}</p>)}
          </>
        )}
        {steps.length > 0 && (
          <>
            <h3 className={styles.subhead}>Timeline</h3>
            <ul className={styles.timeline}>{steps.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </>
        )}
      </div>
    </section>
  );
}
