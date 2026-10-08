"use client";
import { useEffect, useRef, useState } from "react";
import PhotoField, { type PhotoView } from "./PhotoField";
import { blobToBase64 } from "@/lib/image";
import { buildSavePayload, saveErrorMessage, uploadErrorMessage, type PendingPhoto } from "@/lib/editor-save";
import { isUploadPath, toPublicUrl, toRepoPath, type UploadFolder } from "@/lib/uploads";
import styles from "./ListEditor.module.css";

type Item = { id: string; order: number } & Record<string, unknown>;

export type Field = {
  key: string;
  label: string;
  options?: string[]; // renders a <select> instead of a text input
  placeholder?: string;
  kind?: "headshot" | "photo"; // renders a photo picker instead of a text input
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
};

const PLACEHOLDER = "/images/board-placeholder.png";
const SAVED = "Saved. New photos appear once the site finishes updating (about a minute).";

export default function ListEditor<T extends Item>({
  title, path, commitMessage, itemLabel, idPrefix, fields, blank, initial, base, uploadFolder,
}: Props<T>) {
  const [items, setItems] = useState<T[]>(initial);
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
    update((prev) => [...prev, { ...blank, id: `${idPrefix}${Date.now()}`, order: 0 } as T]);
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
        body: JSON.stringify({ folder: uploadFolder, nameHint: String(it.name ?? ""), dataBase64: await blobToBase64(jpeg) }),
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
  function removePhoto(it: T, key: string) {
    bumpGen(it.id);
    const original = String(originals[it.id] ?? it[key] ?? "");
    rememberOriginal(it, key);
    markForDelete(original);
    dropPending(it.id);
    setField(it.id, key, PLACEHOLDER);
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
    setSaving(true);
    setStatus("Saving…");
    try {
      const payload = buildSavePayload({ path, message: commitMessage, items, pending, deletes, base: baseShas });
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
      setItems((prev) => prev.map((it, i) => ({ ...it, order: i + 1 })));
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
        {items.map((it, i) => (
          <li key={it.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <strong>{String(it.name || `New ${itemLabel}`)}</strong>
              <div className={styles.actions}>
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">↓</button>
                <button onClick={() => remove(it)} className={styles.danger}>Remove</button>
              </div>
            </div>
            <div className={styles.fields}>
              {fields.map((f) => {
                if (f.kind) {
                  const p = pending[it.id];
                  const original = originals[it.id];
                  const view: PhotoView = {
                    src: p?.previewUrl ?? String(it[f.key] || PLACEHOLDER),
                    status: p?.status ?? "saved",
                    pendingDelete: !p && original !== undefined && deletes.includes(toRepoPath(original)),
                    canUndo: !p && original !== undefined && String(it[f.key] ?? "") !== original,
                    error: p?.error,
                  };
                  return (
                    <PhotoField
                      key={f.key} kind={f.kind} view={view}
                      onPick={(jpeg, url) => pickPhoto(it, f.key, jpeg, url)}
                      onRemove={() => removePhoto(it, f.key)}
                      onUndoRemove={() => undoRemove(it, f.key)}
                      onRetry={() => p && void upload(it, f.key, p.jpeg, p.previewUrl)}
                    />
                  );
                }
                const value = String(it[f.key] ?? "");
                const id = `${it.id}-${f.key}`;
                return (
                  <label key={f.key} htmlFor={id} className={styles.field}>
                    <span>{f.label}</span>
                    {f.options ? (
                      <select id={id} value={value} onChange={(e) => setField(it.id, f.key, e.target.value)}>
                        {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        id={id} value={value} placeholder={f.placeholder}
                        onChange={(e) => setField(it.id, f.key, e.target.value)}
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
      <button className={styles.secondary} onClick={add}>+ Add {itemLabel}</button>
      </fieldset>
    </section>
  );
}
