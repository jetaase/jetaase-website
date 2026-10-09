import { describe, it, expect, vi, afterEach } from "vitest";
import {
  isValidDate, todayInEastern, splitEvents, upcomingPartners,
  makeSlug, assignSlugs, formatEventDate, dateParts, toParagraphs, normalizeEvent, normalizePartner, photoCountLabel,
} from "./events";

describe("isValidDate", () => {
  it("accepts real YYYY-MM-DD dates", () => {
    expect(isValidDate("2026-10-03")).toBe(true);
    expect(isValidDate("2028-02-29")).toBe(true);
  });
  it("rejects malformed or impossible dates", () => {
    for (const d of ["", "2026-1-3", "10/03/2026", "2026-02-30", "2026-13-01", "nope"]) {
      expect(isValidDate(d)).toBe(false);
    }
  });
});

describe("todayInEastern", () => {
  it("is still yesterday in Eastern late in the evening (EDT, UTC-4)", () => {
    expect(todayInEastern(new Date("2026-10-09T03:59:00Z"))).toBe("2026-10-08");
    expect(todayInEastern(new Date("2026-10-09T04:00:00Z"))).toBe("2026-10-09");
  });
  afterEach(() => vi.restoreAllMocks());
  it("doesn't depend on how the locale formats short dates", () => {
    // Some ICU versions format en-CA as M/D/YYYY; build the string from parts instead.
    const proto = Intl.DateTimeFormat.prototype as unknown as Record<"format", unknown>;
    vi.spyOn(proto, "format", "get").mockReturnValue(() => "10/08/2026");
    expect(todayInEastern(new Date("2026-10-08T16:00:00Z"))).toBe("2026-10-08");
  });
  it("follows standard time in winter (EST, UTC-5)", () => {
    expect(todayInEastern(new Date("2026-12-01T04:59:00Z"))).toBe("2026-11-30");
    expect(todayInEastern(new Date("2026-12-01T05:00:00Z"))).toBe("2026-12-01");
  });
});

describe("splitEvents", () => {
  const e = (id: string, date: string) => ({ id, date });
  const today = "2026-10-08";

  it("treats an event today as upcoming and yesterday's as past", () => {
    const r = splitEvents([e("y", "2026-10-07"), e("t", "2026-10-08")], today);
    expect(r.next?.id).toBe("t");
    expect(r.past.map((x) => x.id)).toEqual(["y"]);
  });
  it("sorts upcoming soonest first and past newest first", () => {
    const r = splitEvents(
      [e("a", "2026-12-01"), e("b", "2026-01-01"), e("c", "2026-10-20"), e("d", "2026-06-01"), e("f", "2026-11-01")],
      today,
    );
    expect(r.next?.id).toBe("c");
    expect(r.upcoming.map((x) => x.id)).toEqual(["f", "a"]);
    expect(r.past.map((x) => x.id)).toEqual(["d", "b"]);
  });
  it("skips events with invalid dates", () => {
    const r = splitEvents([e("bad", "soon"), e("ok", "2026-10-09")], today);
    expect(r.next?.id).toBe("ok");
    expect(r.upcoming).toEqual([]);
    expect(r.past).toEqual([]);
  });
  it("has no next event when nothing is upcoming", () => {
    const r = splitEvents([e("old", "2025-01-01")], today);
    expect(r.next).toBeUndefined();
    expect(r.upcoming).toEqual([]);
  });
});

describe("upcomingPartners", () => {
  it("keeps today and later, soonest first, skipping invalid dates", () => {
    const r = upcomingPartners(
      [{ id: "1", date: "2026-11-01" }, { id: "2", date: "2026-10-08" }, { id: "3", date: "2026-10-07" }, { id: "4", date: "x" }],
      "2026-10-08",
    );
    expect(r.map((x) => x.id)).toEqual(["2", "1"]);
  });
});

describe("makeSlug", () => {
  it("joins the slugified title and the month", () => {
    expect(makeSlug("Fall Welcome!", "2026-10-03", new Set())).toBe("fall-welcome-2026-10");
  });
  it("strips accents and punctuation", () => {
    expect(makeSlug("Café Night: Ōsaka Edition", "2026-11-12", new Set())).toBe("cafe-night-osaka-edition-2026-11");
  });
  it("adds -2, -3 when the slug is taken", () => {
    const taken = new Set(["meetup-2026-10", "meetup-2026-10-2"]);
    expect(makeSlug("Meetup", "2026-10-01", taken)).toBe("meetup-2026-10-3");
  });
  it("uses 'event' when the title has no Latin letters, e.g. a Japanese-only name", () => {
    expect(makeSlug("忘年会", "2026-12-12", new Set())).toBe("event-2026-12");
  });
  it("keeps a real 'photo' in the title", () => {
    expect(makeSlug("Photo Walk", "2026-12-12", new Set())).toBe("photo-walk-2026-12");
  });
  it("falls back to 'event' for a blank title and leaves out an invalid date", () => {
    expect(makeSlug("  ", "", new Set())).toBe("event");
  });
});

describe("assignSlugs", () => {
  it("fills in only missing slugs and never changes existing ones", () => {
    const items = [
      { id: "1", title: "Renamed Event", date: "2026-10-03", slug: "fall-welcome-2026-10" },
      { id: "2", title: "Fall Welcome", date: "2026-10-20", slug: "" },
      { id: "3", title: "Fall Welcome", date: "2026-10-25" },
    ];
    expect(assignSlugs(items).map((i) => i.slug)).toEqual([
      "fall-welcome-2026-10", "fall-welcome-2026-10-2", "fall-welcome-2026-10-3",
    ]);
  });
  it("does not modify the input array", () => {
    const items = [{ id: "1", title: "A", date: "2026-10-03" }];
    assignSlugs(items);
    expect("slug" in items[0]).toBe(false);
  });
});

describe("formatEventDate", () => {
  // 2026-10-03 is a Saturday. Every style must show the 3rd, never the 2nd.
  it("formats without shifting the day", () => {
    expect(formatEventDate("2026-10-03", "weekday")).toBe("SAT · OCT 03");
    expect(formatEventDate("2026-10-03", "day")).toBe("OCT 03");
    expect(formatEventDate("2026-06-01", "month")).toBe("JUN 2026");
    expect(formatEventDate("2026-10-03", "long")).toBe("Saturday, October 3, 2026");
  });
  it("returns an empty string for an invalid date", () => {
    expect(formatEventDate("soon", "long")).toBe("");
  });
});

describe("dateParts", () => {
  it("gives the short month and day number", () => {
    expect(dateParts("2026-10-03")).toEqual({ month: "OCT", day: "3" });
    expect(dateParts("bad")).toEqual({ month: "", day: "" });
  });
});

describe("toParagraphs", () => {
  it("splits on blank lines and drops empty pieces", () => {
    expect(toParagraphs("One\nstill one\n\n\n  Two  \n \nThree")).toEqual(["One\nstill one", "Two", "Three"]);
    expect(toParagraphs("   ")).toEqual([]);
  });
});

describe("normalizeEvent", () => {
  it("fills a missing gallery and credit", () => {
    const e = normalizeEvent({ id: "e1", title: "T", date: "2026-01-01" });
    expect(e.photos).toEqual([]);
    expect(e.photoCredit).toBe("");
  });
  it("replaces a non-array photos value", () => {
    expect(normalizeEvent({ id: "e1", photos: "oops" as unknown as [] }).photos).toEqual([]);
  });
  it("keeps existing photos and credit", () => {
    const photos = [{ id: "ph1-0", src: "/images/uploads/events/a-20261009-a1b2.jpg", caption: "Hi" }];
    const e = normalizeEvent({ id: "e1", photos, photoCredit: "Photos by Jo" });
    expect(e.photos).toEqual(photos);
    expect(e.photoCredit).toBe("Photos by Jo");
  });
});

describe("photoCountLabel", () => {
  it("is singular for one photo", () => {
    expect(photoCountLabel(1)).toBe("1 photo");
  });
  it("is plural otherwise", () => {
    expect(photoCountLabel(12)).toBe("12 photos");
  });
});

describe("normalizePartner", () => {
  it("fills a missing poster and summary", () => {
    const p = normalizePartner({ id: "p1", title: "T", host: "H", date: "2026-11-01" });
    expect(p.poster).toBe("");
    expect(p.summary).toBe("");
  });
  it("keeps an existing poster and summary", () => {
    const p = normalizePartner({ id: "p1", poster: "/images/uploads/events/x-20261009-0a1b2c3d.jpg", summary: "Taiko!" });
    expect(p.poster).toBe("/images/uploads/events/x-20261009-0a1b2c3d.jpg");
    expect(p.summary).toBe("Taiko!");
  });
});
