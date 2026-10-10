import type { Metadata } from "next";
import Image from "next/image";
import Hero from "@/components/Hero";
import EmailLink from "@/components/EmailLink";
import { readReps, type State, type SubchapterRep } from "@/lib/content";
import { FACEBOOK_URL, INFO_EMAIL } from "@/lib/site";
import Button from "@/components/Button";
import PhotoCredit from "@/components/PhotoCredit";
import Highlight from "@/components/Highlight";
import CalloutBox from "@/components/CalloutBox";
import { FacebookIcon } from "@/components/icons";
import RepCard from "@/components/RepCard";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Subchapters" };

type CityGroup = {
  city: string;
  label: string;
  facebook?: string;
  website?: string;
};

type Subchapter = {
  state: State;
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

const SUBCHAPTERS: Subchapter[] = [
  {
    state: "Georgia",
    email: "georgia@jetaase.org",
    photo: "/images/atlanta-skyline.jpg",
    photoAlt: "Aerial view of downtown Atlanta lit up at night",
    photoCredit: {
      name: "Venti Views",
      href: "https://unsplash.com/photos/an-aerial-view-of-a-city-at-night-F2PrSHG2nEk",
    },
    badge: "MAIN CHAPTER",
    facebook: FACEBOOK_URL,
    facebookLabel: "Follow JETAASE on Facebook →",
    noLeaders: {
      label: "Atlanta, GA",
      text: "Run directly by the JETAASE board, most of whom are based in Atlanta. Reach us anytime at the email above.",
    },
  },
  {
    state: "Alabama",
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
    <>
      {/* PAGE HEADER */}
      <Hero
        eyebrow="Four states · one community"
        title={
          <>
            Find your local{" "}
            <Highlight>subchapter</Highlight>
          </>
        }
        subtitle="JETAASE spans the Southeast, and each subchapter has its own Facebook group, most with a local leader who keeps things running. Find your region below and say hello."
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
                  <Image src={sc.photo} alt={sc.photoAlt} fill sizes="(max-width: 768px) 100vw, 560px" className={styles.cardPhoto} />
                  {sc.badge && <span className={styles.cardBadge}>{sc.badge}</span>}
                  {sc.photoCredit && (
                    <PhotoCredit name={sc.photoCredit.name} href={sc.photoCredit.href} />
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
                          <div key={rep.id} className={styles.leaderRow}>
                            <RepCard photo={rep.photo} name={rep.name} city={rep.city} placement={rep.placement} email={rep.email} />
                          </div>
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
                              <div key={rep.id} className={styles.leaderRow}>
                                {/* The group header already names the city. */}
                                <RepCard photo={rep.photo} name={rep.name} placement={rep.placement} email={rep.email} />
                              </div>
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
                        <a href={`mailto:${INFO_EMAIL}`} className={styles.openSpotLink}>Get in touch →</a>
                      </div>
                    </div>
                  )}
                  <Button href={sc.facebook} variant="dark" className={styles.fbBtn}>
                    {sc.facebookLabel ?? "Join the Facebook group →"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <CalloutBox
        title="Don't see your area?"
        text="We're always looking for volunteers to help grow the community. If you'd like to help start or lead a local group, we'd love to hear from you."
        action={<Button href={`mailto:${INFO_EMAIL}`}>Get in touch →</Button>}
      />
    </>
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


