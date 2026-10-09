import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import CultureBand from "@/components/CultureBand";
import Poster from "@/components/Poster";
import EventCard from "@/components/EventCard";
import NewsletterPrompt from "@/components/NewsletterPrompt";
import { readEvents, readPartnerEvents } from "@/lib/content";
import { formatEventDate, splitEvents, todayInEastern, upcomingPartners } from "@/lib/events";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Events" };

// Re-render hourly so events move into "Looking back" without a deploy.
export const revalidate = 3600;

export default function EventsPage() {
  const today = todayInEastern(new Date());
  const { next, upcoming, past } = splitEvents(readEvents(), today);
  const partners = upcomingPartners(readPartnerEvents(), today);
  const hasPosters = partners.some((p) => p.poster);

  return (
    <div className={styles.pageRoot}>
      <Header />

      <Hero
        eyebrow="What's coming up"
        title="Events"
        subtitle="Picnics, meetups, welcome dinners, and info nights across the Southeast."
      />

      {/* NEXT UP */}
      <section className={styles.featured}>
        {next ? (
          <div className={styles.featuredGrid}>
            <div className={styles.featuredPoster}>
              <Poster event={next} priority />
              <span className={styles.featuredBadge}>NEXT UP</span>
            </div>
            <div className={styles.featuredBody}>
              <div className={styles.featuredDate}>
                {[formatEventDate(next.date, "weekday"), next.time.toUpperCase()].filter(Boolean).join(" · ")}
              </div>
              <h2 className={styles.featuredTitle}>{next.title}</h2>
              {next.location && <div className={styles.featuredLocation}>{next.location}</div>}
              {next.summary && <p className={styles.featuredDesc}>{next.summary}</p>}
              <div className={styles.featuredActions}>
                {next.rsvpUrl && (
                  <a href={next.rsvpUrl} target="_blank" rel="noopener noreferrer" className={styles.rsvpBtn}>
                    RSVP
                  </a>
                )}
                <Link href={`/events/${next.slug}`} className={styles.detailsBtn}>
                  Details →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <NewsletterPrompt empty />
        )}
      </section>

      {/* MORE UPCOMING */}
      {upcoming.length > 0 && (
        <section className={styles.upcoming}>
          <h2 className={styles.sectionTitle}>More upcoming</h2>
          <div className={styles.upcomingGrid}>
            {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {/* ALSO HAPPENING — partner events */}
      {partners.length > 0 && (
        <section className={styles.partners}>
          <h2 className={styles.partnersTitle}>Also happening</h2>
          <p className={styles.partnersIntro}>Events from our friends at JETAA USA, the consulate, and others.</p>
          <ul className={styles.partnerList}>
            {/* If any row has a poster, every row keeps the poster column so titles line up. */}
            {partners.map((p) => {
              const row = (
                <>
                  {p.poster ? (
                    <span className={styles.partnerPoster}>
                      <Image src={p.poster} alt={`Poster for ${p.title}`} fill sizes="64px" className={styles.partnerPosterImg} />
                    </span>
                  ) : (
                    hasPosters && <span className={styles.partnerNoPoster} aria-hidden="true" />
                  )}
                  <span className={styles.partnerDate}>{formatEventDate(p.date, "day")}</span>
                  <span className={styles.partnerMain}>
                    <span className={styles.partnerTitle}>{p.title}</span>
                    <span className={styles.partnerMeta}>
                      {[p.time, p.location].filter(Boolean).join(" · ")}
                    </span>
                    {p.summary && <span className={styles.partnerSummary}>{p.summary}</span>}
                  </span>
                  <span className={styles.hostTag}>{p.host}</span>
                </>
              );
              const rowClass = `${styles.partnerRow} ${hasPosters ? styles.withPoster : ""}`;
              return (
                <li key={p.id}>
                  {p.link ? (
                    <a href={p.link} target="_blank" rel="noopener noreferrer" className={rowClass}>{row}</a>
                  ) : (
                    <div className={rowClass}>{row}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* NEWSLETTER */}
      {next && (
        <section className={styles.newsletter}>
          <NewsletterPrompt />
        </section>
      )}

      {/* LOOKING BACK */}
      {past.length > 0 && (
        <section className={styles.lookingBackSection}>
          <div className={styles.lookingBackInner}>
            <div className={styles.lookingBackHeader}>
              <div>
                <div className={styles.lookingBackEyebrow}>Looking back</div>
                <h2 className={styles.sectionTitle}>A few recent get-togethers</h2>
              </div>
              <a href="https://instagram.com/jetaase" className={styles.instagramLink}>
                See more on Instagram →
              </a>
            </div>
            <div className={styles.pastGrid}>
              {past.slice(0, 6).map((e) => <EventCard key={e.id} event={e} size="small" />)}
            </div>
          </div>
        </section>
      )}

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

      <Footer />
    </div>
  );
}
