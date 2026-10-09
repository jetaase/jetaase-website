import { describe, it, expect } from "vitest";
import {
  normalizeElection, isElectionLive, electionBanner, validateElection, timelineSteps, type Election,
} from "./elections";

const base: Election = {
  enabled: true, showUntil: "2027-03-02", title: "2026–2027 board elections", intro: "",
  positions: [{ id: "a", title: "Secretary", description: "Keeps records." }],
  howToRun: "", deadline: "2027-02-23", timeline: "",
};

describe("normalizeElection", () => {
  it("turns nothing into a switched-off, empty notice", () => {
    expect(normalizeElection(undefined)).toEqual({
      enabled: false, showUntil: "", title: "", intro: "", positions: [], howToRun: "", deadline: "", timeline: "",
    });
  });
  it("only treats enabled: true as on", () => {
    expect(normalizeElection({ enabled: "yes" }).enabled).toBe(false);
    expect(normalizeElection({ enabled: true }).enabled).toBe(true);
  });
  it("replaces a non-array positions value", () => {
    expect(normalizeElection({ positions: "President" }).positions).toEqual([]);
  });
  it("drops positions without a role and fills missing ids", () => {
    const e = normalizeElection({ positions: [{ title: "President" }, { title: "  " }, "x", { id: "k", title: "VP", description: 3 }] });
    expect(e.positions).toEqual([
      { id: "pos-0", title: "President", description: "" },
      { id: "k", title: "VP", description: "" },
    ]);
  });
});

describe("isElectionLive", () => {
  it("is hidden while switched off", () => {
    expect(isElectionLive({ ...base, enabled: false }, "2027-02-01")).toBe(false);
  });
  it("shows through the Show until day, inclusive", () => {
    expect(isElectionLive(base, "2027-03-02")).toBe(true);
  });
  it("hides itself the day after", () => {
    expect(isElectionLive(base, "2027-03-03")).toBe(false);
  });
  it("shows until switched off when Show until is empty", () => {
    expect(isElectionLive({ ...base, showUntil: "" }, "2099-01-01")).toBe(true);
  });
});

describe("electionBanner", () => {
  it("says nominations are open through the deadline day", () => {
    expect(electionBanner(base, "2027-02-10")).toBe("Board elections: nominations are open until Feb 23.");
    expect(electionBanner(base, "2027-02-23")).toBe("Board elections: nominations are open until Feb 23.");
  });
  it("says underway after the deadline or with no deadline", () => {
    expect(electionBanner(base, "2027-02-24")).toBe("Board elections are underway.");
    expect(electionBanner({ ...base, deadline: "" }, "2027-02-10")).toBe("Board elections are underway.");
  });
});

describe("validateElection", () => {
  it("accepts a complete notice", () => {
    expect(validateElection(base)).toBeNull();
  });
  it("needs a headline to switch the notice on", () => {
    expect(validateElection({ ...base, title: " " })).toBe("Add a headline before switching the notice on.");
    expect(validateElection({ ...base, enabled: false, title: "" })).toBeNull();
  });
  it("needs a role for every position", () => {
    expect(validateElection({ ...base, positions: [...base.positions, { id: "b", title: "", description: "x" }] }))
      .toBe("Position 2: add the role.");
  });
  it("checks the dates when filled in", () => {
    expect(validateElection({ ...base, showUntil: "2027-02-30" })).toBe("Pick a valid “Show until” date.");
    expect(validateElection({ ...base, deadline: "soon" })).toBe("Pick a valid nomination deadline.");
    expect(validateElection({ ...base, showUntil: "", deadline: "" })).toBeNull();
  });
});

describe("timelineSteps", () => {
  it("splits on lines and drops blank ones", () => {
    expect(timelineSteps("Feb 16–23: Nominations\n\n  Feb 25–27: Voting  \n")).toEqual([
      "Feb 16–23: Nominations", "Feb 25–27: Voting",
    ]);
  });
});
