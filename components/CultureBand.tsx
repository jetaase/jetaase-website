import PhotoCredit from "./PhotoCredit";
import IconTile from "./IconTile";
import { MapPinIcon } from "./icons";
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

export default function CultureBand() {
  return (
    <section id="culture" className={styles.section}>
      <div className={styles.band}>
        <div className={styles.copy}>
          <IconTile tone="white">
            <MapPinIcon size={22} />
          </IconTile>
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
          <PhotoCredit name="Tsuyoshi Kozu" href="https://unsplash.com/photos/many-illuminated-lanterns-at-an-outdoor-festival-at-night-jd6EupgO8yc" />
        </div>
      </div>
    </section>
  );
}
