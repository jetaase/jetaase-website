import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import Poster from "@/components/Poster";
import { readEvents } from "@/lib/content";
import { formatEventDate, isValidDate, todayInEastern, toParagraphs } from "@/lib/events";
import styles from "./page.module.css";

export const revalidate = 3600;

type Params = { params: Promise<{ slug: string }> };

const findEvent = (slug: string) => readEvents().find((e) => e.slug === slug);

export function generateStaticParams() {
  return readEvents().filter((e) => e.slug).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const event = findEvent((await params).slug);
  if (!event) return {};
  const description = event.summary || undefined;
  return {
    title: event.title,
    description,
    openGraph: { title: event.title, description, images: event.poster ? [event.poster] : undefined },
  };
}

export default async function EventPage({ params }: Params) {
  const event = findEvent((await params).slug);
  if (!event) notFound();
  const isPast = isValidDate(event.date) && event.date < todayInEastern(new Date());
  const when = [formatEventDate(event.date, "long"), event.time].filter(Boolean).join(" · ");

  return (
    <>
      <div className={styles.main}>
        <Link href="/events" className={styles.back}>← All events</Link>
        <div className={styles.grid}>
          <Poster event={event} className={styles.poster} priority />
          <div className={styles.info}>
            {when && <div className={styles.date}>{when}</div>}
            <h1 className={styles.title}>{event.title}</h1>
            {event.location && <div className={styles.location}>{event.location}</div>}
            {isPast ? (
              <p className={styles.passed}>This event has passed.</p>
            ) : (
              event.rsvpUrl && (
                <a href={event.rsvpUrl} target="_blank" rel="noopener noreferrer" className={styles.rsvpBtn}>
                  RSVP
                </a>
              )
            )}
          </div>
        </div>
        {event.details && (
          <div className={styles.details}>
            {toParagraphs(event.details).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        )}
        {event.photos.length > 0 && (
          <Gallery photos={event.photos} eventTitle={event.title} credit={event.photoCredit} />
        )}
      </div>
    </>
  );
}
