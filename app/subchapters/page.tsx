import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import styles from "./page.module.css";

export default function SubchaptersPage() {
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
          {/* Georgia */}
          <div className={styles.card}>
            <div className={styles.cardPhotoWrap}>
              <img
                src="/images/5d847643-a9ef-4e82-aac5-6b577e2f00c1.jpg"
                alt="Atlanta skyline"
                className={styles.cardPhoto}
              />
              <span className={styles.cardBadge}>MAIN CHAPTER</span>
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>Georgia</h2>
              <a
                href="mailto:georgia@jetaase.org"
                className={styles.cardEmail}
              >
                ✉ georgia@jetaase.org
              </a>
              <div className={styles.cardDetails}>
                <div className={styles.cardDetailsLabel}>Atlanta, GA</div>
                <div className={styles.cardDetailsText}>
                  Run directly by the JETAASE board, most of whom are based
                  in Atlanta. Reach us anytime at the email above.
                </div>
              </div>
              <a href="#" className={styles.fbBtn}>
                Join the Facebook group →
              </a>
            </div>
          </div>

          {/* Alabama */}
          <div className={styles.card}>
            <div className={styles.cardPhotoWrap}>
              <img
                src="/images/d1f73aa2-a357-4bae-b201-6a2bcd57e360.jpg"
                alt="Birmingham skyline"
                className={styles.cardPhoto}
              />
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>Alabama</h2>
              <a
                href="mailto:alabama@jetaase.org"
                className={styles.cardEmail}
              >
                ✉ alabama@jetaase.org
              </a>
              <div className={styles.leaderBlock}>
                <div className={styles.leaderRow}>
                  <div className={styles.leaderAvatar} />
                  <div>
                    <div className={styles.leaderName}>Ingrid Galinat</div>
                    <div className={styles.leaderMeta}>
                      Toyama · 2000–2001
                    </div>
                  </div>
                </div>
              </div>
              <a href="#" className={styles.fbBtn}>
                Join the Facebook group →
              </a>
            </div>
          </div>

          {/* North Carolina */}
          <div className={styles.card}>
            <div className={styles.cardPhotoWrap}>
              <img
                src="/images/fbda0319-db81-414a-a148-ca51d98aa62e.jpg"
                alt="Charlotte skyline or Blue Ridge Parkway"
                className={styles.cardPhoto}
              />
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>North Carolina</h2>
              <a
                href="mailto:northcarolina@jetaase.org"
                className={styles.cardEmail}
              >
                ✉ northcarolina@jetaase.org
              </a>
              <div className={styles.leaderBlock}>
                <div
                  className={`${styles.leaderRow} ${styles.leaderRowBordered}`}
                >
                  <div className={styles.leaderAvatar} />
                  <div>
                    <div className={styles.leaderLocation}>
                      Charlotte, NC
                    </div>
                    <div className={styles.leaderName}>Kathryn Huff</div>
                    <div className={styles.leaderMeta}>
                      Shimane · 2010–2013
                    </div>
                  </div>
                </div>
                <div className={styles.leaderRow}>
                  <div className={styles.leaderAvatar} />
                  <div>
                    <div className={styles.leaderLocation}>
                      Charlotte, NC
                    </div>
                    <div className={styles.leaderName}>Oscar Garcia</div>
                    <div className={styles.leaderMeta}>Nara</div>
                  </div>
                </div>
              </div>
              <a href="#" className={styles.fbBtn}>
                Join the Facebook group →
              </a>
            </div>
          </div>

          {/* South Carolina */}
          <div className={styles.card}>
            <div className={styles.cardPhotoWrap}>
              <img
                src="/images/7e7c8c7a-4da4-48c5-a5cd-e66710e0f772.jpg"
                alt="Charleston — Rainbow Row or Ravenel Bridge"
                className={styles.cardPhoto}
              />
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>South Carolina</h2>
              <a
                href="mailto:southcarolina@jetaase.org"
                className={styles.cardEmail}
              >
                ✉ southcarolina@jetaase.org
              </a>
              <div className={styles.leaderBlock}>
                <div
                  className={`${styles.leaderRow} ${styles.leaderRowBordered}`}
                >
                  <div className={styles.leaderAvatar} />
                  <div>
                    <div className={styles.leaderName}>Sarah Lum</div>
                    <div className={styles.leaderMeta}>
                      Kyoto · 2022–2024
                    </div>
                  </div>
                </div>
                <div className={styles.leaderRow}>
                  <div className={styles.leaderAvatar} />
                  <div>
                    <div className={styles.leaderLocation}>
                      Charleston, SC
                    </div>
                    <div className={styles.leaderName}>Gordon Rooney</div>
                    <div className={styles.leaderMeta}>
                      Chiba · 2011–2013
                    </div>
                  </div>
                </div>
              </div>
              <a href="#" className={styles.fbBtn}>
                Join the Facebook group →
              </a>
            </div>
          </div>
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
