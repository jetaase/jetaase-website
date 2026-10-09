import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Eyebrow from "@/components/Eyebrow";
import Button from "@/components/Button";
import EventCard from "@/components/EventCard";
import ElectionBanner from "@/components/ElectionBanner";
import NewsletterPrompt from "@/components/NewsletterPrompt";
import { readElection, readEvents } from "@/lib/content";
import { electionBanner, isElectionLive } from "@/lib/elections";
import { splitEvents, todayInEastern } from "@/lib/events";
import styles from "./page.module.css";

// Re-render hourly so past events drop off without a deploy.
export const revalidate = 3600;

export default function Home() {
  const today = todayInEastern(new Date());
  const { next, upcoming } = splitEvents(readEvents(), today);
  const election = readElection();
  const shown = next ? [next, ...upcoming.slice(0, 2)] : [];

  return (
    <div className={styles.pageRoot}>
      <Header />
      {isElectionLive(election, today) && <ElectionBanner text={electionBanner(election, today)} />}

      {/* HERO */}
      <section id="top" className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <Eyebrow>JET Alumni of AL · GA · NC · SC</Eyebrow>
            <h1 className={styles.heroTitle}>
              Connect.
              <br />
              Remember.
              <br />
              <em className={styles.heroEmphasis}>Engage.</em>
            </h1>
            <p className={styles.heroSubtitle}>
              The alumni association for everyone who taught, lived, and grew
              through the JET Program in the American Southeast. Good to have
              you back!
            </p>
            <div className={styles.heroActions}>
              <Button href="/join" variant="solid">
                Become a member
              </Button>
              <Link href="#events" className={styles.heroGhostBtn}>
                Upcoming events →
              </Link>
            </div>
          </div>
          <div className={styles.heroImageWrap}>
            <img
              src="/images/minoo-bridge.jpg"
              alt="Vermilion bridge in front of Ryūan-ji temple in the green hills of Minoo, Osaka"
              className={styles.heroImage}
            />
            <a
              href="https://unsplash.com/photos/a-red-bridge-crosses-over-a-river-in-front-of-a-building-tuqFwFEM3Io"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.photoCredit}
            >
              Photo: Pourya Gohari / Unsplash
            </a>
          </div>
        </div>
      </section>

      {/* MISSION BAND */}
      <section className={styles.missionSection}>
        <div className={styles.missionInner}>
          <div className={styles.missionEyebrow}>Our mission</div>
          <p className={styles.missionText}>
            To promote, inspire, encourage, and invest in cross-cultural
            awareness, keeping the JET spirit alive long after the flight
            home.
          </p>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section className={styles.whatWeDo}>
        <div className={styles.whatWeDoGrid}>
          <div>
            <div className={`${styles.iconBox} ${styles.iconBoxTan}`}>
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Reconnect with your people</h3>
            <p className={styles.featureText}>
              Picnics, potlucks, and reunions across four states bring the JET
              family back together, no matter how long you&apos;ve been home.
            </p>
          </div>
          <div>
            <div className={`${styles.iconBox} ${styles.iconBoxBlue}`}>
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Guide the next generation</h3>
            <p className={styles.featureText}>
              Thinking of applying to JET? Talk to alumni who&apos;ve been
              there, from application to arrival to coming home.
            </p>
          </div>
          <div>
            <div className={`${styles.iconBox} ${styles.iconBoxTan}`}>
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                <path d="M2 12h20"></path>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Stay close to Japan</h3>
            <p className={styles.featureText}>
              Language practice, cultural events, and a community that still
              speaks your other language, right here in the Southeast.
            </p>
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section id="events" className={styles.events}>
        <div className={styles.eventsHeader}>
          <h2 className={styles.sectionTitle}>Upcoming events</h2>
          <Link href="/events" className={styles.seeAllLink}>
            See all events →
          </Link>
        </div>
        {shown.length > 0 ? (
          <div className={styles.eventsGrid}>
            {shown.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        ) : (
          <NewsletterPrompt empty />
        )}
      </section>

      {/* RESOURCES */}
      <section id="resources" className={styles.resourcesSection}>
        <div className={styles.resourcesInner}>
          <div className={styles.resourcesIntro}>
            <h2 className={styles.sectionTitle}>Your Japan toolkit</h2>
            <p className={styles.resourcesSubtitle}>
              Hand-picked links and guides from alumni who&apos;ve walked the
              path, whether you&apos;re keeping up your Japanese or dreaming
              of your first placement.
            </p>
          </div>
          <div className={styles.resourcesGrid}>
            <Link href="/resources#japanese" className={styles.resourceCard}>
              <span className={styles.resourceIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 8 6 6"></path>
                  <path d="m4 14 6-6 2-3"></path>
                  <path d="M2 5h12"></path>
                  <path d="M7 2h1"></path>
                  <path d="m22 22-5-10-5 10"></path>
                  <path d="M14 18h6"></path>
                </svg>
              </span>
              <span className={styles.resourceTitle}>Keep up your Japanese</span>
              <span className={styles.resourceDesc}>
                Apps, meetups, and reading to stay sharp.
              </span>
            </Link>
            <a
              href="https://jetprogramme.org/en/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.resourceCard}
            >
              <span className={styles.resourceIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                  <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                  <path d="M16 13H8"></path>
                  <path d="M16 17H8"></path>
                  <path d="M10 9H8"></path>
                </svg>
              </span>
              <span className={styles.resourceTitle}>Applying to JET</span>
              <span className={styles.resourceDesc}>
                Eligibility, timelines, and how to apply.
              </span>
            </a>
            <Link href="/resources#careers" className={styles.resourceCard}>
              <span className={styles.resourceIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </span>
              <span className={styles.resourceTitle}>Careers &amp; jobs</span>
              <span className={styles.resourceDesc}>
                Japan-related roles and the JETAA job board.
              </span>
            </Link>
            <Link href="/resources#culture" className={styles.resourceCard}>
              <span className={styles.resourceIcon}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </span>
              <span className={styles.resourceTitle}>Culture near you</span>
              <span className={styles.resourceDesc}>
                Festivals, cultural events, and matsuri.
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* VOLUNTEER-RUN CALLOUT */}
      <section id="officers" className={styles.calloutSection}>
        <div className={styles.calloutBox}>
          <div className={styles.calloutCopy}>
            <div className={styles.calloutEyebrow}>
              Run by alumni, for alumni
            </div>
            <h2 className={styles.calloutTitle}>100% volunteer-powered</h2>
            <p className={styles.calloutText}>
              Every event, email, and reunion is put together by JET alumni
              giving their time. Meet the board behind it, and reach any of
              us directly.
            </p>
          </div>
          <Link href="/who-we-are" className={styles.calloutBtn}>
            Meet the team →
          </Link>
        </div>
      </section>

      {/* SUBCHAPTERS */}
      <section id="chapters" className={styles.subchaptersSection}>
        <div className={styles.subchaptersBox}>
          <div>
            <div className={styles.subchaptersEyebrow}>
              Find your local crew
            </div>
            <h2 className={styles.subchaptersTitle}>
              Four states, one community
            </h2>
          </div>
          <div className={styles.subchaptersChips}>
            <Link href="/subchapters" className={styles.chip}>
              Alabama
            </Link>
            <Link href="/subchapters" className={styles.chip}>
              Georgia
            </Link>
            <Link href="/subchapters" className={styles.chip}>
              North Carolina
            </Link>
            <Link href="/subchapters" className={styles.chip}>
              South Carolina
            </Link>
          </div>
        </div>
      </section>

      {/* JOIN CTA */}
      <section id="join" className={styles.joinSection}>
        <div className={styles.joinInner}>
          <div className={styles.joinCopy}>
            <h2 className={styles.joinTitle}>Ready to reconnect?</h2>
            <p className={styles.joinText}>
              Membership is free and takes two minutes. Join hundreds of
              alumni across the Southeast and stay in the loop on events,
              jobs, and reunions.
            </p>
          </div>
          <Link href="/join" className={styles.joinBtn}>
            Join JETAASE →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
