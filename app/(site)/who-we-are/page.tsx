import type { Metadata } from "next";
import Hero from "@/components/Hero";
import BoardGrid from "@/components/BoardGrid";
import ElectionNotice from "@/components/ElectionNotice";
import { readBoard, readElection, readReps } from "@/lib/content";
import { isElectionLive } from "@/lib/elections";
import { todayInEastern } from "@/lib/events";
import { repSlots } from "@/lib/reps";
import { INFO_EMAIL, JET_PROGRAMME_URL } from "@/lib/site";
import Highlight from "@/components/Highlight";
import JoinCta from "@/components/JoinCta";
import SectionHeading from "@/components/SectionHeading";
import RepCard from "@/components/RepCard";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Who We Are" };

// Re-render hourly so the elections notice hides itself after its date.
export const revalidate = 3600;

export default function WhoWeArePage() {
  const board = readBoard();
  const reps = readReps();
  const election = readElection();
  const showElection = isElectionLive(election, todayInEastern(new Date()));
  return (
    <>
      {/* PAGE HERO */}
      <Hero
        eyebrow="About JETAASE"
        title="Who we are"
        subtitle="An active, volunteer-run community keeping the JET experience alive across the American Southeast, and welcoming anyone curious about Japan."
      />

      {/* BANNER */}
      <section className={styles.banner}>
        <div className={styles.bannerFrame}>
          <img
            src="/images/consulate-group-photo.jpg"
            alt="JETAASE members at the Consulate General of Japan in Atlanta"
            className={styles.bannerImg}
          />
        </div>
      </section>

      {/* WELCOME PROSE */}
      <section className={styles.welcome}>
        <div className={styles.welcomeGrid}>
          <h2 className={styles.welcomeHeading}>
            Welcome to
            <br />
            <Highlight>JETAASE</Highlight>
          </h2>
          <div className={styles.welcomeBody}>
            <p className={styles.welcomeParagraph}>
              Welcome to the official home of the{" "}
              <strong>
                Japan Exchange and Teaching Program Alumni Association of the
                Southeast (JETAASE)
              </strong>
              . We are the membership organization for JET alumni in Alabama,
              Georgia, North Carolina, and South Carolina.
            </p>
            <p className={styles.welcomeParagraph}>
              We are the 4th chapter in the 19-chapter organization that forms{" "}
              <strong>USJETAA</strong>, and were founded in the early 1990s.
            </p>
            <p className={styles.welcomeParagraphLast}>
              We&apos;re an active group run entirely by volunteers, and
              we&apos;re always looking to share our JET experience with
              anyone, especially those interested in applying to the{" "}
              <a
                href={JET_PROGRAMME_URL}
                className={styles.welcomeLink}
              >
                JET Program
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {showElection && <ElectionNotice election={election} />}

      {/* OFFICERS */}
      <section id="officers" className={styles.officers}>
        <SectionHeading
          eyebrow="Meet the team"
          title="Officers"
          intro="JETAASE is led by a volunteer board of alumni from across the Southeast. Reach any of us directly by email."
        />
        <BoardGrid members={board} />

        <div className={styles.repsHeading}>
          <SectionHeading as="h3" size="sm" title="Subchapter representatives" />
        </div>
        <div className={styles.subchapterGrid}>
          {repSlots(reps).map(({ state, rep }) => rep ? (
            <RepCard
              key={rep.id} boxed label={rep.state} photo={rep.photo} name={rep.name}
              city={rep.city} placement={rep.placement} email={rep.email}
            />
          ) : (
            <RepCard
              key={state} boxed label={state} name="Position open"
              action={<a href={`mailto:${INFO_EMAIL}`}>Interested? Get in touch →</a>}
            />
          ))}
        </div>
      </section>

      <JoinCta
        title="Become part of the story"
        text="Membership is free and open to all JET alumni and friends of Japan across the Southeast."
      />
    </>
  );
}
