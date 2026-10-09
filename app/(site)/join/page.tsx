import type { Metadata } from "next";
import Hero from "@/components/Hero";
import { INFO_EMAIL } from "@/lib/site";
import Highlight from "@/components/Highlight";
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
        subtitle="Whether you just landed back stateside or came home decades ago, there's a seat for you. Fill out the form below and we'll welcome you into the Southeast JET community."
      />

      {/* BODY */}
      <section className={styles.body}>
        <div className={styles.bodyGrid}>
          {/* WHY JOIN */}
          <div className={styles.whyJoin}>
            <h2 className={styles.whyJoinTitle}>Why join?</h2>
            <div className={styles.whyJoinList}>
              <div className={styles.whyJoinItem}>
                <div className={`${styles.whyJoinIcon} ${styles.iconTan}`}>
                  <svg
                    width="20"
                    height="20"
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
                <div className={`${styles.whyJoinIcon} ${styles.iconBlue}`}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 22h16"></path>
                    <path d="M10 14.66V17c0 .55.47.98.97 1.21C12.15 18.75 13 20.24 13 22"></path>
                    <path d="M14 14.66V17c0 .55-.47.98-.97 1.21C11.85 18.75 11 20.24 11 22"></path>
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                  </svg>
                </div>
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
                <div className={`${styles.whyJoinIcon} ${styles.iconTan}`}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m22 2-7 20-4-9-9-4Z"></path>
                    <path d="M22 2 11 13"></path>
                  </svg>
                </div>
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
