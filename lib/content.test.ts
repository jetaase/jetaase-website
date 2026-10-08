import { describe, it, expect } from "vitest";
import { readBoard, readReps } from "./content";

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
  it("returns reps sorted by order", () => {
    const reps = readReps();
    expect(reps.length).toBeGreaterThanOrEqual(1);
    const orders = reps.map((r) => r.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
  it("every rep has required fields", () => {
    for (const r of readReps()) {
      expect(r.id && r.name && r.state && r.email).toBeTruthy();
    }
  });
});
