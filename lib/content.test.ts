import { describe, it, expect } from "vitest";
import {
  readBoard, readReps, readEvents, readPartnerEvents, EDITABLE_PATHS,
} from "./content";
import { isValidDate } from "./events";
import { sortReps } from "./reps";

describe("readBoard", () => {
  it("returns board members sorted by order", () => {
    const board = readBoard();
    expect(board.length).toBeGreaterThanOrEqual(3);
    const orders = board.map((m) => m.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
  it("every member has required fields", () => {
    for (const m of readBoard()) {
      expect(m.id && m.name && m.role && m.chapter).toBeTruthy();
    }
  });
});

describe("readReps", () => {
  it("returns reps sorted by state", () => {
    const reps = readReps();
    expect(reps.length).toBeGreaterThanOrEqual(1);
    expect(reps).toEqual(sortReps(reps));
  });
  it("every rep has required fields", () => {
    for (const r of readReps()) {
      expect(r.id && r.name && r.state && r.email).toBeTruthy();
    }
  });
});

describe("readEvents", () => {
  it("returns events with valid dates and unique slugs", () => {
    const events = readEvents();
    expect(events.length).toBeGreaterThanOrEqual(1);
    for (const e of events) {
      expect(e.id && e.title && e.slug).toBeTruthy();
      expect(isValidDate(e.date)).toBe(true);
      expect(typeof e.poster).toBe("string");
      expect(typeof e.rsvpUrl).toBe("string");
      expect(Array.isArray(e.photos)).toBe(true);
      expect(typeof e.photoCredit).toBe("string");
    }
    const slugs = events.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("readPartnerEvents", () => {
  it("returns partner events with a host and a valid date", () => {
    for (const p of readPartnerEvents()) {
      expect(p.id && p.title && p.host).toBeTruthy();
      expect(typeof p.poster).toBe("string");
      expect(typeof p.summary).toBe("string");
      expect(isValidDate(p.date)).toBe(true);
    }
  });
});

describe("EDITABLE_PATHS", () => {
  it("lets the admin save both event files", () => {
    expect(EDITABLE_PATHS).toEqual(expect.arrayContaining(["content/events.json", "content/partner-events.json"]));
  });
});
