"use client";
import { useEffect, useRef, useState } from "react";
import PhotoField, { type PhotoView } from "./PhotoField";
import { blobToBase64 } from "@/lib/image";
import {
  buildSavePayload, cardHeading, prepareItems, saveErrorMessage, uploadErrorMessage, validate, type PendingPhoto,
} from "@/lib/editor-save";
import { todayInEastern } from "@/lib/events";
import { isUploadPath, toPublicUrl, toRepoPath, type UploadFolder } from "@/lib/uploads";
import styles from "./ListEditor.module.css";

type Item = { id: string; order: number } & Record<string, unknown>;

export type Field = {
  key: string;
  label: string;
  options?: string[]; // renders a <select> instead of a text input
  placeholder?: string;
  kind?: "headshot" | "photo"; // renders a photo picker instead of a text input
  type?: "date" | "url" | "textarea"; // input type for plain fields
  required?: boolean; // checked on save
  hint?: string; // helper text under the input
};

type Props<T extends Item> = {
  title: string;
  path: string;
  commitMessage: string;
  itemLabel: string;
  idPrefix: string;
  fields: Field[];
  blank: Omit<T, "id" | "order">;
  initial: T[];
  base: Record<string, string>; // git blob SHA of `path` as served, for conflict checks
  uploadFolder: UploadFolder;
  byDate?: boolean; // sort by `date` and fold past items into a collapsed group
  slugs?: boolean; // give new items a permanent `slug` on save
  titleKey?: string; // field that titles each card (default: name/title)
};

const HEADSHOT_PLACEHOLDER = "/images/board-placeholder.png";
const SAVED = "Saved. New photos appear once the site finishes updating (about a minute).";

// What a photo field holds when it has no photo.
const emptyPhoto = (f: Field) => (f.kind === "headshot" ? HEADSHOT_PLACEHOLDER : "");
const nameOf = (it: Item) => String(it.name || it.title || "");

// Worked out on load and after each save, never while typing, so a card
// doesn't jump into the closed group mid-edit.
function pastIdsOf(items: Item[]): string[] {
  const today = todayInEastern(new Date());
  return items.filter((it) => String(it.date ?? "") < today).map((it) => it.id);
}

function CardHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <span>
      <strong>{title}</strong>
      {subtitle && <span className={styles.subtitle}> · {subtitle}</span>}
    </span>
  );
}

export default function ListEditor<T extends Item>({
  title, path, commitMessage, itemLabel, idPrefix, fields, blank, initial, base, uploadFolder, byDate, slugs, titleKey,
}: Props<T>) {
  const [items, setItems] = useState<T[]>(() => (byDate ? prepareItems(initial, { byDate }) : initial));
  const [pastIds, setPastIds] = useState<string[]>(() => (byDate ? pastIdsOf(initial) : []));
  const [showPast, setShowPast] = useState(false);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  // Photos picked this session, keyed by item id.
  const [pending, setPending] = useState<Record<string, PendingPhoto>>({});
  // Published upload files to delete on the next save.
  const [deletes, setDeletes] = useState<string[]>([]);
  // Each item's photo as published, recorded the first time it changes.
  const [originals, setOriginals] = useState<Record<string, string>>({});
  const [baseShas, setBaseShas] = useState(base);
  const busy = Object.values(pending).some((p) => p.status !== "uploaded");
  // Per-item upload generation: removing or undoing bumps it, so a late
  // upload result for a photo that's no longer wanted is ignored.
  const uploadGen = useRef<Record<string, number>>({});
  const bumpGen = (id: string) => (uploadGen.current[id] = (uploadGen.current[id] ?? 0) + 1);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Functional updates: uploads finish asynchronously, after other edits.
  function update(fn: (prev: T[]) => T[]) {
    setItems(fn);
    setDirty(true);
    setStatus("");
  }
  function setField(id: string, key: string, value: string) {
    update((prev) => prev.map((it) => (it.id === id ? { ...it, [key]: value } : it)));
  }
  function move(index: number, delta: number) {
    update((prev) => {
      const next = prev.slice();
      const [it] = next.splice(index, 1);
      next.splice(index + delta, 0, it);
      return next;
    });
  }
  function remove(it: T) {
    bumpGen(it.id);
    for (const f of fields) if (f.kind) markForDelete(String(originals[it.id] ?? it[f.key] ?? ""));
    dropPending(it.id);
    update((prev) => prev.filter((x) => x.id !== it.id));
  }
  function add() {
    const fresh = { ...blank, id: `${idPrefix}${Date.now()}`, order: 0 } as T;
    if (byDate) Object.assign(fresh, { date: todayInEastern(new Date()) });
    update((prev) => [...prev, fresh]);
  }

  // ── Photos ──

  function rememberOriginal(it: T, key: string) {
    setOriginals((o) => (it.id in o ? o : { ...o, [it.id]: String(it[key] ?? "") }));
  }
  // Only published uploads are deleted; this session's unsaved uploads simply drop.
  function markForDelete(publicUrl: string) {
    const repoPath = toRepoPath(publicUrl);
    if (isUploadPath(repoPath)) setDeletes((d) => (d.includes(repoPath) ? d : [...d, repoPath]));
  }
  function dropPending(id: string) {
    setPending((p) => {
      const rest = { ...p };
      delete rest[id];
      return rest;
    });
  }
  async function upload(it: T, key: string, jpeg: Blob, previewUrl: string) {
    const gen = bumpGen(it.id);
    const current = () => uploadGen.current[it.id] === gen;
    setPending((p) => ({ ...p, [it.id]: { status: "uploading", previewUrl, jpeg } }));
    setDirty(true);
    const fail = (error: string) => {
      if (current()) setPending((p) => ({ ...p, [it.id]: { status: "failed", previewUrl, jpeg, error } }));
    };
    let res: Response;
    try {
      res = await fetch("/api/upload", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ folder: uploadFolder, nameHint: nameOf(it), dataBase64: await blobToBase64(jpeg) }),
      });
    } catch {
      return fail(uploadErrorMessage(null));
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return fail(uploadErrorMessage(res.status, data.error));
    if (!current()) return;
    setPending((p) => ({ ...p, [it.id]: { status: "uploaded", previewUrl, jpeg, upload: data } }));
    setField(it.id, key, toPublicUrl(data.path));
  }
  function pickPhoto(it: T, key: string, jpeg: Blob, previewUrl: string) {
    const original = String(originals[it.id] ?? it[key] ?? "");
    rememberOriginal(it, key);
    markForDelete(original);
    void upload(it, key, jpeg, previewUrl);
  }
  function removePhoto(it: T, f: Field) {
    bumpGen(it.id);
    const original = String(originals[it.id] ?? it[f.key] ?? "");
    rememberOriginal(it, f.key);
    markForDelete(original);
    dropPending(it.id);
    setField(it.id, f.key, emptyPhoto(f));
  }
  function undoRemove(it: T, key: string) {
    const original = originals[it.id];
    if (original === undefined) return;
    bumpGen(it.id);
    setDeletes((d) => d.filter((x) => x !== toRepoPath(original)));
    dropPending(it.id);
    setField(it.id, key, original);
  }

  async function save() {
    const problem = validate(fields, items, itemLabel);
    if (problem) {
      setErrorId(problem.id);
      if (pastIds.includes(problem.id)) setShowPast(true);
      setStatus(`Error: ${problem.message}`);
      requestAnimationFrame(() =>
        document.getElementById(`card-${problem.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
      return;
    }
    setErrorId(null);
    setSaving(true);
    setStatus("Saving…");
    try {
      const ready = prepareItems(items, { byDate, slugs });
      const payload = buildSavePayload({ path, message: commitMessage, items: ready, pending, deletes, base: baseShas });
      let res: Response;
      try {
        res = await fetch("/api/github", {
          method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
        });
      } catch {
        setStatus(`Error: ${saveErrorMessage(null)}`);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(`Error: ${saveErrorMessage(res.status, data.error)}`);
        return;
      }
      setBaseShas((b) => ({ ...b, ...data.blobShas }));
      // Order always follows list position, so reorders and removals never collide.
      // The fieldset is disabled while saving, so `ready` has every edit.
      setItems(ready.map((it, i) => ({ ...it, order: i + 1 })));
      if (byDate) setPastIds(pastIdsOf(ready));
      setPending({});
      setDeletes([]);
      setOriginals({});
      setDirty(false);
      setStatus(SAVED);
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  function renderInput(it: T, f: Field) {
    const value = String(it[f.key] ?? "");
    const id = `${it.id}-${f.key}`;
    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setField(it.id, f.key, e.target.value);
    let input: React.ReactNode;
    if (f.options) {
      input = (
        <select id={id} value={value} onChange={onChange}>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    } else if (f.type === "textarea") {
      input = <textarea id={id} value={value} placeholder={f.placeholder} rows={6} onChange={onChange} />;
    } else {
      input = (
        <input
          id={id} value={value} placeholder={f.placeholder} onChange={onChange}
          type={f.type ?? "text"} inputMode={f.type === "url" ? "url" : undefined}
        />
      );
    }
    return (
      <label key={f.key} htmlFor={id} className={`${styles.field} ${f.type === "textarea" ? styles.wide : ""}`}>
        <span>{f.label}{f.required && <span className={styles.required} aria-hidden="true"> *</span>}</span>
        {input}
        {f.hint && <small className={styles.hint}>{f.hint}</small>}
      </label>
    );
  }

  function renderCard(it: T, i: number) {
    return (
      <li key={it.id} id={`card-${it.id}`} className={`${styles.card} ${errorId === it.id ? styles.cardError : ""}`}>
        <div className={styles.cardHeader}>
          <CardHeading {...cardHeading(it, itemLabel, titleKey)} />
          <div className={styles.actions}>
            {!byDate && (
              <>
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">↓</button>
              </>
            )}
            <button onClick={() => remove(it)} className={styles.danger}>Remove</button>
          </div>
        </div>
        <div className={styles.fields}>
          {fields.map((f) => {
            if (!f.kind) return renderInput(it, f);
            const p = pending[it.id];
            const original = originals[it.id];
            const view: PhotoView = {
              src: p?.previewUrl ?? String(it[f.key] || emptyPhoto(f)),
              status: p?.status ?? "saved",
              pendingDelete: !p && original !== undefined && deletes.includes(toRepoPath(original)),
              canUndo: !p && original !== undefined && String(it[f.key] ?? "") !== original,
              error: p?.error,
            };
            return (
              <PhotoField
                key={f.key} kind={f.kind} view={view}
                onPick={(jpeg, url) => pickPhoto(it, f.key, jpeg, url)}
                onRemove={() => removePhoto(it, f)}
                onUndoRemove={() => undoRemove(it, f.key)}
                onRetry={() => p && void upload(it, f.key, p.jpeg, p.previewUrl)}
              />
            );
          })}
        </div>
      </li>
    );
  }

  const current = items.filter((it) => !pastIds.includes(it.id));
  const past = items.filter((it) => pastIds.includes(it.id)).reverse(); // newest first

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <button className={styles.primary} onClick={save} disabled={!dirty || saving || busy}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
      {status && <p className={styles.status} role="status">{status}</p>}

      {/* Disabled while saving, so nothing changes under an in-flight save. */}
      <fieldset disabled={saving} className={styles.fieldset}>
      <ol className={styles.list}>
        {current.map((it) => renderCard(it, items.indexOf(it)))}
      </ol>
      <button className={styles.secondary} onClick={add}>+ Add {itemLabel}</button>
      {past.length > 0 && (
        <div className={styles.pastGroup}>
          <button
            className={styles.pastToggle} onClick={() => setShowPast((s) => !s)} aria-expanded={showPast}
          >
            {showPast ? "▾" : "▸"} Past {itemLabel}s ({past.length})
          </button>
          {showPast && <ol className={styles.list}>{past.map((it) => renderCard(it, items.indexOf(it)))}</ol>}
        </div>
      )}
      </fieldset>
    </section>
  );
}
