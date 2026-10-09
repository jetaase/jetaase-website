import { requireSession } from "@/lib/auth-cookie";
import {
  readEvents, readPartnerEvents, readRaw, EVENTS_PATH, PARTNERS_PATH,
} from "@/lib/content";
import type { JetaaseEvent, PartnerEvent } from "@/lib/events";
import { gitBlobSha } from "@/lib/git-sha";
import ListEditor, { type Field } from "../ListEditor";

const EVENT_FIELDS: Field[] = [
  { key: "title", label: "Event name", required: true },
  { key: "date", label: "Date", type: "date", required: true },
  { key: "time", label: "Time", placeholder: "e.g. 2:00–6:00 PM" },
  { key: "location", label: "Location", placeholder: "e.g. Piedmont Park, Atlanta, GA or Online" },
  { key: "summary", label: "Short summary", placeholder: "One line for the event card" },
  { key: "details", label: "Full details", type: "textarea", hint: "Leave a blank line between paragraphs" },
  { key: "poster", label: "Poster", kind: "photo" },
  { key: "rsvpUrl", label: "RSVP link (optional)", type: "url", placeholder: "e.g. a Google Form link" },
  { key: "photos", label: "Photos", kind: "gallery" },
  { key: "photoCredit", label: "Photo credit (optional)", placeholder: "e.g. Photos by Jane Doe" },
];

const PARTNER_FIELDS: Field[] = [
  { key: "title", label: "Event name", required: true },
  { key: "host", label: "Host", required: true, placeholder: "e.g. JETAA USA" },
  { key: "date", label: "Date", type: "date", required: true },
  { key: "time", label: "Time", placeholder: "e.g. 7:00 PM" },
  { key: "location", label: "Location", placeholder: "e.g. Atlanta, GA or Online" },
  { key: "summary", label: "Short description", type: "textarea", rows: 3, placeholder: "A sentence or two about what it is" },
  { key: "poster", label: "Poster", kind: "photo" },
  { key: "link", label: "Event link (optional)", type: "url", placeholder: "The host's page for this event" },
];

// ListEditor fills in today's date for new items.
const BLANK_EVENT: Omit<JetaaseEvent, "id" | "order"> = {
  slug: "", title: "", date: "", time: "", location: "", summary: "", details: "", poster: "", rsvpUrl: "",
  photos: [], photoCredit: "",
};

const BLANK_PARTNER: Omit<PartnerEvent, "id" | "order"> = {
  title: "", host: "", date: "", time: "", location: "", link: "", poster: "", summary: "",
};

export default async function EventsAdminPage() {
  // The layout shows the login form; this guards the data too.
  if (!(await requireSession())) return null;
  return (
    <>
      <ListEditor
        title="Events" itemLabel="event" idPrefix="e" byDate slugs galleries={["photos"]}
        base={{ [EVENTS_PATH]: gitBlobSha(readRaw("events.json")) }} uploadFolder="events"
        path={EVENTS_PATH} commitMessage="chore(admin): update events"
        fields={EVENT_FIELDS} blank={BLANK_EVENT} initial={readEvents()}
      />
      <ListEditor
        title="Partner events" itemLabel="partner event" idPrefix="p" byDate
        base={{ [PARTNERS_PATH]: gitBlobSha(readRaw("partner-events.json")) }} uploadFolder="events"
        path={PARTNERS_PATH} commitMessage="chore(admin): update partner events"
        fields={PARTNER_FIELDS} blank={BLANK_PARTNER} initial={readPartnerEvents()}
      />
    </>
  );
}
