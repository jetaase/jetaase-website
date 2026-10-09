"use client";
import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "@/components/icons";
import styles from "./page.module.css";

export type DirEntry = { name: string; href: string };
export type DirCategory = {
  id: string;
  chip: string;
  title: string;
  columns: 2 | 3;
  groups: { label?: string; entries: DirEntry[] }[];
};

const pad = (n: number) => String(n).padStart(2, "0");

export default function Directory({ categories }: { categories: DirCategory[] }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("all");
  const toolbarRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // When filtering shrinks the list while the reader is scrolled into it, the
  // page gets shorter underneath them. Pull the top of the results back up to
  // just below the sticky toolbar so they always see what matched.
  useEffect(() => {
    const toolbar = toolbarRef.current, body = bodyRef.current;
    if (!toolbar || !body) return;
    const style = getComputedStyle(toolbar);
    if (style.position !== "sticky") return;
    // Where the toolbar's bottom edge sits while stuck. Measured from its CSS
    // rather than its current position, which shifts up when few results
    // leave the section too short to hold it.
    const toolbarBottom =
      parseFloat(style.top) + toolbar.offsetHeight;
    const bodyTop = body.getBoundingClientRect().top;
    if (bodyTop < toolbarBottom) {
      window.scrollBy({ top: bodyTop - toolbarBottom });
    }
  }, [query, active]);

  const q = query.trim().toLowerCase();
  const matches = (e: DirEntry) => !q || e.name.toLowerCase().includes(q);
  const total = categories.reduce(
    (n, c) => n + c.groups.reduce((m, g) => m + g.entries.length, 0), 0,
  );

  // Apply the category chip, then the search, dropping empty groups/categories.
  const visible = categories
    .filter((c) => active === "all" || c.id === active)
    .map((c) => ({
      ...c,
      groups: c.groups
        .map((g) => ({ ...g, entries: g.entries.filter(matches) }))
        .filter((g) => g.entries.length > 0),
    }))
    .filter((c) => c.groups.length > 0);

  return (
    <>
      <div ref={toolbarRef} className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          <div className={styles.toolbarRow}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>
                <SearchIcon size={18} />
              </span>
              <input
                id="dir-search"
                type="search"
                aria-label="Search resources"
                placeholder={`Search ${total} resources, e.g. bonsai, restaurants, jobs`}
                className={styles.searchInput}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.chipsRow}>
            {[{ id: "all", chip: "All" }, ...categories].map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={active === c.id}
                className={`${styles.chip} ${active === c.id ? styles.chipActive : ""}`}
                onClick={() => setActive(c.id)}
              >
                {c.chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={bodyRef} className={styles.directoryBody}>
        {visible.length === 0 && (
          <p className={styles.noResults}>
            No resources match &ldquo;{query.trim()}&rdquo;
            {active !== "all" && " in this category"}.{" "}
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => {
                setQuery("");
                setActive("all");
              }}
            >
              Clear filters
            </button>
          </p>
        )}
        {visible.map((c) => (
          <div key={c.id} className={styles.dirCat}>
            <div className={styles.dirCatHeader}>
              <h3 className={styles.dirCatTitle}>{c.title}</h3>
              <span className={styles.dirCatCount}>
                {pad(c.groups.reduce((n, g) => n + g.entries.length, 0))}
              </span>
            </div>
            {c.groups.map((g, i) => {
              const items = (
                <div className={c.columns === 3 ? styles.dirColumns3 : styles.dirColumns2}>
                  {g.entries.map((e) => (
                    <a
                      key={e.name}
                      className={styles.dirItem}
                      href={e.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className={styles.dirMark} />
                      {e.name}
                    </a>
                  ))}
                </div>
              );
              if (!g.label) return <div key={i}>{items}</div>;
              return (
                <div key={g.label} className={styles.dirGroup}>
                  <div
                    className={`${styles.dirGroupLabel} ${i === 0 ? styles.dirGroupLabelFirst : ""}`}
                  >
                    {g.label}
                  </div>
                  {items}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
