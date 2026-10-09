"use client";
import { useEffect, useState } from "react";
import { saveBarMessage, saveErrorMessage, type SaveBody } from "@/lib/editor-save";
import { movePhoto as moveItem } from "@/lib/gallery"; // generic list move
import { validateElection, type Election, type ElectionPosition } from "@/lib/elections";
import { todayInEastern } from "@/lib/events";
import AdminButton from "./AdminButton";
import list from "./ListEditor.module.css";
import styles from "./ElectionEditor.module.css";

const SAVED = "Saved. The site updates in about a minute.";
const MESSAGE = "chore(admin): update elections notice";

// One form for the single elections notice (content/elections.json).
export default function ElectionEditor({
  initial, path, base,
}: { initial: Election; path: string; base: Record<string, string> }) {
  const [e, setE] = useState(initial);
  const [baseShas, setBaseShas] = useState(base);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!dirty) return;
    const warn = (ev: BeforeUnloadEvent) => { ev.preventDefault(); ev.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update(fn: (prev: Election) => Election) {
    setE(fn);
    setDirty(true);
    setStatus("");
  }
  const set = <K extends keyof Election>(key: K, value: Election[K]) => update((p) => ({ ...p, [key]: value }));
  const setPositions = (fn: (ps: ElectionPosition[]) => ElectionPosition[]) =>
    update((p) => ({ ...p, positions: fn(p.positions) }));
  const setPosition = <K extends "title" | "description" | "open">(id: string, key: K, value: ElectionPosition[K]) =>
    setPositions((ps) => ps.map((x) => (x.id === id ? { ...x, [key]: value } : x)));
  // Position cards start collapsed to their header; these ids are open.
  const [openIds, setOpenIds] = useState<string[]>([]);
  const openCard = (id: string) => setOpenIds((o) => (o.includes(id) ? o : [...o, id]));
  const toggleCard = (id: string) => setOpenIds((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  function addPosition() {
    const id = `pos${Date.now()}`;
    setPositions((ps) => [...ps, { id, title: "", description: "", open: true }]);
    openCard(id);
  }

  async function save() {
    const problem = validateElection(e, todayInEastern(new Date()));
    if (problem) {
      // A position missing its role may be collapsed; open it so the problem is visible.
      const missing = e.positions.find((p) => !p.title.trim());
      if (missing) openCard(missing.id);
      return setStatus(`Error: ${problem}`);
    }
    setSaving(true);
    setStatus("Saving…");
    try {
      const body: SaveBody = {
        files: [{ path, content: JSON.stringify(e, null, 2) + "\n" }],
        uploads: [], deletes: [], base: baseShas, message: MESSAGE,
      };
      let res: Response;
      try {
        res = await fetch("/api/github", {
          method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
        });
      } catch {
        return setStatus(`Error: ${saveErrorMessage(null)}`);
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setStatus(`Error: ${saveErrorMessage(res.status, data.error)}`);
      setBaseShas((b) => ({ ...b, ...data.blobShas }));
      setDirty(false);
      setStatus(SAVED);
    } finally {
      setSaving(false);
    }
  }

  const text = (key: "title" | "showUntil" | "deadline", label: string, opts: { type?: string; hint?: string; placeholder?: string } = {}) => (
    <label className={list.field}>
      <span>{label}</span>
      <input type={opts.type ?? "text"} value={e[key]} placeholder={opts.placeholder} onChange={(ev) => set(key, ev.target.value)} />
      {opts.hint && <small className={list.hint}>{opts.hint}</small>}
    </label>
  );
  const area = (key: "intro" | "howToRun" | "timeline", label: string, hint: string, rows = 4) => (
    <label className={`${list.field} ${list.wide}`}>
      <span>{label}</span>
      <textarea value={e[key]} rows={rows} onChange={(ev) => set(key, ev.target.value)} />
      <small className={list.hint}>{hint}</small>
    </label>
  );
  const barMessage = saveBarMessage({ dirty, saving, busy: false, status });

  return (
    <section className={list.section}>
      <div className={list.header}>
        <h2 className={list.title}>Elections notice</h2>
      </div>
      <fieldset disabled={saving} className={list.fieldset}>
        <div className={`${list.card} ${styles.card}`}>
          <label className={styles.toggle}>
            <input type="checkbox" checked={e.enabled} onChange={(ev) => set("enabled", ev.target.checked)} />
            <span>
              <strong>Show the elections notice</strong>
              <small className={list.hint}>Shows on Who We Are and as a homepage banner.</small>
            </span>
          </label>
          <div className={list.fields}>
            {text("showUntil", "Show until", { type: "date", hint: "Hides itself after this day. Leave empty to show until you switch it off." })}
            {text("deadline", "Nomination deadline", { type: "date", hint: "The banner says nominations are open until this day." })}
            {text("title", "Headline", { placeholder: "e.g. 2026–2027 board elections" })}
            {area("intro", "Intro", "Who can run and what the role involves. Leave a blank line between paragraphs.")}
          </div>

          <h3 className={styles.subhead}>Positions</h3>
          <p className={list.hint}>
            Keep every role here from year to year. Tick “Open this round” for the ones up for election; only those show on the notice.
          </p>
          {e.positions.length === 0 && <p className={list.hint}>No positions yet.</p>}
          <ol className={list.list}>
            {e.positions.map((p, i) => {
              const open = openIds.includes(p.id);
              return (
                <li key={p.id} className={list.card}>
                  <div className={`${list.cardHeader} ${styles.posHeader} ${open ? list.cardHeaderOpen : ""}`}>
                    <button
                      type="button" className={list.toggle} onClick={() => toggleCard(p.id)}
                      aria-expanded={open} aria-controls={`fields-${p.id}`}
                    >
                      <span className={list.chevron} aria-hidden="true">{open ? "▾" : "▸"}</span>
                      <span>
                        <strong>{p.title || "New position"}</strong>
                        {!p.open && <span className={list.subtitle}> · not this round</span>}
                      </span>
                    </button>
                    <div className={list.actions}>
                      <label className={styles.roundToggle}>
                        <input type="checkbox" checked={p.open} onChange={(ev) => setPosition(p.id, "open", ev.target.checked)} />
                        Open this round
                      </label>
                      <AdminButton type="button" onClick={() => setPositions((ps) => moveItem(ps, i, -1))} disabled={i === 0} aria-label="Move up">↑</AdminButton>
                      <AdminButton type="button" onClick={() => setPositions((ps) => moveItem(ps, i, 1))} disabled={i === e.positions.length - 1} aria-label="Move down">↓</AdminButton>
                      <AdminButton type="button" variant="danger" onClick={() => setPositions((ps) => ps.filter((x) => x.id !== p.id))}>Remove</AdminButton>
                    </div>
                  </div>
                  <div id={`fields-${p.id}`} className={list.fields} hidden={!open}>
                    <label className={list.field}>
                      <span>Role</span>
                      <input value={p.title} placeholder="e.g. Secretary" onChange={(ev) => setPosition(p.id, "title", ev.target.value)} />
                    </label>
                    <label className={`${list.field} ${list.wide}`}>
                      <span>Description</span>
                      <textarea
                        value={p.description} rows={3} placeholder="A sentence or two about what the role involves"
                        onChange={(ev) => setPosition(p.id, "description", ev.target.value)}
                      />
                    </label>
                  </div>
                </li>
              );
            })}
          </ol>
          <AdminButton type="button" onClick={addPosition}>
            + Add position
          </AdminButton>

          <div className={`${list.fields} ${styles.after}`}>
            {area("howToRun", "How to run", "How to nominate yourself, and by when. Leave a blank line between paragraphs.")}
            {area("timeline", "Timeline", "One step per line, e.g. Feb 25–27: Voting", 3)}
          </div>
        </div>
      </fieldset>
      {barMessage && (
        <div className={`${list.saveBar} ${status.startsWith("Error") ? list.saveBarError : ""}`}>
          <span className={list.saveBarText} role="status"><strong>Elections notice</strong> · {barMessage}</span>
          <AdminButton variant="primary" size="md" onClick={save} disabled={!dirty || saving}>
            {saving ? "Saving…" : "Save changes"}
          </AdminButton>
        </div>
      )}
    </section>
  );
}
