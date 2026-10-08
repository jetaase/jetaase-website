import { describe, it, expect } from "vitest";
import {
  buildSavePayload, uploadErrorMessage, saveErrorMessage, validate, prepareItems, cardHeading, type PendingPhoto,
} from "./editor-save";

const blob = new Blob(["x"]);
const up = (path: string, sha: string): PendingPhoto =>
  ({ status: "uploaded", previewUrl: "blob:1", jpeg: blob, upload: { path, sha } });

describe("buildSavePayload", () => {
  const base = { "content/board.json": "B0" };

  it("serializes items with renumbered order and includes uploads", () => {
    const items = [
      { id: "m2", name: "B", photo: "/images/uploads/board/b-20261008-a1b2.jpg", order: 9 },
      { id: "m1", name: "A", photo: "/images/board-placeholder.png", order: 1 },
    ];
    const p = buildSavePayload({
      path: "content/board.json", message: "msg", items, base, deletes: [],
      pending: { m2: up("public/images/uploads/board/b-20261008-a1b2.jpg", "S1") },
    });
    expect(JSON.parse(p.files[0].content).map((i: { order: number }) => i.order)).toEqual([1, 2]);
    expect(p.files[0].content.endsWith("\n")).toBe(true);
    expect(p.uploads).toEqual([{ path: "public/images/uploads/board/b-20261008-a1b2.jpg", sha: "S1" }]);
    expect(p.base).toEqual(base);
    expect(p.message).toBe("msg");
  });

  it("drops an upload that was replaced or removed before saving", () => {
    const items = [{ id: "m1", photo: "/images/board-placeholder.png", order: 1 }];
    const p = buildSavePayload({
      path: "content/board.json", message: "m", items, base, deletes: [],
      pending: { m1: up("public/images/uploads/board/a-20261008-a1b2.jpg", "S1") },
    });
    expect(p.uploads).toEqual([]);
  });

  it("passes through deletes, which the server re-checks", () => {
    const p = buildSavePayload({
      path: "content/board.json", message: "m", items: [], base, pending: {},
      deletes: ["public/images/uploads/board/old-20261001-ffff.jpg"],
    });
    expect(p.deletes).toEqual(["public/images/uploads/board/old-20261001-ffff.jpg"]);
  });

  it("refuses to build while an upload is running or failed", () => {
    for (const status of ["uploading", "failed"] as const) {
      expect(() => buildSavePayload({
        path: "content/board.json", message: "m", items: [], base, deletes: [],
        pending: { m1: { status, previewUrl: "blob:1", jpeg: blob } },
      })).toThrow("uploads in progress");
    }
  });
});

describe("uploadErrorMessage", () => {
  it("uses the standard copy for network failures", () => {
    expect(uploadErrorMessage(null)).toBe("Upload failed — try again");
  });
  it("explains an expired login", () => {
    expect(uploadErrorMessage(401, "unauthorized")).toBe("Your login expired. Sign in again in a new tab, then retry.");
  });
  it("shows the server's message for other errors", () => {
    expect(uploadErrorMessage(400, "photo too large")).toBe("photo too large");
  });
  it("falls back to the standard copy when the server gives none", () => {
    expect(uploadErrorMessage(500)).toBe("Upload failed — try again");
  });
});

describe("saveErrorMessage", () => {
  it("explains an expired login", () => {
    expect(saveErrorMessage(401, "unauthorized")).toBe("Your login expired. Sign in again in a new tab, then click Save again.");
  });
  it("shows the server's message for other errors", () => {
    expect(saveErrorMessage(409, "Someone else saved changes")).toBe("Someone else saved changes");
  });
  it("falls back to generic copy when the response had no message", () => {
    expect(saveErrorMessage(504)).toBe("Save failed — try again");
    expect(saveErrorMessage(null)).toBe("Save failed — try again");
  });
});

describe("validate", () => {
  const fields = [
    { key: "title", label: "Event name", required: true },
    { key: "date", label: "Date", type: "date" as const, required: true },
    { key: "rsvpUrl", label: "RSVP link (optional)", type: "url" as const },
    { key: "link", label: "Event link (optional)", type: "url" as const },
  ];
  const good = { id: "e1", title: "Fall Welcome", date: "2026-10-03", rsvpUrl: "https://forms.gle/x", link: "" };

  it("passes complete items", () => {
    expect(validate(fields, [good], "event")).toBeNull();
  });
  it("names the event by title when a required field is empty", () => {
    expect(validate(fields, [good, { ...good, id: "e2", date: "" }], "event"))
      .toEqual({ id: "e2", message: '"Fall Welcome": add the date.' });
  });
  it("names the event by position when it has no title", () => {
    expect(validate(fields, [good, { ...good, id: "e2", title: " " }], "event"))
      .toEqual({ id: "e2", message: "Event 2: add the event name." });
  });
  it("uses the item label for position names", () => {
    expect(validate(fields, [{ ...good, title: "" }], "partner event")?.message)
      .toBe("Partner event 1: add the event name.");
  });
  it("rejects a link that doesn't start with http, keeping acronyms", () => {
    expect(validate(fields, [{ ...good, rsvpUrl: "forms.gle/x" }], "event")?.message)
      .toBe('"Fall Welcome": the RSVP link should start with https://');
    expect(validate(fields, [{ ...good, link: "www.jetaa.org" }], "event")?.message)
      .toBe('"Fall Welcome": the event link should start with https://');
  });
  it("accepts http and https links and empty optional links", () => {
    expect(validate(fields, [{ ...good, rsvpUrl: "http://x.org", link: "" }], "event")).toBeNull();
  });
  it("rejects an impossible date", () => {
    expect(validate(fields, [{ ...good, date: "2026-02-30" }], "event")?.message)
      .toBe('"Fall Welcome": pick a valid date.');
  });
  it("uses the name field when there is no title (people editors)", () => {
    const people = [{ key: "name", label: "Name", required: true }, { key: "email", label: "Email", required: true }];
    expect(validate(people, [{ id: "m1", name: "Ann", email: "" }], "officer")?.message)
      .toBe('"Ann": add the email.');
  });
});

describe("prepareItems", () => {
  const items = [
    { id: "a", title: "Late", date: "2026-12-01", slug: "late-2026-12" },
    { id: "b", title: "Early", date: "2026-01-05" },
    { id: "c", title: "Middle", date: "2026-06-01", slug: "" },
  ];
  it("returns items unchanged without options", () => {
    expect(prepareItems(items, {})).toEqual(items);
  });
  it("sorts by date, soonest first, when byDate is set", () => {
    expect(prepareItems(items, { byDate: true }).map((i) => i.id)).toEqual(["b", "c", "a"]);
  });
  it("fills missing slugs only when slugs is set", () => {
    const out = prepareItems(items, { byDate: true, slugs: true });
    expect(out.map((i) => i.slug)).toEqual(["early-2026-01", "middle-2026-06", "late-2026-12"]);
    expect(prepareItems(items, { byDate: true })[0]).not.toHaveProperty("slug");
  });
});

describe("cardHeading", () => {
  it("titles a card by name by default", () => {
    expect(cardHeading({ name: "Ann" }, "representative")).toEqual({ title: "Ann" });
    expect(cardHeading({ title: "Fall Welcome" }, "event")).toEqual({ title: "Fall Welcome" });
    expect(cardHeading({ name: "" }, "representative")).toEqual({ title: "New representative" });
  });
  it("titles a card by the given field, with the person under it", () => {
    expect(cardHeading({ role: "President", name: "Lindsay Jenkins" }, "role", "role"))
      .toEqual({ title: "President", subtitle: "Lindsay Jenkins" });
  });
  it("marks an empty role as new and an empty name as vacant", () => {
    expect(cardHeading({ role: "", name: "" }, "role", "role")).toEqual({ title: "New role", subtitle: "(vacant)" });
  });
});
