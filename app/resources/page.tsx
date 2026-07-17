import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./page.module.css";

const STATE_FACT_SHEETS = [
  "Japan in Alabama",
  "Japan in Georgia",
  "Japan in North Carolina",
  "Japan in South Carolina",
];

const ARTS_CULTURE = [
  "Ame-saiku (candy sculpting)",
  "Anime and Manga",
  "Antiques / Appraisals",
  "Architecture and Carpentry",
  "Bamboo and Asian Plants",
  "Beauty Salons",
  "Bonsai",
  "Books",
  "Calligraphy & Sumi-e",
  "Cooking",
  "Dolls",
  "Embroidery",
  "Films and Videos",
  "Galleries and Museums",
  "Games",
  "Gardens and Gardening",
  "Grocery Stores and Housewares",
  "Haiku",
  "Ikebana (flower arranging)",
  "Incense",
  "Japanese Dance",
  "Kimono and Fashion",
  "Koi",
  "Martial Arts",
  "Paper Arts (origami, washi)",
  "Tea Ceremony",
  "Western Music and Dance",
];

const ASSOCIATIONS = [
  "Japanese Embassies and Consulates Around the World",
  "Japan-related Organizations in the Southeast",
  "Sister City Organizations in the Southeast",
  "Trade and Business Organizations in the Southeast",
];

const EDU_K12 = [
  "Japanese Daycare Centers in the Southeast",
  "Japanese Language Saturday Schools in the Southeast",
  "Elementary and High Schools with Japanese Language Programs",
  "Japanese Culture Summer Camps in the Southeast",
  "Scholarships, Study Abroad & Exchange (K-12)",
  "Resources on Japanese Culture for Teachers",
  "Finding a Pen Pal in Japan (PDF)",
];

const EDU_UNIVERSITY = [
  "Colleges & Universities with Japanese Language Programs",
  "Japan Foundation Directory of Japanese-Language Institutions (US)",
];

const EDU_GENERAL = [
  "Japanese Language Classes in the Southeast",
  "Resources for Japanese Language Students and Teachers",
  "ESL Schools and Tutors for Japanese Speakers",
];

const EDU_CAREER = [
  "Internships in Japan",
  "Teaching English in Japan",
  "Non-Teaching Jobs in Japan",
  "Japan-Related Jobs in the United States",
];

const ENTERTAINMENT = [
  "Japanese-style Accommodations in the U.S.",
  "Annual Japan-related Events",
  "Japanese Restaurants",
  "Karaoke",
];

const MEDIA = [
  "NA Coordinating Council on Japanese Library Resources (NCC)",
  "Electronic Information and Databases",
  "English Language Newspapers",
  "English Language Periodicals (Duke University list)",
  "Japanese Language Newspapers",
  "Japanese Language Periodicals",
  "Television Programming in Japanese",
];

const SERVICES = [
  "Currency Exchange",
  "Health and Medical Services",
  "Interpreters and Translators",
  "Printing Services",
];

function DirItem({ name }: { name: string }) {
  return (
    <a
      className={styles.dirItem}
      href="#"
      target="_blank"
      rel="noopener"
      data-name={name.toLowerCase()}
    >
      <span className={styles.dirMark} />
      {name}
    </a>
  );
}

export default function ResourcesPage() {
  return (
    <div className={styles.pageRoot}>
      <Header />

      {/* PAGE HERO */}
      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          <div>
            <div className={styles.directoryEyebrow}>Your Japan toolkit</div>
            <h1 className={styles.heroTitle}>Resources</h1>
            <p className={styles.heroSubtitle}>
              Hand-picked links and guides from alumni who&apos;ve walked the
              path, whether you&apos;re applying to JET, keeping your
              Japanese sharp, job hunting, or chasing a matsuri near home.
            </p>
          </div>
          <div className={styles.heroImageWrap} />
        </div>
      </section>

      {/* FEATURED */}
      <section className={styles.featured}>
        <div className={styles.featuredGrid}>
          <a
            href="http://www.jetprogramme.org/"
            target="_blank"
            rel="noopener"
            className={styles.featuredCardRed}
          >
            <div className={styles.featuredEyebrow}>Start here</div>
            <div className={styles.featuredTitle}>
              The JET Programme, official site
            </div>
            <p className={styles.featuredDesc}>
              Eligibility, positions, timelines, and how to apply straight
              from the source.
            </p>
            <span className={styles.featuredLink}>
              jetprogramme.org <span className={styles.arrow}>↗</span>
            </span>
          </a>
          <a
            href="https://jetaausa.com/"
            target="_blank"
            rel="noopener"
            className={styles.featuredCardBlue}
          >
            <div className={styles.featuredEyebrow}>The bigger network</div>
            <div className={styles.featuredTitle}>JETAA USA</div>
            <p className={styles.featuredDesc}>
              All 19 alumni chapters across the country. We&apos;re chapter
              4, the Southeast.
            </p>
            <span className={styles.featuredLink}>
              jetaausa.com <span className={styles.arrow}>↗</span>
            </span>
          </a>
        </div>
      </section>

      {/* CATEGORY: APPLYING */}
      <section className={styles.category}>
        <div className={styles.categoryHeader}>
          <span className={`${styles.categoryIcon} ${styles.iconApplying}`}>
            <svg
              width="22"
              height="22"
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
          <div>
            <h2 className={styles.categoryTitle}>Applying to JET</h2>
            <p className={styles.categorySubtitle}>
              Timelines, interview prep, and the offices that run it all.
            </p>
          </div>
        </div>
        <div className={styles.categoryGrid3}>
          <a
            href="https://www.us.emb-japan.go.jp/jetprogram/"
            target="_blank"
            rel="noopener"
            className={styles.linkCard}
          >
            <span className={styles.linkCardTitle}>
              Embassy of Japan, JET info
            </span>
            <span className={styles.linkCardDesc}>
              US application portal, deadlines, and required documents.
            </span>
            <span className={styles.linkCardArrow}>↗</span>
          </a>
          <a
            href="https://www.atlanta.us.emb-japan.go.jp/"
            target="_blank"
            rel="noopener"
            className={styles.linkCard}
          >
            <span className={styles.linkCardTitle}>
              Consulate General, Atlanta
            </span>
            <span className={styles.linkCardDesc}>
              Our regional interview point for AL, GA, NC &amp; SC
              applicants.
            </span>
            <span className={styles.linkCardArrow}>↗</span>
          </a>
          <a
            href="https://www.clair.or.jp/e/"
            target="_blank"
            rel="noopener"
            className={styles.linkCard}
          >
            <span className={styles.linkCardTitle}>CLAIR</span>
            <span className={styles.linkCardDesc}>
              The Japanese body that administers JET and supports
              participants.
            </span>
            <span className={styles.linkCardArrow}>↗</span>
          </a>
        </div>
      </section>

      {/* CATEGORY: JAPANESE */}
      <section className={`${styles.category} ${styles.categoryTight}`}>
        <div className={styles.categoryHeader}>
          <span className={`${styles.categoryIcon} ${styles.iconJapanese}`}>
            <svg
              width="22"
              height="22"
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
          <div>
            <h2 className={styles.categoryTitle}>Keep up your Japanese</h2>
            <p className={styles.categorySubtitle}>
              Apps, reading, and tests to stay sharp long after you&apos;re
              back.
            </p>
          </div>
        </div>
        <div className={styles.categoryGrid4}>
          <a
            href="https://www3.nhk.or.jp/news/easy/"
            target="_blank"
            rel="noopener"
            className={styles.linkCard}
          >
            <span className={styles.linkCardTitle}>NHK News Web Easy</span>
            <span className={styles.linkCardDesc}>
              Real news with furigana, built for learners.
            </span>
            <span className={styles.linkCardArrow}>↗</span>
          </a>
          <a
            href="https://www.wanikani.com/"
            target="_blank"
            rel="noopener"
            className={styles.linkCard}
          >
            <span className={styles.linkCardTitle}>WaniKani</span>
            <span className={styles.linkCardDesc}>
              Kanji and vocab through spaced repetition.
            </span>
            <span className={styles.linkCardArrow}>↗</span>
          </a>
          <a
            href="https://www.tofugu.com/"
            target="_blank"
            rel="noopener"
            className={styles.linkCard}
          >
            <span className={styles.linkCardTitle}>Tofugu</span>
            <span className={styles.linkCardDesc}>
              Guides on language, culture, and study habits.
            </span>
            <span className={styles.linkCardArrow}>↗</span>
          </a>
          <a
            href="https://www.jlpt.jp/e/"
            target="_blank"
            rel="noopener"
            className={styles.linkCard}
          >
            <span className={styles.linkCardTitle}>JLPT, official</span>
            <span className={styles.linkCardDesc}>
              Proficiency test levels, dates, and US sites.
            </span>
            <span className={styles.linkCardArrow}>↗</span>
          </a>
        </div>
      </section>

      {/* CATEGORY: CAREERS */}
      <section className={`${styles.category} ${styles.categoryTight}`}>
        <div className={styles.categoryHeader}>
          <span className={`${styles.categoryIcon} ${styles.iconCareers}`}>
            <svg
              width="22"
              height="22"
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
          <div>
            <h2 className={styles.categoryTitle}>Careers &amp; jobs</h2>
            <p className={styles.categorySubtitle}>
              Put your JET experience to work back home.
            </p>
          </div>
        </div>
        <div className={styles.categoryGrid3}>
          <a
            href="https://jetwit.com/"
            target="_blank"
            rel="noopener"
            className={styles.linkCard}
          >
            <span className={styles.linkCardTitle}>JETwit</span>
            <span className={styles.linkCardDesc}>
              The JET alumni network&apos;s job board and career column.
            </span>
            <span className={styles.linkCardArrow}>↗</span>
          </a>
          <a
            href="https://usjetaa.org/"
            target="_blank"
            rel="noopener"
            className={styles.linkCard}
          >
            <span className={styles.linkCardTitle}>USJETAA</span>
            <span className={styles.linkCardDesc}>
              Career webinars, grants, and alumni programming nationwide.
            </span>
            <span className={styles.linkCardArrow}>↗</span>
          </a>
          <a
            href="https://www.jasgeorgia.org/"
            target="_blank"
            rel="noopener"
            className={styles.linkCard}
          >
            <span className={styles.linkCardTitle}>
              Japan-America Society of GA
            </span>
            <span className={styles.linkCardDesc}>
              Business networking and Japan-tied employers in the region.
            </span>
            <span className={styles.linkCardArrow}>↗</span>
          </a>
        </div>
      </section>

      {/* CULTURE BAND w/ PHOTO */}
      <section className={styles.cultureSection}>
        <div className={styles.cultureBand}>
          <div className={styles.cultureCopy}>
            <span className={`${styles.categoryIcon} ${styles.iconCulture}`}>
              <svg
                width="22"
                height="22"
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
            <h2 className={styles.cultureTitle}>Culture near you</h2>
            <p className={styles.cultureText}>
              Festivals, consulate events, and matsuri across the Southeast
              so you never have to miss home.
            </p>
            <div className={styles.cultureLinks}>
              <a
                href="https://www.atlanta.us.emb-japan.go.jp/"
                target="_blank"
                rel="noopener"
                className={styles.cultureLinkCard}
              >
                <span className={styles.cultureLinkTitle}>
                  Consulate cultural events
                </span>
                <span className={styles.linkCardArrow}>↗</span>
              </a>
              <a
                href="https://www.japanfest.org/"
                target="_blank"
                rel="noopener"
                className={styles.cultureLinkCard}
              >
                <span className={styles.cultureLinkTitle}>
                  JapanFest Atlanta
                </span>
                <span className={styles.linkCardArrow}>↗</span>
              </a>
              <Link href="/events" className={styles.cultureLinkCard}>
                <span className={styles.cultureLinkTitle}>
                  JETAASE events calendar
                </span>
                <span className={styles.linkCardArrow}>→</span>
              </Link>
            </div>
          </div>
          <div className={styles.culturePhotoWrap} />
        </div>
      </section>

      {/* FULL DIRECTORY */}
      <section className={styles.directorySection}>
        <div className={styles.directoryIntro}>
          <div className={styles.directoryIntroInner}>
            <div className={styles.directoryEyebrow}>The full index</div>
            <h2 className={styles.directoryTitle}>
              Directory of Japan-related resources
            </h2>
            <p className={styles.directoryText}>
              Hundreds of listings across the Southeast, compiled by the
              Consulate-General of Japan in Atlanta. Search by name or
              filter by category to jump straight to what you need.
            </p>
          </div>
        </div>

        {/* STICKY TOOLBAR — static visual port, no filtering JS wired */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarInner}>
            <div className={styles.toolbarRow}>
              <div className={styles.searchWrap}>
                <span className={styles.searchIcon}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                  </svg>
                </span>
                <input
                  id="dir-search"
                  type="text"
                  placeholder="Search 200+ resources, e.g. bonsai, restaurants, jobs"
                  className={styles.searchInput}
                />
              </div>
              <div className={styles.resultCount} />
            </div>
            <div className={styles.chipsRow}>
              <button
                type="button"
                className={`${styles.chip} ${styles.chipActive}`}
              >
                All
              </button>
              <button type="button" className={styles.chip}>
                State fact sheets
              </button>
              <button type="button" className={styles.chip}>
                Arts &amp; culture
              </button>
              <button type="button" className={styles.chip}>
                Associations &amp; gov
              </button>
              <button type="button" className={styles.chip}>
                Education &amp; careers
              </button>
              <button type="button" className={styles.chip}>
                Entertainment
              </button>
              <button type="button" className={styles.chip}>
                Media
              </button>
              <button type="button" className={styles.chip}>
                Services
              </button>
            </div>
          </div>
        </div>

        {/* DIRECTORY BODY */}
        <div className={styles.directoryBody}>
          <div className={styles.dirCat}>
            <div className={styles.dirCatHeader}>
              <h3 className={styles.dirCatTitle}>State fact sheets</h3>
              <span className={styles.dirCatCount}>04</span>
            </div>
            <div className={styles.dirColumns3}>
              {STATE_FACT_SHEETS.map((name) => (
                <DirItem key={name} name={name} />
              ))}
            </div>
          </div>

          <div className={styles.dirCat}>
            <div className={styles.dirCatHeader}>
              <h3 className={styles.dirCatTitle}>Arts &amp; culture</h3>
              <span className={styles.dirCatCount}>26</span>
            </div>
            <div className={styles.dirColumns3}>
              {ARTS_CULTURE.map((name) => (
                <DirItem key={name} name={name} />
              ))}
            </div>
          </div>

          <div className={styles.dirCat}>
            <div className={styles.dirCatHeader}>
              <h3 className={styles.dirCatTitle}>
                Associations &amp; government agencies
              </h3>
              <span className={styles.dirCatCount}>04</span>
            </div>
            <div className={styles.dirColumns2}>
              {ASSOCIATIONS.map((name) => (
                <DirItem key={name} name={name} />
              ))}
            </div>
          </div>

          <div className={styles.dirCat}>
            <div className={styles.dirCatHeader}>
              <h3 className={styles.dirCatTitle}>
                Education &amp; career resources
              </h3>
              <span className={styles.dirCatCount}>16</span>
            </div>
            <div className={styles.dirGroup}>
              <div
                className={`${styles.dirGroupLabel} ${styles.dirGroupLabelFirst}`}
              >
                K-12 level
              </div>
              <div className={styles.dirColumns2}>
                {EDU_K12.map((name) => (
                  <DirItem key={name} name={name} />
                ))}
              </div>
            </div>
            <div className={styles.dirGroup}>
              <div className={styles.dirGroupLabel}>University level</div>
              <div className={styles.dirColumns2}>
                {EDU_UNIVERSITY.map((name) => (
                  <DirItem key={name} name={name} />
                ))}
              </div>
            </div>
            <div className={styles.dirGroup}>
              <div className={styles.dirGroupLabel}>
                General language study
              </div>
              <div className={styles.dirColumns2}>
                {EDU_GENERAL.map((name) => (
                  <DirItem key={name} name={name} />
                ))}
              </div>
            </div>
            <div className={styles.dirGroup}>
              <div className={styles.dirGroupLabel}>Career resources</div>
              <div className={styles.dirColumns2}>
                {EDU_CAREER.map((name) => (
                  <DirItem key={name} name={name} />
                ))}
              </div>
            </div>
          </div>

          <div className={styles.dirCat}>
            <div className={styles.dirCatHeader}>
              <h3 className={styles.dirCatTitle}>Entertainment</h3>
              <span className={styles.dirCatCount}>04</span>
            </div>
            <div className={styles.dirColumns2}>
              {ENTERTAINMENT.map((name) => (
                <DirItem key={name} name={name} />
              ))}
            </div>
          </div>

          <div className={styles.dirCat}>
            <div className={styles.dirCatHeader}>
              <h3 className={styles.dirCatTitle}>Media</h3>
              <span className={styles.dirCatCount}>07</span>
            </div>
            <div className={styles.dirColumns2}>
              {MEDIA.map((name) => (
                <DirItem key={name} name={name} />
              ))}
            </div>
          </div>

          <div className={styles.dirCat}>
            <div className={styles.dirCatHeader}>
              <h3 className={styles.dirCatTitle}>Services</h3>
              <span className={styles.dirCatCount}>04</span>
            </div>
            <div className={styles.dirColumns3}>
              {SERVICES.map((name) => (
                <DirItem key={name} name={name} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SUGGEST A LINK */}
      <section className={styles.suggest}>
        <div className={styles.suggestBox}>
          <div className={styles.suggestCopy}>
            <h2 className={styles.suggestTitle}>
              Know a link we&apos;re missing?
            </h2>
            <p className={styles.suggestText}>
              This page is built by alumni. If a resource helped you, send
              it our way and we&apos;ll add it for the next crew.
            </p>
          </div>
          <a
            href="mailto:info@jetaase.org?subject=Resource%20suggestion"
            className={styles.suggestBtn}
          >
            Suggest a resource
          </a>
        </div>
      </section>

      {/* JOIN CTA */}
      <section className={styles.joinSection}>
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
