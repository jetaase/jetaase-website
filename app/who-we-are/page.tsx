import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import BoardGrid from "@/components/BoardGrid";
import EmailLink from "@/components/EmailLink";
import { readBoard, readReps, vacantRepStates } from "@/lib/content";
import styles from "./page.module.css";
import { DEFAULT_HEADSHOT, headshotSrc } from "@/lib/uploads";

export const metadata: Metadata = { title: "Who We Are" };

export default function WhoWeArePage() {
  const board = readBoard();
  const reps = readReps();
  return (
    <div className={styles.pageRoot}>
      <Header />

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
            <span className={styles.welcomeHighlight}>JETAASE</span>
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
              <strong>JETAA USA</strong>. Founded in the early 1990s, our
              organization celebrated its 20th anniversary in 2011.
            </p>
            <p className={styles.welcomeParagraphLast}>
              We&apos;re an active group run entirely by volunteers, and
              we&apos;re always looking to share our JET experience with
              anyone, especially those interested in applying to the{" "}
              <a
                href="https://jetprogramme.org/en/"
                className={styles.welcomeLink}
              >
                JET Program
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* OFFICERS */}
      <section id="officers" className={styles.officers}>
        <div className={styles.officersHeader}>
          <div className={styles.officersEyebrow}>Meet the team</div>
          <h2 className={styles.officersTitle}>Officers</h2>
          <p className={styles.officersIntro}>
            JETAASE is led by a volunteer board of alumni from across the
            Southeast. Reach any of us directly by email.
          </p>
        </div>
        <BoardGrid members={board} />

        <h3 className={styles.subchapterTitle}>Subchapter representatives</h3>
        <div className={styles.subchapterGrid}>
          {reps.map((rep) => (
            <div key={rep.id} className={styles.subchapterCard}>
              <img src={headshotSrc(rep.photo)} alt={rep.name} className={styles.subchapterAvatar} />
              <div>
                <div className={styles.subchapterRegion}>{rep.state}</div>
                <div className={styles.subchapterName}>{rep.name}</div>
                {rep.city && (
                  <div className={styles.subchapterCity}>{rep.city} area</div>
                )}
                {rep.placement && (
                  <div className={styles.subchapterPlacement}>{rep.placement}</div>
                )}
                <EmailLink email={rep.email} className={styles.subchapterEmail} />
              </div>
            </div>
          ))}
          {vacantRepStates(reps).map((state) => (
            <div key={state} className={styles.subchapterCard}>
              <img src={DEFAULT_HEADSHOT} alt="" className={styles.subchapterAvatar} />
              <div>
                <div className={styles.subchapterRegion}>{state}</div>
                <div className={styles.subchapterName}>Position open</div>
                <a href="mailto:info@jetaase.org" className={styles.subchapterOpenLink}>
                  Interested? Get in touch →
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <div className={styles.ctaCopy}>
            <h2 className={styles.ctaTitle}>Become part of the story</h2>
            <p className={styles.ctaText}>
              Membership is free and open to all JET alumni and friends of
              Japan across the Southeast.
            </p>
          </div>
          <a href="/join" className={styles.ctaBtn}>
            Join JETAASE →
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
