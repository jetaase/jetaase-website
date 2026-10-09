import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CULTURE_LINKS, CultureIcon } from "@/components/CultureBand";
import Directory, { type DirCategory, type DirEntry } from "./Directory";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Resources" };

// Directory compiled by the Consulate-General of Japan in Atlanta.
// Most entries link to its pages; a few point to other organizations.
const CONSULATE = "https://www.atlanta.us.emb-japan.go.jp";

const c = (name: string, page: string): DirEntry => ({ name, href: `${CONSULATE}/${page}` });

const STATE_FACT_SHEETS: DirEntry[] = [
  c("Japan in Alabama", "japanalabama.html"),
  c("Japan in Georgia", "japangeorgia.html"),
  c("Japan in North Carolina", "japannorthcarolina.html"),
  c("Japan in South Carolina", "japansouthcarolina.html"),
];

const ARTS_CULTURE: DirEntry[] = [
  c("Ame-saiku (candy sculpting)", "candy.html"),
  c("Anime and Manga", "animation.html"),
  c("Antiques / Appraisals", "antiques.html"),
  c("Architecture and Carpentry", "architecture.html"),
  c("Bamboo and Asian Plants", "bamboo.html"),
  c("Beauty Salons", "beautysalons.html"),
  c("Bonsai", "bonsai.html"),
  c("Books", "books.html"),
  c("Calligraphy & Sumi-e", "calligraphy.html"),
  c("Cooking", "cooking.html"),
  c("Dolls", "dolls.html"),
  c("Embroidery", "embroidery.html"),
  c("Films and Videos", "films.html"),
  c("Galleries and Museums", "galleries.html"),
  c("Games", "games.html"),
  c("Gardens and Gardening", "gardens.html"),
  c("Grocery Stores and Housewares", "grocerystores.html"),
  c("Haiku", "haiku.html"),
  c("Ikebana (flower arranging)", "ikebana.html"),
  c("Incense", "incense.html"),
  c("Japanese Dance", "dance.html"),
  c("Kimono and Fashion", "kimono.html"),
  c("Koi", "koi.html"),
  c("Martial Arts", "martialarts.html"),
  c("Paper Arts (origami, washi)", "paperarts.html"),
  c("Tea Ceremony", "teaceremony.html"),
  c("Western Music and Dance", "westernmusic.html"),
];

const ASSOCIATIONS: DirEntry[] = [
  c("Japanese Embassies and Consulates Around the World", "consulates.html"),
  c("Japan-related Organizations in the Southeast", "jpnrelatedorg.html"),
  c("Sister City Organizations in the Southeast", "sistercities.html"),
  c("Trade and Business Organizations in the Southeast", "tradebusiness.html"),
];

const EDU_K12: DirEntry[] = [
  c("Japanese Daycare Centers in the Southeast", "daycares.html"),
  c("Japanese Language Saturday Schools in the Southeast", "nihongo/shisetsulist.html"),
  c("Elementary and High Schools with Japanese Language Programs", "highschools.html"),
  c("Japanese Culture Summer Camps in the Southeast", "summercamp.html"),
  c("Scholarships, Study Abroad & Exchange (K-12)", "k12grants.html"),
  c("Resources on Japanese Culture for Teachers", "teacherresources.html"),
];

const EDU_UNIVERSITY: DirEntry[] = [
  c("Colleges & Universities with Japanese Language Programs", "colleges.html"),
  {
    name: "Japan Foundation Directory of Japanese-Language Institutions",
    href: "https://www.jpf.go.jp/e/project/japanese/survey/area/",
  },
];

const EDU_GENERAL: DirEntry[] = [
  c("Japanese Language Classes in the Southeast", "japaneseclasses.html"),
  c("Resources for Japanese Language Students and Teachers", "japaneselearningtools.html"),
  c("ESL Schools and Tutors for Japanese Speakers", "eslschools.html"),
];

const EDU_CAREER: DirEntry[] = [
  c("Internships in Japan", "internship.html"),
  c("Teaching English in Japan", "teaching.html"),
  c("Non-Teaching Jobs in Japan", "nonteaching.html"),
  c("Japan-Related Jobs in the United States", "career.html"),
];

const ENTERTAINMENT: DirEntry[] = [
  c("Japanese-style Accommodations in the U.S.", "accomodations.html"),
  c("Annual Japan-related Events", "events.html"),
  c("Japanese Restaurants", "restaurants.html"),
  c("Karaoke", "karaoke.html"),
];

const MEDIA: DirEntry[] = [
  {
    name: "NA Coordinating Council on Japanese Library Resources (NCC)",
    href: "https://guides.nccjapan.org/homepage",
  },
  c("Electronic Information and Databases", "databases.html"),
  c("English Language Newspapers", "englishnewspapers.html"),
  {
    name: "Japanese Studies Research Guide (Duke University)",
    href: "https://guides.library.duke.edu/japan",
  },
  c("Japanese Language Newspapers", "japanesenewspapers.html"),
  c("Japanese Language Periodicals", "japaneseperiodicals.html"),
  c("Television Programming in Japanese", "television.html"),
];

const SERVICES: DirEntry[] = [
  c("Currency Exchange", "currencyexchange.html"),
  c("Health and Medical Services", "health.html"),
  c("Interpreters and Translators", "interpreters.html"),
  c("Printing Services", "printing.html"),
];

const DIRECTORY: DirCategory[] = [
  {
    id: "state", chip: "State fact sheets", title: "State fact sheets", columns: 3,
    groups: [{ entries: STATE_FACT_SHEETS }],
  },
  {
    id: "arts", chip: "Arts & culture", title: "Arts & culture", columns: 3,
    groups: [{ entries: ARTS_CULTURE }],
  },
  {
    id: "associations", chip: "Associations & gov",
    title: "Associations & government agencies", columns: 2,
    groups: [{ entries: ASSOCIATIONS }],
  },
  {
    id: "education", chip: "Education & careers",
    title: "Education & career resources", columns: 2,
    groups: [
      { label: "K-12 level", entries: EDU_K12 },
      { label: "University level", entries: EDU_UNIVERSITY },
      { label: "General language study", entries: EDU_GENERAL },
      { label: "Career resources", entries: EDU_CAREER },
    ],
  },
  {
    id: "entertainment", chip: "Entertainment", title: "Entertainment", columns: 2,
    groups: [{ entries: ENTERTAINMENT }],
  },
  {
    id: "media", chip: "Media", title: "Media", columns: 2,
    groups: [{ entries: MEDIA }],
  },
  {
    id: "services", chip: "Services", title: "Services", columns: 3,
    groups: [{ entries: SERVICES }],
  },
];

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
          <div className={styles.heroImageWrap}>
            <img
              src="/images/kyoto-bookshelf.jpg"
              alt="Shelves of Japanese paperbacks in a Kyoto bookshop"
              className={styles.heroImage}
            />
            <a
              href="https://unsplash.com/photos/a-book-shelf-filled-with-lots-of-books-cB70SPAS0eo"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.photoCredit}
            >
              Photo: Hendrik Schuette / Unsplash
            </a>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className={styles.featured}>
        <div className={styles.featuredGrid}>
          <a
            href="https://jetprogramme.org/en/"
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
            href="https://usjetaa.org/"
            target="_blank"
            rel="noopener"
            className={styles.featuredCardBlue}
          >
            <div className={styles.featuredEyebrow}>The bigger network</div>
            <div className={styles.featuredTitle}>USJETAA</div>
            <p className={styles.featuredDesc}>
              All 19 alumni chapters across the country.
            </p>
            <span className={styles.featuredLink}>
              usjetaa.org <span className={styles.arrow}>↗</span>
            </span>
          </a>
        </div>
      </section>

      {/* CATEGORY: JAPANESE */}
      <section id="japanese" className={styles.category}>
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
      <section id="careers" className={`${styles.category} ${styles.categoryTight}`}>
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
            href="https://www.jasgeorgia.org/Job-Bank"
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
      <section id="culture" className={`${styles.category} ${styles.categoryTight}`}>
        <div className={styles.categoryHeader}>
          <span className={`${styles.categoryIcon} ${styles.iconCulture}`}>
            <CultureIcon />
          </span>
          <div>
            <h2 className={styles.categoryTitle}>Culture near you</h2>
            <p className={styles.categorySubtitle}>
              Each state&apos;s Japan-America society brings Japanese culture
              and community to the Southeast.
            </p>
          </div>
        </div>
        <div className={styles.categoryGrid4}>
          {CULTURE_LINKS.map((l) => (
            <a
              key={l.homepage}
              href={l.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.linkCard}
            >
              <span className={styles.linkCardTitle}>{l.name}</span>
              <span className={styles.linkCardDesc}>
                Programs, events, and community in {l.state}.
              </span>
              <span className={styles.linkCardArrow}>↗</span>
            </a>
          ))}
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
              Dozens of listings across the Southeast, compiled by the
              Consulate-General of Japan in Atlanta. Search by name or
              filter by category to jump straight to what you need.
            </p>
          </div>
        </div>

        <Directory categories={DIRECTORY} />
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
