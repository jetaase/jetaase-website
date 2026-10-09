import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import EmailLink from "@/components/EmailLink";
import { readReps, type State, type SubchapterRep } from "@/lib/content";
import styles from "./page.module.css";
import { headshotSrc } from "@/lib/uploads";

export const metadata: Metadata = { title: "Subchapters" };

type CityGroup = {
  city: string;
  label: string;
  facebook?: string;
  website?: string;
};

type Subchapter = {
  state: State;
  abbr: string;
  email: string;
  photo: string;
  photoAlt: string;
  // Unsplash photographer and photo page, shown as a small credit.
  photoCredit?: { name: string; href: string };
  badge?: string;
  facebook: string;
  facebookLabel?: string;
  // Local groups within the state. Reps whose city matches are listed
  // under the group's header, alongside the group's own links.
  cityGroups?: CityGroup[];
  // Shown instead of the leader list when no reps are listed for the state.
  noLeaders?: { label: string; text: string };
};

// Where volunteers for an open rep spot write in.
const OPEN_SPOT_EMAIL = "info@jetaase.org";

const SUBCHAPTERS: Subchapter[] = [
  {
    state: "Georgia",
    abbr: "GA",
    email: "georgia@jetaase.org",
    photo: "/images/atlanta-skyline.jpg",
    photoAlt: "Aerial view of downtown Atlanta lit up at night",
    photoCredit: {
      name: "Venti Views",
      href: "https://unsplash.com/photos/an-aerial-view-of-a-city-at-night-F2PrSHG2nEk",
    },
    badge: "MAIN CHAPTER",
    facebook: "https://www.facebook.com/jetaase",
    facebookLabel: "Follow JETAASE on Facebook →",
    noLeaders: {
      label: "Atlanta, GA",
      text: "Run directly by the JETAASE board, most of whom are based in Atlanta. Reach us anytime at the email above.",
    },
  },
  {
    state: "Alabama",
    abbr: "AL",
    email: "alabama@jetaase.org",
    photo: "/images/birmingham-skyline.jpg",
    photoAlt: "Downtown Birmingham skyline reflected in a still pond at dusk",
    photoCredit: {
      name: "Zachary Farmer",
      href: "https://unsplash.com/photos/landscape-photography-of-cityscape-by-water-TkunxoS98q0",
    },
    facebook: "https://www.facebook.com/groups/jetaaseal/",
  },
  {
    state: "North Carolina",
    abbr: "NC",
    email: "northcarolina@jetaase.org",
    photo: "/images/charlotte-skyline.jpg",
    photoAlt: "Uptown Charlotte skyline under storm clouds at sunset",
    photoCredit: {
      name: "Daniel Weiss",
      href: "https://unsplash.com/photos/birds-eye-view-of-city-aj2Os9mYgJU",
    },
    facebook: "https://www.facebook.com/groups/jetaasenc/",
    facebookLabel: "Join the NC Facebook group →",
    cityGroups: [
      {
        city: "Charlotte",
        label: "Charlotte Metro",
        facebook: "https://www.facebook.com/groups/1960350094225677/",
        website: "https://cltmetrojetaa.wixsite.com/home",
      },
    ],
  },
  {
    state: "South Carolina",
    abbr: "SC",
    email: "southcarolina@jetaase.org",
    photo: "/images/charleston-bridge.jpg",
    photoAlt: "Aerial view of the Ravenel Bridge spanning the Cooper River in Charleston",
    photoCredit: {
      name: "David Martin",
      href: "https://unsplash.com/photos/aerial-photo-of-bridge-during-daytime-p9vBVq_-nXY",
    },
    facebook: "https://www.facebook.com/groups/jetaase.sc/",
  },
];

export default function SubchaptersPage() {
  const reps = readReps();
  return (
    <div className={styles.pageRoot}>
      <Header />

      {/* PAGE HEADER */}
      <Hero
        eyebrow="Four states · one community"
        title={
          <>
            Find your local{" "}
            <span className={styles.heroSpanUnderline}>subchapter</span>
          </>
        }
        subtitle="JETAASE spans the Southeast, and each subchapter has its own Facebook group and a local leader who keeps things running. Find your region below and say hello."
      />

      {/* SUBCHAPTER CARDS */}
      <section className={styles.cards}>
        <div className={styles.cardsGrid}>
          {SUBCHAPTERS.map((sc) => {
            const leaders = reps.filter((r) => r.state === sc.state);
            return (
              // The id lets other pages link straight to a state, e.g. /subchapters#north-carolina.
              <div key={sc.state} id={stateAnchor(sc.state)} className={styles.card}>
                <div className={styles.cardPhotoWrap}>
                  <img src={sc.photo} alt={sc.photoAlt} className={styles.cardPhoto} />
                  {sc.badge && <span className={styles.cardBadge}>{sc.badge}</span>}
                  {sc.photoCredit && (
                    <a
                      href={sc.photoCredit.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.photoCredit}
                    >
                      Photo: {sc.photoCredit.name} / Unsplash
                    </a>
                  )}
                </div>
                <div className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>{sc.state}</h2>
                  <EmailLink email={sc.email} className={styles.cardEmail} />
                  {leaders.length > 0 ? (
                    <div className={styles.leaderBlock}>
                      {leaders
                        .filter((r) => !groupFor(sc, r))
                        .map((rep) => (
                          <LeaderRow key={rep.id} rep={rep} location={rep.city && `${rep.city}, ${sc.abbr}`} />
                        ))}
                      {sc.cityGroups?.map((g) => {
                        const members = leaders.filter((r) => groupFor(sc, r) === g);
                        if (members.length === 0) return null;
                        return (
                          <div key={g.city} className={styles.cityGroup}>
                            <div className={styles.cityGroupHeader}>
                              <span className={styles.leaderLocation}>{g.label}</span>
                              <span className={styles.cityGroupLinks}>
                                {g.facebook && (
                                  <a href={g.facebook} target="_blank" rel="noopener noreferrer">
                                    <FacebookIcon /> Group
                                  </a>
                                )}
                                {g.website && (
                                  <a href={g.website} target="_blank" rel="noopener noreferrer">
                                    Website ↗
                                  </a>
                                )}
                              </span>
                            </div>
                            {members.map((rep) => (
                              <LeaderRow key={rep.id} rep={rep} />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ) : sc.noLeaders ? (
                    <div className={styles.cardDetails}>
                      <div className={styles.cardDetailsLabel}>{sc.noLeaders.label}</div>
                      <div className={styles.cardDetailsText}>{sc.noLeaders.text}</div>
                    </div>
                  ) : (
                    <div className={styles.cardDetails}>
                      <div className={styles.cardDetailsLabel}>Local rep · open</div>
                      <div className={styles.cardDetailsText}>
                        We&apos;re looking for {sc.state === "Alabama" ? "an" : "a"} {sc.state} rep. Interested?{" "}
                        <a href={`mailto:${OPEN_SPOT_EMAIL}`} className={styles.openSpotLink}>Get in touch →</a>
                      </div>
                    </div>
                  )}
                  <a href={sc.facebook} className={styles.fbBtn} target="_blank" rel="noopener noreferrer">
                    {sc.facebookLabel ?? "Join the Facebook group →"}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* HELP / LEAD CTA */}
      <section className={styles.helpCta}>
        <div className={styles.helpCtaBox}>
          <div className={styles.helpCtaCopy}>
            <h2 className={styles.helpCtaTitle}>Don&apos;t see your area?</h2>
            <p className={styles.helpCtaText}>
              We&apos;re always looking for volunteers to help grow the
              community. If you&apos;d like to help start or lead a local
              group, we&apos;d love to hear from you.
            </p>
          </div>
          <a href="mailto:info@jetaase.org" className={styles.helpCtaBtn}>
            Get in touch →
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function stateAnchor(state: string) {
  return state.toLowerCase().replace(/\s+/g, "-");
}

function groupFor(sc: Subchapter, rep: SubchapterRep) {
  return sc.cityGroups?.find(
    (g) => g.city.toLowerCase() === rep.city?.trim().toLowerCase(),
  );
}

function LeaderRow({ rep, location }: { rep: SubchapterRep; location?: string }) {
  return (
    <div className={styles.leaderRow}>
      <img src={headshotSrc(rep.photo)} alt={rep.name} className={styles.leaderAvatar} />
      <div>
        {location && <div className={styles.leaderLocation}>{location}</div>}
        <div className={styles.leaderName}>{rep.name}</div>
        {rep.placement && <div className={styles.leaderMeta}>{rep.placement}</div>}
      </div>
    </div>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" fill="currentColor">
      <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" />
    </svg>
  );
}
