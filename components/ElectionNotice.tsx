import { openPositions, timelineSteps, type Election } from "@/lib/elections";
import { toParagraphs } from "@/lib/events";
import Eyebrow from "./Eyebrow";
import styles from "./ElectionNotice.module.css";

// The board elections call for nominations, shown on Who We Are while live.
export default function ElectionNotice({ election: e }: { election: Election }) {
  const steps = timelineSteps(e.timeline);
  const positions = openPositions(e);
  return (
    <section id="elections" className={styles.section}>
      <div className={styles.inner}>
        <Eyebrow>Get involved</Eyebrow>
        <h2 className={styles.title}>{e.title}</h2>
        {toParagraphs(e.intro).map((p, i) => <p key={i} className={styles.text}>{p}</p>)}
        {positions.length > 0 && (
          <>
            <h3 className={styles.subhead}>Open positions</h3>
            {/* Native <details>: roles scan at a glance, descriptions open on click, no JS. */}
            <ul className={styles.positions}>
              {positions.map((p) => (
                <li key={p.id}>
                  {p.description ? (
                    <details className={styles.position}>
                      <summary className={styles.positionTitle}>{p.title}</summary>
                      <p className={styles.positionText}>{p.description}</p>
                    </details>
                  ) : (
                    <div className={`${styles.position} ${styles.positionTitle}`}>{p.title}</div>
                  )}
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
