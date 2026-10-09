import type { Metadata } from "next";
import Hero from "@/components/Hero";
import { INFO_EMAIL } from "@/lib/site";
import Highlight from "@/components/Highlight";
import IconTile from "@/components/IconTile";
import { BriefcaseIcon, GlobeIcon, PeopleIcon } from "@/components/icons";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Join" };

export default function JoinPage() {
  return (
    <>
      {/* PAGE HERO */}
      <Hero
        eyebrow="Membership · always free"
        title={
          <>
            Join <Highlight>JETAASE</Highlight>
          </>
        }
        subtitle="Whether you just landed back stateside or came home decades ago, there's a seat for you. Fill out the membership form and we'll welcome you into the Southeast JET community."
      />

      {/* BODY */}
      <section className={styles.body}>
        <div className={styles.bodyGrid}>
          {/* WHY JOIN */}
          <div className={styles.whyJoin}>
            <h2 className={styles.whyJoinTitle}>Why join?</h2>
            <div className={styles.whyJoinList}>
              <div className={styles.whyJoinItem}>
                <IconTile tone="tan" size="sm"><PeopleIcon size={20} /></IconTile>
                <div>
                  <div className={styles.whyJoinItemTitle}>
                    Reunions &amp; events
                  </div>
                  <div className={styles.whyJoinItemText}>
                    Picnics, dinners, and meetups across four states.
                  </div>
                </div>
              </div>
              <div className={styles.whyJoinItem}>
                <IconTile tone="blue" size="sm"><GlobeIcon size={20} /></IconTile>
                <div>
                  <div className={styles.whyJoinItemTitle}>
                    A network that gets it
                  </div>
                  <div className={styles.whyJoinItemText}>
                    Alumni who share your Japan experience, right here at
                    home.
                  </div>
                </div>
              </div>
              <div className={styles.whyJoinItem}>
                <IconTile tone="tan" size="sm"><BriefcaseIcon size={20} /></IconTile>
                <div>
                  <div className={styles.whyJoinItemTitle}>
                    Guidance &amp; jobs
                  </div>
                  <div className={styles.whyJoinItemText}>
                    Applicant advice, job leads, and Japan-related resources.
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.questionsBox}>
              Questions? Email us at{" "}
              <a href={`mailto:${INFO_EMAIL}`}>{INFO_EMAIL}</a>.
              We&apos;re happy to help.
            </div>
          </div>

          {/* FORM */}
          <div className={styles.formCard}>
            <iframe
              title="JETAASE membership form"
              src="https://docs.google.com/forms/d/e/1FAIpQLSeZpT-HMpWD1v8_7FezhLEvwGMvwCn5dB7I_HMzAQJcWj2UaQ/viewform?embedded=true"
              width="100%"
              height="1180"
              className={styles.formIframe}
            >
              Loading…
            </iframe>
          </div>
        </div>
      </section>
    </>
  );
}
