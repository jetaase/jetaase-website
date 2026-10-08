import styles from "./CultureBand.module.css";

// Each state's Japan-America society. The Events page links to their event
// calendars; the Resources page links to their homepages.
export const CULTURE_LINKS = [
  {
    name: "Japan-America Society of Georgia",
    state: "Georgia",
    homepage: "https://www.jasgeorgia.org/",
    events: "https://www.jasgeorgia.org/page-18213?EventViewMode=1&EventListViewMode=1",
  },
  {
    name: "Japan-America Society of Alabama",
    state: "Alabama",
    homepage: "https://japanalabama.com/",
    events: "https://japanalabama.com/Events",
  },
  {
    name: "Japan-America Society of North Carolina",
    state: "North Carolina",
    homepage: "https://www.jasnc.org/",
    events: "https://www.jasnc.org/calendar",
  },
  {
    name: "Japan-America Association of South Carolina",
    state: "South Carolina",
    homepage: "https://jaasc.org/",
    events: "https://jaasc.org/events/",
  },
];

export function CultureIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  );
}

export default function CultureBand() {
  return (
    <section id="culture" className={styles.section}>
      <div className={styles.band}>
        <div className={styles.copy}>
          <span className={styles.icon}>
            <CultureIcon />
          </span>
          <h2 className={styles.title}>Culture near you</h2>
          <p className={styles.text}>
            Festivals, cultural events, and matsuri across the Southeast so you
            never have to miss home. Each state&apos;s Japan-America society
            keeps a calendar of what&apos;s coming up.
          </p>
          <div className={styles.links}>
            {CULTURE_LINKS.map((l) => (
              <a
                key={l.events}
                href={l.events}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkCard}
              >
                <span className={styles.linkTitle}>{l.name}</span>
                <span className={styles.arrow}>↗</span>
              </a>
            ))}
          </div>
        </div>
        <div className={styles.photoWrap}>
          <img
            src="/images/bon-odori-lanterns.jpg"
            alt="Rows of glowing paper lanterns above a crowd at a bon odori summer festival"
            className={styles.photo}
          />
          <a
            href="https://unsplash.com/photos/many-illuminated-lanterns-at-an-outdoor-festival-at-night-jd6EupgO8yc"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.credit}
          >
            Photo: Tsuyoshi Kozu / Unsplash
          </a>
        </div>
      </div>
    </section>
  );
}
