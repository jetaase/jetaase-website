import { describe, it, expect } from "vitest";
import { sortReps, repSlots, vacantRepStates } from "./reps";
import type { SubchapterRep } from "./content";

const rep = (name: string, state: SubchapterRep["state"], city = ""): SubchapterRep =>
  ({ id: name, name, state, city, placement: "", email: "", photo: "", order: 9 });

describe("sortReps", () => {
  it("orders by state, then state-wide reps before city reps, then name", () => {
    const sorted = sortReps([
      rep("Gordon Rooney", "South Carolina", "Charleston"),
      rep("Oscar Garcia", "North Carolina", "Charlotte"),
      rep("Sarah Lum", "South Carolina"),
      rep("Kathryn Huff", "North Carolina", "Charlotte"),
      rep("Ingrid Galinat", "Alabama"),
    ]);
    expect(sorted.map((r) => r.name)).toEqual([
      "Ingrid Galinat", "Kathryn Huff", "Oscar Garcia", "Sarah Lum", "Gordon Rooney",
    ]);
  });
  it("treats a blank city as state-wide and doesn't modify the input", () => {
    const input = [rep("B", "Alabama", "Mobile"), rep("A", "Alabama", "  ")];
    expect(sortReps(input).map((r) => r.name)).toEqual(["A", "B"]);
    expect(input.map((r) => r.name)).toEqual(["B", "A"]);
  });
});

describe("repSlots", () => {
  it("puts an open spot where its state belongs", () => {
    const slots = repSlots(sortReps([rep("Sarah Lum", "South Carolina"), rep("Kathryn Huff", "North Carolina")]));
    expect(slots.map((s) => s.rep?.name ?? `open:${s.state}`)).toEqual(["open:Alabama", "Kathryn Huff", "Sarah Lum"]);
  });
  it("has no open spots when every rep state is covered", () => {
    const slots = repSlots([rep("I", "Alabama"), rep("K", "North Carolina"), rep("S", "South Carolina")]);
    expect(slots.every((s) => s.rep)).toBe(true);
  });
});

describe("vacantRepStates", () => {
  it("lists AL, NC, and SC states that have no rep, in that order", () => {
    expect(vacantRepStates([rep("a", "North Carolina")])).toEqual(["Alabama", "South Carolina"]);
    expect(vacantRepStates([])).toEqual(["Alabama", "North Carolina", "South Carolina"]);
  });
  it("never lists Georgia, which the board runs directly", () => {
    expect(vacantRepStates([rep("a", "Alabama"), rep("b", "North Carolina"), rep("c", "South Carolina")])).toEqual([]);
  });
});
