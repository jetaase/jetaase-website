import Link from "next/link";
import Eyebrow from "@/components/Eyebrow";
import Button from "@/components/Button";
import EventCard from "@/components/EventCard";
import ElectionBanner from "@/components/ElectionBanner";
import NewsletterPrompt from "@/components/NewsletterPrompt";
import { readElection, readEvents } from "@/lib/content";
import { electionBanner, isElectionLive } from "@/lib/elections";
import { splitEvents, todayInEastern } from "@/lib/events";
import { JET_PROGRAMME_URL } from "@/lib/site";
import PhotoCredit from "@/components/PhotoCredit";
import Highlight from "@/components/Highlight";
import JoinCta from "@/components/JoinCta";
import CalloutBox from "@/components/CalloutBox";
import IconTile from "@/components/IconTile";
import { BriefcaseIcon, CompassIcon, FileTextIcon, GlobeIcon, LanguagesIcon, MapPinIcon, PeopleIcon } from "@/components/icons";
import LinkCard from "@/components/LinkCard";
import SectionHeading from "@/components/SectionHeading";
import styles from "./page.module.css";

// Re-render hourly so past events drop off without a deploy.
export const revalidate = 3600;

export default function Home() {
  const today = todayInEastern(new Date());
  const { next, upcoming } = splitEvents(readEvents(), today);
  const election = readElection();
  const shown = next ? [next, ...upcoming.slice(0, 2)] : [];

  return (
    <>
      {isElectionLive(election, today) && <ElectionBanner text={electionBanner(election, today)} />}

      {/* HERO */}
      <section id="top" className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <Eyebrow size="hero">JET Alumni of AL · GA · NC · SC</Eyebrow>
            <h1 className={styles.heroTitle}>
              Connect.
              <br />
              Remember.
              <br />
              <em className={styles.heroEmphasis}><Highlight>Engage.</Highlight></em>
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
              <Button href="#events" variant="ghost">
                Upcoming events →
              </Button>
            </div>
          </div>
          <div className={styles.heroImageWrap}>
            <img
              src="/images/minoo-bridge.jpg"
              alt="Vermilion bridge in front of Ryūan-ji temple in the green hills of Minoo, Osaka"
              className={styles.heroImage}
            />
            <PhotoCredit name="Pourya Gohari" href="https://unsplash.com/photos/a-red-bridge-crosses-over-a-river-in-front-of-a-building-tuqFwFEM3Io" />
          </div>
        </div>
      </section>

      {/* MISSION BAND */}
      <section className={styles.missionSection}>
        <div className={styles.missionInner}>
          <Eyebrow tone="gold">Our mission</Eyebrow>
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
            <IconTile tone="tan"><PeopleIcon size={26} /></IconTile>
            <h3 className={styles.featureTitle}>Reconnect with your people</h3>
            <p className={styles.featureText}>
              Picnics, potlucks, and reunions across four states bring the JET
              family back together, no matter how long you&apos;ve been home.
            </p>
          </div>
          <div>
            <IconTile tone="blue"><CompassIcon size={26} /></IconTile>
            <h3 className={styles.featureTitle}>Guide the next generation</h3>
            <p className={styles.featureText}>
              Thinking of applying to JET? Talk to alumni who&apos;ve been
              there, from application to arrival to coming home.
            </p>
          </div>
          <div>
            <IconTile tone="tan"><GlobeIcon size={26} /></IconTile>
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
        <SectionHeading title="Upcoming events" link={{ href: "/events", label: "See all events →" }} />
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
          <SectionHeading
            title="Your Japan toolkit"
            intro="Hand-picked links and guides from alumni who've walked the path, whether you're keeping up your Japanese or dreaming of your first placement."
          />
          <div className={styles.resourcesGrid}>
            <LinkCard
              href="/resources#japanese" icon={<LanguagesIcon />}
              title="Keep up your Japanese" description="Apps, reading, and tests to stay sharp."
            />
            <LinkCard
              href={JET_PROGRAMME_URL} icon={<FileTextIcon />}
              title="Applying to JET" description="Eligibility, timelines, and how to apply."
            />
            <LinkCard
              href="/resources#careers" icon={<BriefcaseIcon />}
              title="Careers & jobs" description="Job boards and Japan-tied employers."
            />
            <LinkCard
              href="/resources#culture" icon={<MapPinIcon />}
              title="Culture near you" description="Festivals, cultural events, and matsuri."
            />
          </div>
        </div>
      </section>

      <CalloutBox
        eyebrow="Run by alumni, for alumni"
        title="100% volunteer-powered"
        text="Every event, email, and reunion is put together by JET alumni giving their time. Meet the board behind it, and reach any of us directly."
        action={<Button href="/who-we-are">Meet the team →</Button>}
      />

      <CalloutBox
        variant="outlined"
        eyebrow="Find your local crew"
        title="Four states, one community"
        action={
          <div className={styles.chips}>
            <Link href="/subchapters#alabama" className={styles.chip}>Alabama</Link>
            <Link href="/subchapters#georgia" className={styles.chip}>Georgia</Link>
            <Link href="/subchapters#north-carolina" className={styles.chip}>North Carolina</Link>
            <Link href="/subchapters#south-carolina" className={styles.chip}>South Carolina</Link>
          </div>
        }
      />

      <JoinCta />
    </>
  );
}
