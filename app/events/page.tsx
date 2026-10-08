import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import CultureBand from "@/components/CultureBand";
import styles from "./page.module.css";

export default function EventsPage() {
  return (
    <div className={styles.pageRoot}>
      <Header />

      {/* PAGE HERO */}
      <Hero
        eyebrow="What's coming up"
        title="Events"
        subtitle="Picnics, meetups, welcome dinners, and info nights across the Southeast. Tap any event for details and to RSVP."
      />

      {/* FEATURED / NEXT UP */}
      <section className={styles.featured}>
        <div className={styles.featuredGrid}>
          <div className={styles.featuredPhotoWrap}>
            <img
              src="/images/f9194416-27d7-406f-bb85-9cb891315c7b.jpg"
              alt="Featured event photo"
              className={styles.featuredPhoto}
            />
            <span className={styles.featuredBadge}>NEXT UP</span>
          </div>
          <div className={styles.featuredBody}>
            <div className={styles.featuredDate}>SAT · AUG 09 · 2:00 PM</div>
            <h2 className={styles.featuredTitle}>
              Natsumatsuri Summer Picnic
            </h2>
            <p className={styles.featuredDesc}>
              Piedmont Park, Atlanta GA. Food, games, yukata welcome, and
              reunions with the whole Southeast JET family.
            </p>
            <div className={styles.featuredActions}>
              <Link href="/join" className={styles.rsvpBtn}>
                RSVP
              </Link>
              <button type="button" className={styles.detailsBtn}>
                Details →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* UPCOMING GRID */}
      <section className={styles.upcoming}>
        <div className={styles.upcomingHeader}>
          <h2 className={styles.sectionTitle}>More upcoming</h2>
          <Link href="#" className={styles.subscribeLink}>
            Subscribe to calendar →
          </Link>
        </div>
        <div className={styles.upcomingGrid}>
          <div className={styles.upcomingCard}>
            <div className={styles.upcomingPhoto} />
            <div className={styles.upcomingBody}>
              <div className={styles.upcomingDate}>SEP 13 · CHARLOTTE, NC</div>
              <div className={styles.upcomingTitle}>
                Monthly Nihongo Meetup
              </div>
              <div className={styles.upcomingMeta}>All levels · 6:30 PM</div>
              <button type="button" className={styles.upcomingDetailsBtn}>
                Details →
              </button>
            </div>
          </div>
          <div className={styles.upcomingCard}>
            <div className={styles.upcomingPhoto} />
            <div className={styles.upcomingBody}>
              <div className={styles.upcomingDate}>SEP 20 · RALEIGH, NC</div>
              <div className={styles.upcomingTitle}>
                Returnee Welcome Home Dinner
              </div>
              <div className={styles.upcomingMeta}>Izakaya night · 7:00 PM</div>
              <button type="button" className={styles.upcomingDetailsBtn}>
                Details →
              </button>
            </div>
          </div>
          <div className={styles.upcomingCard}>
            <div className={styles.upcomingPhotoOnline}>online event</div>
            <div className={styles.upcomingBody}>
              <div className={styles.upcomingDate}>OCT 04 · ONLINE</div>
              <div className={styles.upcomingTitle}>
                Applying to JET: Info Night
              </div>
              <div className={styles.upcomingMeta}>For applicants · 8:00 PM</div>
              <button type="button" className={styles.upcomingDetailsBtn}>
                Details →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* LOOKING BACK / PAST EVENTS */}
      <section className={styles.lookingBackSection}>
        <div className={styles.lookingBackInner}>
          <div className={styles.lookingBackHeader}>
            <div>
              <div className={styles.lookingBackEyebrow}>Looking back</div>
              <h2 className={styles.sectionTitle}>
                A few recent get-togethers
              </h2>
            </div>
            <a
              href="https://instagram.com/jetaase"
              className={styles.instagramLink}
            >
              See more on Instagram →
            </a>
          </div>
          <div className={styles.pastGrid}>
            <div>
              <div className={styles.pastPhotoWrap} />
              <div className={styles.pastDate}>JUN 2026 · SAVANNAH, GA</div>
              <div className={styles.pastTitle}>Hanami Riverside Walk</div>
            </div>
            <div>
              <div className={styles.pastPhotoWrap} />
              <div className={styles.pastDate}>APR 2026 · GREENVILLE, SC</div>
              <div className={styles.pastTitle}>Spring Ramen Crawl</div>
            </div>
            <div>
              <div className={styles.pastPhotoWrap} />
              <div className={styles.pastDate}>JAN 2026 · CHARLOTTE, NC</div>
              <div className={styles.pastTitle}>New Year Mochitsuki</div>
            </div>
          </div>
        </div>
      </section>

      {/* CULTURE NEAR YOU — Japan-America society calendars */}
      <CultureBand />

      {/* SUGGEST AN EVENT */}
      <section className={styles.suggest}>
        <div className={styles.suggestBox}>
          <div className={styles.suggestCopy}>
            <h2 className={styles.suggestTitle}>Have an event idea?</h2>
            <p className={styles.suggestText}>
              Reunions, language tables, hikes — if you&apos;d like to host or
              suggest something in your area, we&apos;ll help make it happen.
            </p>
          </div>
          <a href="mailto:events@jetaase.org" className={styles.suggestBtn}>
            Suggest an event →
          </a>
        </div>
      </section>

      {/* DETAILS MODAL — static port, hidden by default (no open/close JS wired) */}
      <div className={styles.modalOverlay}>
        <div className={styles.modalCard}>
          <div className={styles.modalAccent} />
          <div className={styles.modalBody}>
            <div className={styles.modalHeaderRow}>
              <div className={styles.modalDate}>
                Saturday, August 9 · 2:00–6:00 PM
              </div>
              <button type="button" className={styles.modalClose}>
                ×
              </button>
            </div>
            <h2 className={styles.modalTitle}>Natsumatsuri Summer Picnic</h2>
            <div className={styles.modalLocation}>
              Piedmont Park (Oak Hill), Atlanta, GA
            </div>
            <p className={styles.modalDesc}>
              Our biggest reunion of the year. Grills going, games on the
              lawn, and the whole Southeast JET family in one place. Bring
              the family — kids and non-members welcome. We&apos;ll have a
              shaded spot reserved near the Oak Hill entrance; look for the
              JETAASE banner.
            </p>
            <div className={styles.modalBringLabel}>What to bring</div>
            <ul className={styles.modalBringList}>
              <li className={styles.modalBringItem}>
                A dish or drink to share (optional)
              </li>
              <li className={styles.modalBringItem}>
                A blanket and sunscreen
              </li>
              <li className={styles.modalBringItem}>
                Yukata or happi if you&apos;ve got one!
              </li>
            </ul>
            <div className={styles.modalActions}>
              <Link href="/join" className={styles.modalRsvpBtn}>
                RSVP
              </Link>
              <a href="#" className={styles.modalCalendarBtn}>
                Add to calendar
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
