// Subchapter rep ordering and open spots, shared by the public pages and the
// admin. Keep this file free of Node-only imports; it ships to the browser.
import type { State, SubchapterRep } from "./content";

// States that should have a subchapter rep. Georgia is run by the board directly.
export const REP_STATES: State[] = ["Alabama", "North Carolina", "South Carolina"];

// Same order as the Subchapters page.
const STATE_ORDER: State[] = ["Georgia", ...REP_STATES];

// By state, then state-wide reps before city reps, then name. Loosely typed
// so the admin can sort its in-progress items too.
export function sortReps<T extends Record<string, unknown>>(reps: T[]): T[] {
  const stateRank = (r: T) => STATE_ORDER.indexOf(r.state as State);
  const cityRank = (r: T) => (String(r.city ?? "").trim() ? 1 : 0);
  return reps.slice().sort((a, b) =>
    stateRank(a) - stateRank(b)
    || cityRank(a) - cityRank(b)
    || String(a.name ?? "").localeCompare(String(b.name ?? "")));
}

// Rep states with nobody in the role right now, shown as "position open".
export function vacantRepStates(reps: Pick<SubchapterRep, "state">[]): State[] {
  return REP_STATES.filter((s) => !reps.some((r) => r.state === s));
}

// Sorted reps with an open spot in place for each vacant state.
export function repSlots(reps: SubchapterRep[]): { state: State; rep?: SubchapterRep }[] {
  const slots = [
    ...reps.map((rep) => ({ state: rep.state, rep })),
    ...vacantRepStates(reps).map((state) => ({ state })),
  ];
  return slots.sort((a, b) => STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state));
}
