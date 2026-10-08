"use client";
import { useState } from "react";
import styles from "./ListEditor.module.css";

type Item = { id: string; order: number } & Record<string, unknown>;

export type Field = {
  key: string;
  label: string;
  options?: string[]; // renders a <select> instead of a text input
  placeholder?: string;
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
};

export default function ListEditor<T extends Item>({
  title, path, commitMessage, itemLabel, idPrefix, fields, blank, initial,
}: Props<T>) {
  const [items, setItems] = useState<T[]>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  function update(next: T[]) {
    setItems(next);
    setDirty(true);
    setStatus("");
  }
  function setField(id: string, key: string, value: string) {
    update(items.map((it) => (it.id === id ? { ...it, [key]: value } : it)));
  }
  function move(index: number, delta: number) {
    const next = items.slice();
    const [it] = next.splice(index, 1);
    next.splice(index + delta, 0, it);
    update(next);
  }
  function remove(id: string) {
    update(items.filter((it) => it.id !== id));
  }
  function add() {
    update([...items, { ...blank, id: `${idPrefix}${Date.now()}`, order: 0 } as T]);
  }

  async function save() {
    setSaving(true);
    setStatus("Saving…");
    // Order always follows list position, so reorders and removals never collide.
    const ordered = items.map((it, i) => ({ ...it, order: i + 1 }));
    try {
      const res = await fetch("/api/github", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          path,
          content: JSON.stringify(ordered, null, 2) + "\n",
          message: commitMessage,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setItems(ordered);
        setDirty(false);
        setStatus("Saved. The live site will update in about a minute.");
      } else {
        setStatus(`Error: ${data.error}`);
      }
    } catch (e) {
      setStatus(`Error: ${String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <button className={styles.primary} onClick={save} disabled={!dirty || saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
      {status && <p className={styles.status} role="status">{status}</p>}

      <ol className={styles.list}>
        {items.map((it, i) => (
          <li key={it.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <strong>{String(it.name || `New ${itemLabel}`)}</strong>
              <div className={styles.actions}>
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">↓</button>
                <button onClick={() => remove(it.id)} className={styles.danger}>Remove</button>
              </div>
            </div>
            <div className={styles.fields}>
              {fields.map((f) => {
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
    </section>
  );
}
