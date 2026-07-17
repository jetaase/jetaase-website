# JETAASE Southeast POC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the end-to-end content loop — password-protected admin edit → serverless GitHub commit → Vercel auto-redeploy → change visible on the public site — on a faithful React rebuild of the 6-page JETAASE design.

**Architecture:** Next.js App Router site deployed on Vercel from the same repo it commits to. Six public pages are ported from Claude Design HTML bundles into React components styled with CSS Modules + design tokens. `/who-we-are` renders its board section from `content/board.json`. A password gate issues a signed httpOnly cookie; a serverless API route (the only holder of the GitHub token) commits JSON back to the repo via the GitHub Contents API, which triggers the Vercel redeploy.

**Tech Stack:** Next.js (App Router), TypeScript, CSS Modules, `next/font/google`, Node 25, Node `crypto` (HMAC), GitHub Contents API, Vercel.

## Global Constraints

- Framework: **Next.js App Router**, **TypeScript**. No Tailwind for the public site — **CSS Modules + design-token CSS variables**.
- Content store is **GitHub JSON files under `/content`**. **No database.**
- Auth: **single shared password** from env; **no password-reset flow**.
- The **GitHub token is server-side only** — never sent to the browser, never in a client component.
- Palette (exact): cream `#FBF7F0`, red `#ED1C24`, ink `#231f1a`, muted ink `#4a443b`, blue underline `#A1C5FF`, hairline border `#ece5d7`.
- Fonts (exact): Newsreader (serif headings), Public Sans (body), Space Mono (uppercase eyebrow labels), loaded via `next/font/google`.
- Six routes: `/`, `/who-we-are`, `/events`, `/join`, `/subchapters`, `/resources`.
- Repo (POC): owner `Lasseignejk`, repo `jetaase`. Throwaway — favor clarity/speed; keep the extraction script reusable.
- Env vars: `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`, `ADMIN_PASSWORD`, `SESSION_SECRET`.
- Design source bundles live at `~/Downloads/JETAASE Landing Page Redesign.zip` → `dist/*.dc.html`. Each has `<script type="__bundler/template">` (JSON string of page HTML) and `<script type="__bundler/manifest">` (`{uuid: {mime, compressed, data(base64)}}`). Assets: `image/*` kept, `text/javascript` + `font/woff2` dropped.

---

### Task 1: Next.js project scaffold

**Files:**
- Create: whole Next.js app at repo root (`package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `.gitignore`, `.env.local.example`)

**Interfaces:**
- Consumes: nothing.
- Produces: a runnable Next.js app; `app/layout.tsx` (root layout) that later tasks extend.

- [ ] **Step 1: Scaffold the app in a temp dir, then move into the repo**

The repo already has `README.md` and `docs/`. Scaffold into a temp dir and copy in to avoid the non-empty-dir prompt.

```bash
cd /Users/jayerasmussen/Documents/GitHub
npx create-next-app@latest jetaase-scaffold \
  --ts --app --no-tailwind --no-src-dir --eslint \
  --import-alias "@/*" --use-npm --no-turbopack
# Copy app files into the existing repo (keep existing README/docs/.git)
rsync -a --exclude '.git' --exclude 'README.md' jetaase-scaffold/ jetaase/
rm -rf jetaase-scaffold
```

- [ ] **Step 2: Add `.env.local.example`**

Create `/Users/jayerasmussen/Documents/GitHub/jetaase/.env.local.example`:

```bash
# GitHub content store (server-side only)
GITHUB_TOKEN=
GITHUB_OWNER=Lasseignejk
GITHUB_REPO=jetaase
GITHUB_BRANCH=main
# Admin gate
ADMIN_PASSWORD=
SESSION_SECRET=
```

- [ ] **Step 3: Ensure `.env.local` is gitignored**

Confirm `.gitignore` contains `.env*` (create-next-app adds it). If missing, append `.env*.local` and `.env.local`.

- [ ] **Step 4: Run dev server and the production build**

Run: `cd /Users/jayerasmussen/Documents/GitHub/jetaase && npm run build`
Expected: build completes with the default starter route; no type errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/jayerasmussen/Documents/GitHub/jetaase
git add -A
git commit -m "chore: scaffold Next.js App Router app (TS, CSS Modules, no Tailwind)"
```

---

### Task 2: Design tokens, fonts, and global styles

**Files:**
- Create: `app/tokens.css`
- Modify: `app/globals.css` (replace starter content)
- Modify: `app/layout.tsx`
- Create: `app/fonts.ts`

**Interfaces:**
- Consumes: root layout from Task 1.
- Produces: CSS variables `--cream`, `--red`, `--ink`, `--ink-muted`, `--blue`, `--border` on `:root`; font CSS variables `--font-serif`, `--font-body`, `--font-mono` applied to `<html>`. Later components reference these via `var(--...)`.

- [ ] **Step 1: Create `app/fonts.ts` loading the three Google fonts**

```ts
import { Newsreader, Public_Sans, Space_Mono } from "next/font/google";

export const serif = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const body = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});
```

- [ ] **Step 2: Create `app/tokens.css`**

```css
:root {
  --cream: #FBF7F0;
  --red: #ED1C24;
  --ink: #231f1a;
  --ink-muted: #4a443b;
  --blue: #A1C5FF;
  --border: #ece5d7;
  --maxw: 1200px;
}
```

- [ ] **Step 3: Replace `app/globals.css`**

```css
@import "./tokens.css";

* { margin: 0; padding: 0; box-sizing: border-box; }

html { font-family: var(--font-body), system-ui, sans-serif; }

body {
  background: var(--cream);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
}

a { text-decoration: none; color: inherit; }

img { max-width: 100%; display: block; }
```

- [ ] **Step 4: Wire fonts + globals into `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { serif, body, mono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "JETAASE Southeast",
  description:
    "Japan Exchange and Teaching Alumni Association, Southeast US — AL, GA, NC, SC.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${body.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Verify build and font variables**

Run: `npm run build && npm run dev`
Expected: build passes. In the browser, `getComputedStyle(document.documentElement).getPropertyValue('--red')` returns `#ED1C24` and body background is cream.

- [ ] **Step 6: Commit**

```bash
git add app/fonts.ts app/tokens.css app/globals.css app/layout.tsx
git commit -m "feat: add design tokens and Google fonts (Newsreader/Public Sans/Space Mono)"
```

---

### Task 3: Design-bundle extraction script + assets

**Files:**
- Create: `scripts/extract-design.mjs`
- Create (generated): `public/images/*` and `design-extracted/<page>.html` (scratch, gitignored)
- Modify: `.gitignore` (add `design-extracted/`)

**Interfaces:**
- Consumes: nothing in-app; reads the zip's `dist/*.dc.html`.
- Produces: real image files under `public/images/`, and per-page cleaned HTML fragments under `design-extracted/` used as the porting source for Tasks 5–8. The script exports nothing importable; it is a CLI (`node scripts/extract-design.mjs <dist-dir>`).

- [ ] **Step 1: Unzip the design bundles to a known location**

```bash
cd /Users/jayerasmussen/Documents/GitHub/jetaase
mkdir -p .design-src
unzip -q "$HOME/Downloads/JETAASE Landing Page Redesign.zip" -d .design-src
ls ".design-src/jetaase_design/dist"   # 6 *.dc.html files
echo ".design-src/" >> .gitignore
echo "design-extracted/" >> .gitignore
```

- [ ] **Step 2: Write the extraction script**

Create `scripts/extract-design.mjs`:

```js
// Usage: node scripts/extract-design.mjs <dist-dir>
// Reads Claude Design *.dc.html bundles, writes images to public/images,
// and cleaned per-page HTML fragments to design-extracted/.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

const distDir = process.argv[2];
if (!distDir) {
  console.error("Usage: node scripts/extract-design.mjs <dist-dir>");
  process.exit(1);
}

const IMG_DIR = "public/images";
const OUT_DIR = "design-extracted";
mkdirSync(IMG_DIR, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg", "image/gif": "gif" };

// Map the design's cross-page links to Next routes.
const ROUTES = {
  "JETAASE Home.dc.html": "/",
  "JETAASE Who We Are.dc.html": "/who-we-are",
  "JETAASE Events.dc.html": "/events",
  "JETAASE Join.dc.html": "/join",
  "JETAASE Subchapters.dc.html": "/subchapters",
  "JETAASE Resources.dc.html": "/resources",
};

function scriptJson(html, type) {
  const re = new RegExp(`<script type="${type}">([\\s\\S]*?)</script>`);
  const m = html.match(re);
  return m ? JSON.parse(m[1]) : null;
}

for (const file of readdirSync(distDir).filter((f) => f.endsWith(".dc.html"))) {
  const html = readFileSync(join(distDir, file), "utf8");
  const manifest = scriptJson(html, "__bundler/manifest") || {};
  let tpl = scriptJson(html, "__bundler/template");
  if (typeof tpl !== "string") { console.warn("skip (no template):", file); continue; }

  // Write image assets; build uuid -> public path map. Drop js/font assets.
  const assetPath = {};
  for (const [uuid, a] of Object.entries(manifest)) {
    const ext = EXT[a.mime];
    if (!ext || a.compressed) continue; // images are uncompressed; skip js/fonts
    const outName = `${uuid}.${ext}`;
    writeFileSync(join(IMG_DIR, outName), Buffer.from(a.data, "base64"));
    assetPath[uuid] = `/images/${outName}`;
  }

  // Extract <body> inner HTML.
  const bodyMatch = tpl.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let body = bodyMatch ? bodyMatch[1] : tpl;

  // Strip Claude Design wrappers and the <helmet> head block (fonts come from next/font).
  body = body.replace(/<\/?x-dc[^>]*>/gi, "");
  body = body.replace(/<helmet>[\s\S]*?<\/helmet>/gi, "");
  // Drop bundler runtime script tags referencing asset uuids.
  body = body.replace(/<script[^>]*src="[0-9a-f-]{36}"[^>]*>\s*<\/script>/gi, "");

  // Rewrite asset uuids (in src="..." and url(...)) to public paths.
  for (const [uuid, path] of Object.entries(assetPath)) {
    body = body.split(uuid).join(path);
  }
  // Rewrite cross-page links to Next routes.
  for (const [dc, route] of Object.entries(ROUTES)) {
    body = body.split(`"${dc}"`).join(`"${route}"`);
  }

  const outName = (ROUTES[file] || "/" + basename(file)).replace(/^\//, "") || "home";
  const safe = outName === "" ? "home" : outName.replace(/\//g, "_");
  writeFileSync(join(OUT_DIR, `${safe || "home"}.html`), body.trim());
  console.log("extracted", file, "->", `${OUT_DIR}/${safe || "home"}.html`,
    `(${Object.keys(assetPath).length} images)`);
}
```

- [ ] **Step 3: Run the extraction**

Run: `node scripts/extract-design.mjs ".design-src/jetaase_design/dist"`
Expected: 6 lines like `extracted JETAASE Home.dc.html -> design-extracted/home.html (N images)`; `public/images/` now contains PNG/JPG files; `design-extracted/` contains 6 `.html` fragments with `style="..."` attributes, `/images/...` refs, and `/who-we-are`-style links.

- [ ] **Step 4: Sanity-check one fragment**

Run: `grep -c 'style=' design-extracted/join.html && grep -o '/images/[a-f0-9-]*\.[a-z]*' design-extracted/join.html | head`
Expected: nonzero style count; image paths resolve to files that exist in `public/images/`.

- [ ] **Step 5: Commit script + images (not the scratch fragments/src)**

```bash
git add scripts/extract-design.mjs public/images .gitignore
git commit -m "feat: add design-bundle extraction script and extracted image assets"
```

---

### Task 4: Shared layout components (Header, Footer, Eyebrow, Hero, Button)

**Files:**
- Create: `components/Header.tsx`, `components/Header.module.css`
- Create: `components/Footer.tsx`, `components/Footer.module.css`
- Create: `components/Eyebrow.tsx`, `components/Eyebrow.module.css`
- Create: `components/Hero.tsx`, `components/Hero.module.css`
- Create: `components/Button.tsx`, `components/Button.module.css`

**Interfaces:**
- Consumes: tokens/fonts from Task 2; extracted fragments from Task 3 (header/nav/footer markup is identical across pages — port once).
- Produces:
  - `<Header />` — sticky nav, no props.
  - `<Footer />` — no props.
  - `<Eyebrow>{label}</Eyebrow>` — Space Mono uppercase label.
  - `<Hero eyebrow?: string; title: ReactNode; subtitle?: string />`.
  - `<Button href: string; variant?: "solid" | "ghost">{children}</Button>` (solid = red pill).

- [ ] **Step 1: Port the header markup into `components/Header.tsx`**

Open `design-extracted/join.html`, copy the `<header>...</header>` block. Convert to `Header.tsx`: replace `style="..."` with `className={styles.x}`, `<img>` → `next/image` or plain `<img>` with the `/images/...` src, nav `<a href="/...">` → `next/link` `<Link>`. Use `"use client"` only if needed (not needed for a static nav). Move every inline style into `Header.module.css` using token variables.

```tsx
import Link from "next/link";
import styles from "./Header.module.css";

const NAV = [
  { href: "/who-we-are", label: "Who we are" },
  { href: "/events", label: "Events" },
  { href: "/subchapters", label: "Subchapters" },
  { href: "/resources", label: "Resources" },
];

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <img src="/images/LOGO_FILENAME.png" alt="JETAASE" className={styles.logo} />
        </Link>
        <nav className={styles.nav}>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={styles.link}>
              {n.label}
            </Link>
          ))}
          <Link href="/join" className={styles.joinBtn}>Join us</Link>
        </nav>
      </div>
    </header>
  );
}
```

Replace `LOGO_FILENAME.png` with the actual logo file emitted in Task 3 (the 48×48 round image referenced by the header `<img>`).

- [ ] **Step 2: Write `components/Header.module.css` from the inline values, with a mobile breakpoint**

```css
.header { position: sticky; top: 0; z-index: 50; background: var(--cream); border-bottom: 1px solid var(--border); }
.inner { max-width: var(--maxw); margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 18px 40px; }
.brand { display: flex; align-items: center; gap: 13px; color: var(--ink); }
.logo { width: 48px; height: 48px; border-radius: 50%; object-fit: contain; }
.nav { display: flex; gap: 32px; align-items: center; font-size: 15px; font-weight: 600; color: var(--ink-muted); }
.link { color: var(--ink-muted); }
.link:hover { color: var(--ink); }
.joinBtn { background: var(--red); color: #fff; padding: 10px 22px; border-radius: 999px; }
@media (max-width: 768px) {
  .inner { padding: 14px 20px; }
  .nav { gap: 16px; font-size: 13px; flex-wrap: wrap; justify-content: flex-end; }
}
```

- [ ] **Step 3: Port the footer into `components/Footer.tsx` + `Footer.module.css`**

Copy the `<footer>` block from a fragment (footer is shared). Same conversion process: inline styles → module classes with token variables; add a `@media (max-width: 768px)` block that stacks footer columns.

- [ ] **Step 4: Create `Eyebrow`, `Hero`, and `Button` presentational components**

`components/Eyebrow.tsx`:

```tsx
import styles from "./Eyebrow.module.css";
export default function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className={styles.eyebrow}>{children}</div>;
}
```

`components/Eyebrow.module.css`:

```css
.eyebrow { font-family: var(--font-mono); font-size: 13px; letter-spacing: .22em; text-transform: uppercase; color: var(--red); margin-bottom: 20px; }
```

`components/Hero.tsx`:

```tsx
import Eyebrow from "./Eyebrow";
import styles from "./Hero.module.css";

export default function Hero({
  eyebrow, title, subtitle,
}: { eyebrow?: string; title: React.ReactNode; subtitle?: string }) {
  return (
    <section className={styles.hero}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </section>
  );
}
```

`components/Hero.module.css`:

```css
.hero { max-width: var(--maxw); margin: 0 auto; padding: 72px 40px 28px; }
.title { font-family: var(--font-serif); font-weight: 500; font-size: 62px; line-height: 1.02; letter-spacing: -.015em; margin: 0 0 22px; }
.subtitle { font-size: 20px; line-height: 1.6; color: var(--ink-muted); max-width: 620px; }
@media (max-width: 768px) {
  .hero { padding: 40px 20px 20px; }
  .title { font-size: 40px; }
  .subtitle { font-size: 17px; }
}
```

`components/Button.tsx`:

```tsx
import Link from "next/link";
import styles from "./Button.module.css";

export default function Button({
  href, variant = "solid", children,
}: { href: string; variant?: "solid" | "ghost"; children: React.ReactNode }) {
  return (
    <Link href={href} className={`${styles.btn} ${styles[variant]}`}>{children}</Link>
  );
}
```

`components/Button.module.css`:

```css
.btn { display: inline-block; padding: 12px 26px; border-radius: 999px; font-weight: 600; font-size: 15px; }
.solid { background: var(--red); color: #fff; }
.ghost { border: 1px solid var(--border); color: var(--ink); }
```

- [ ] **Step 5: Verify components compile**

Run: `npm run build`
Expected: build passes (components are unused so far but must type-check).

- [ ] **Step 6: Commit**

```bash
git add components
git commit -m "feat: add shared layout components (Header, Footer, Eyebrow, Hero, Button)"
```

---

### Task 5: Home page

**Files:**
- Create: `app/page.tsx` (replace starter), `app/page.module.css`

**Interfaces:**
- Consumes: `Header`, `Footer`, `Hero`, `Button`, `Eyebrow` from Task 4; extracted `design-extracted/home.html`.
- Produces: the `/` route.

- [ ] **Step 1: Port `design-extracted/home.html` body into `app/page.tsx`**

Replace `<header>` with `<Header />` and `<footer>` with `<Footer />`. For each content `<section>`, convert `style="..."` to classes in `app/page.module.css` (reuse token variables). Replace hero blocks with `<Hero .../>` and CTA links with `<Button .../>` where they match. Keep image `src="/images/..."` refs as-is. This is a mechanical port — preserve the section order and copy verbatim.

- [ ] **Step 2: Add responsive rules**

In `app/page.module.css`, for any multi-column grid (`grid-template-columns: ... 1fr`), add:

```css
@media (max-width: 768px) {
  .gridClassName { grid-template-columns: 1fr; gap: 28px; }
}
```

- [ ] **Step 3: Build and screenshot-compare**

Run: `npm run dev`, open `http://localhost:3000/`.
Open the original bundle: `open ".design-src/jetaase_design/dist/JETAASE Home.dc.html"`.
Expected: at desktop width (~1280px) the rendered page matches the original — same fonts, colors, spacing, images, section order. Note and fix any drift (missing image, wrong font-size, color mismatch).

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: `/` compiles as a static route, no type errors.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/page.module.css
git commit -m "feat: port Home page from design bundle"
```

---

### Task 6: Static pages — Events, Join, Subchapters, Resources

**Files:**
- Create: `app/events/page.tsx` + `app/events/page.module.css`
- Create: `app/join/page.tsx` + `app/join/page.module.css`
- Create: `app/subchapters/page.tsx` + `app/subchapters/page.module.css`
- Create: `app/resources/page.tsx` + `app/resources/page.module.css`

**Interfaces:**
- Consumes: shared components (Task 4); extracted fragments `events.html`, `join.html`, `subchapters.html`, `resources.html`.
- Produces: routes `/events`, `/join`, `/subchapters`, `/resources`. (Events content stays static here; the live Events editor is out of POC scope.)

- [ ] **Step 1: Port each fragment** using the same mechanical process as Task 5 (one page at a time): swap in `<Header />`/`<Footer />`, move inline styles to the page's `.module.css` with token variables, keep `/images/...` refs, convert hero/CTA to shared components where they match.

- [ ] **Step 2: Add mobile breakpoints** to each page's `.module.css` for any fixed multi-column grid (e.g. Join's `340px 1fr` layout → single column under 768px; make the sticky "why join" sidebar non-sticky on mobile).

- [ ] **Step 3: Screenshot-compare each page** against its original bundle (`open ".design-src/jetaase_design/dist/JETAASE <Name>.dc.html"`) at desktop width; fix drift.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: all four routes compile static; no type errors.

- [ ] **Step 5: Commit**

```bash
git add app/events app/join app/subchapters app/resources
git commit -m "feat: port Events, Join, Subchapters, Resources pages"
```

---

### Task 7: Content model — types, `board.json`, sample events, reader

**Files:**
- Create: `content/board.json`
- Create: `content/events/2026-summer-social.json`, `content/events/2026-fall-welcome.json`
- Create: `lib/content.ts`
- Create: `lib/content.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - Type `BoardMember = { id: string; name: string; role: string; chapter: "AL" | "GA" | "NC" | "SC"; bio: string; photo: string; order: number }`.
  - `readBoard(): BoardMember[]` — reads `content/board.json`, returns members sorted by `order`.

- [ ] **Step 1: Seed `content/board.json`** (3 sample members):

```json
[
  { "id": "m1", "name": "Aiko Tanaka", "role": "President", "chapter": "GA", "bio": "JET alum, Fukushima 2016–2019.", "photo": "/images/board-placeholder.png", "order": 1 },
  { "id": "m2", "name": "Marcus Lee", "role": "Events Chair", "chapter": "NC", "bio": "JET alum, Nagano 2015–2017.", "photo": "/images/board-placeholder.png", "order": 2 },
  { "id": "m3", "name": "Priya Nair", "role": "Treasurer", "chapter": "AL", "bio": "JET alum, Okinawa 2018–2020.", "photo": "/images/board-placeholder.png", "order": 3 }
]
```

Use an existing extracted image for `photo`, or copy one to `public/images/board-placeholder.png`.

- [ ] **Step 2: Seed two sample events** — `content/events/2026-summer-social.json`:

```json
{ "slug": "2026-summer-social", "title": "Summer Social", "date": "2026-08-15", "chapter": "GA", "location": "Atlanta, GA", "summary": "Casual meetup for JET alumni across the Southeast." }
```

and `content/events/2026-fall-welcome.json` analogously (`slug` `2026-fall-welcome`, date `2026-10-03`, chapter `NC`).

- [ ] **Step 3: Write the failing test** `lib/content.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readBoard } from "./content";

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
```

- [ ] **Step 4: Install and configure Vitest**

```bash
npm i -D vitest
npm pkg set scripts.test="vitest run"
```

Run: `npx vitest run lib/content.test.ts`
Expected: FAIL — `readBoard` not found.

- [ ] **Step 5: Implement `lib/content.ts`**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type Chapter = "AL" | "GA" | "NC" | "SC";
export type BoardMember = {
  id: string; name: string; role: string;
  chapter: Chapter; bio: string; photo: string; order: number;
};

const CONTENT_DIR = join(process.cwd(), "content");

export function readBoard(): BoardMember[] {
  const raw = readFileSync(join(CONTENT_DIR, "board.json"), "utf8");
  const members = JSON.parse(raw) as BoardMember[];
  return members.slice().sort((a, b) => a.order - b.order);
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run lib/content.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add content lib/content.ts lib/content.test.ts package.json package-lock.json
git commit -m "feat: add content model, board.json, sample events, and reader"
```

---

### Task 8: Who We Are page rendering board from `board.json`

**Files:**
- Create: `app/who-we-are/page.tsx` + `app/who-we-are/page.module.css`
- Create: `components/BoardGrid.tsx` + `components/BoardGrid.module.css`

**Interfaces:**
- Consumes: `readBoard()` (Task 7); shared components (Task 4); extracted `who-we-are.html`.
- Produces: route `/who-we-are` whose board section is data-driven — **this is the live demo target for the admin loop.**

- [ ] **Step 1: Create `components/BoardGrid.tsx`** (server component — no `"use client"`):

```tsx
import type { BoardMember } from "@/lib/content";
import styles from "./BoardGrid.module.css";

export default function BoardGrid({ members }: { members: BoardMember[] }) {
  return (
    <div className={styles.grid}>
      {members.map((m) => (
        <article key={m.id} className={styles.card}>
          <img src={m.photo} alt={m.name} className={styles.photo} />
          <h3 className={styles.name}>{m.name}</h3>
          <div className={styles.role}>{m.role} · {m.chapter}</div>
          <p className={styles.bio}>{m.bio}</p>
        </article>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `components/BoardGrid.module.css`** matching the design's card style (reuse token variables; grid `repeat(auto-fill, minmax(220px, 1fr))`, gap 28px; add a `@media (max-width: 768px)` single-column rule).

- [ ] **Step 3: Port `who-we-are.html` into `app/who-we-are/page.tsx`**, and replace the static board/team section with `<BoardGrid members={readBoard()} />`:

```tsx
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import BoardGrid from "@/components/BoardGrid";
import { readBoard } from "@/lib/content";
import styles from "./page.module.css";

export default function WhoWeArePage() {
  const board = readBoard();
  return (
    <>
      <Header />
      {/* ...ported hero + prose sections from who-we-are.html... */}
      <section className={styles.boardSection}>
        <BoardGrid members={board} />
      </section>
      <Footer />
    </>
  );
}
```

Port the remaining hero/prose sections from the fragment as in Task 5.

- [ ] **Step 4: Verify the page renders the seeded members**

Run: `npm run dev`, open `/who-we-are`.
Expected: three board cards (Aiko Tanaka, Marcus Lee, Priya Nair) render in `order`; rest of the page matches the original bundle.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: `/who-we-are` compiles; `board.json` is read at build time.

- [ ] **Step 6: Commit**

```bash
git add app/who-we-are components/BoardGrid.tsx components/BoardGrid.module.css
git commit -m "feat: render Who We Are board section from board.json"
```

---

### Task 9: Session auth library (sign/verify) — TDD

**Files:**
- Create: `lib/session.ts`
- Create: `lib/session.test.ts`

**Interfaces:**
- Consumes: env `SESSION_SECRET`.
- Produces:
  - `signSession(secret: string, ttlMs: number): string` → token `"<expEpochMs>.<hexHmac>"`.
  - `verifySession(secret: string, token: string | undefined): boolean` → true iff signature valid AND not expired.

- [ ] **Step 1: Write failing tests** `lib/session.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { signSession, verifySession } from "./session";

const SECRET = "test-secret";

describe("session tokens", () => {
  it("verifies a freshly signed token", () => {
    const t = signSession(SECRET, 60_000);
    expect(verifySession(SECRET, t)).toBe(true);
  });
  it("rejects a token signed with a different secret", () => {
    const t = signSession(SECRET, 60_000);
    expect(verifySession("other-secret", t)).toBe(false);
  });
  it("rejects a tampered token", () => {
    const t = signSession(SECRET, 60_000);
    const [exp] = t.split(".");
    expect(verifySession(SECRET, `${exp}.deadbeef`)).toBe(false);
  });
  it("rejects an expired token", () => {
    const t = signSession(SECRET, -1_000); // already expired
    expect(verifySession(SECRET, t)).toBe(false);
  });
  it("rejects undefined/garbage", () => {
    expect(verifySession(SECRET, undefined)).toBe(false);
    expect(verifySession(SECRET, "nonsense")).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run lib/session.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/session.ts`**

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

function sign(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function signSession(secret: string, ttlMs: number): string {
  const exp = Date.now() + ttlMs;
  return `${exp}.${sign(secret, String(exp))}`;
}

export function verifySession(secret: string, token: string | undefined): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 0) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = sign(secret, expStr);
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run lib/session.test.ts`
Expected: PASS (all 5).

- [ ] **Step 5: Commit**

```bash
git add lib/session.ts lib/session.test.ts
git commit -m "feat: add signed session token lib with HMAC verify"
```

---

### Task 10: Auth API route + `/admin` login gate

**Files:**
- Create: `app/api/auth/route.ts`
- Create: `lib/auth-cookie.ts`
- Create: `app/admin/page.tsx` + `app/admin/page.module.css`
- Create: `app/admin/LoginForm.tsx`

**Interfaces:**
- Consumes: `signSession`/`verifySession` (Task 9); env `ADMIN_PASSWORD`, `SESSION_SECRET`.
- Produces:
  - `COOKIE_NAME = "jetaase_session"` and `getSessionTtlMs()` exported from `lib/auth-cookie.ts`.
  - `POST /api/auth` — body `{ password }`; on match sets httpOnly signed cookie, returns `{ ok: true }`; else 401.
  - `requireSession()` helper reading the cookie and returning boolean (used by Task 12).

- [ ] **Step 1: Create `lib/auth-cookie.ts`**

```ts
import { cookies } from "next/headers";
import { verifySession } from "./session";

export const COOKIE_NAME = "jetaase_session";
export const getSessionTtlMs = () => 1000 * 60 * 60 * 8; // 8h

export async function requireSession(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifySession(process.env.SESSION_SECRET ?? "", token);
}
```

- [ ] **Step 2: Create `app/api/auth/route.ts`**

```ts
import { NextResponse } from "next/server";
import { signSession } from "@/lib/session";
import { COOKIE_NAME, getSessionTtlMs } from "@/lib/auth-cookie";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const ttl = getSessionTtlMs();
  const token = signSession(process.env.SESSION_SECRET ?? "", ttl);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: ttl / 1000,
  });
  return res;
}
```

- [ ] **Step 3: Create `app/admin/LoginForm.tsx`** (client component: password input → POST `/api/auth` → on ok, `router.refresh()`):

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) router.refresh();
    else setError("Incorrect password");
  }
  return (
    <form onSubmit={submit}>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin password" />
      <button type="submit">Sign in</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
```

- [ ] **Step 4: Create `app/admin/page.tsx`** — server component that shows `LoginForm` when unauthenticated, else a placeholder "Signed in" (board editor lands in Task 13):

```tsx
import { requireSession } from "@/lib/auth-cookie";
import LoginForm from "./LoginForm";
import styles from "./page.module.css";

export default async function AdminPage() {
  const authed = await requireSession();
  return (
    <main className={styles.wrap}>
      <h1>JETAASE Admin</h1>
      {authed ? <p>Signed in. (Board editor added in Task 13.)</p> : <LoginForm />}
    </main>
  );
}
```

Add minimal centered styling in `app/admin/page.module.css`.

- [ ] **Step 5: Manually verify the gate**

Set `ADMIN_PASSWORD` and `SESSION_SECRET` in `.env.local`. Run `npm run dev`, open `/admin`.
Expected: wrong password → "Incorrect password"; correct password → page refreshes to "Signed in." Cookie `jetaase_session` present, httpOnly.

- [ ] **Step 6: Commit**

```bash
git add app/api/auth app/admin lib/auth-cookie.ts
git commit -m "feat: add admin password gate with signed session cookie"
```

---

### Task 11: GitHub proxy library (request shaping) — TDD

**Files:**
- Create: `lib/github.ts`
- Create: `lib/github.test.ts`

**Interfaces:**
- Consumes: env `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`.
- Produces:
  - `buildPutBody({ contentUtf8, message, branch, sha? }): object` — GitHub Contents PUT body (`content` base64-encoded; `sha` only when provided).
  - `getFileSha(fetchImpl, { owner, repo, path, branch, token }): Promise<string | null>` — null on 404.
  - `commitFile(fetchImpl, { owner, repo, path, branch, token, contentUtf8, message }): Promise<{ commitUrl: string }>` — fetches sha then PUTs.

- [ ] **Step 1: Write failing tests** `lib/github.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { buildPutBody, getFileSha, commitFile } from "./github";

describe("buildPutBody", () => {
  it("base64-encodes content and omits sha when absent", () => {
    const body = buildPutBody({ contentUtf8: "hi", message: "m", branch: "main" });
    expect(body).toEqual({
      message: "m", branch: "main",
      content: Buffer.from("hi", "utf8").toString("base64"),
    });
    expect("sha" in body).toBe(false);
  });
  it("includes sha when provided", () => {
    const body = buildPutBody({ contentUtf8: "hi", message: "m", branch: "main", sha: "abc" });
    expect((body as any).sha).toBe("abc");
  });
});

describe("getFileSha", () => {
  const args = { owner: "o", repo: "r", path: "content/board.json", branch: "main", token: "t" };
  it("returns sha on 200", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ status: 200, ok: true, json: async () => ({ sha: "SHA1" }) });
    expect(await getFileSha(fetchImpl, args)).toBe("SHA1");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.github.com/repos/o/r/contents/content/board.json?ref=main",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer t" }) }),
    );
  });
  it("returns null on 404", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ status: 404, ok: false, json: async () => ({}) });
    expect(await getFileSha(fetchImpl, args)).toBeNull();
  });
});

describe("commitFile", () => {
  it("fetches sha then PUTs with it and returns commit url", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({ status: 200, ok: true, json: async () => ({ sha: "OLD" }) })
      .mockResolvedValueOnce({ status: 200, ok: true, json: async () => ({ commit: { html_url: "https://github.com/commit/1" } }) });
    const out = await commitFile(fetchImpl, {
      owner: "o", repo: "r", path: "content/board.json", branch: "main",
      token: "t", contentUtf8: "[]", message: "update",
    });
    expect(out.commitUrl).toBe("https://github.com/commit/1");
    const putCall = fetchImpl.mock.calls[1];
    expect(putCall[1].method).toBe("PUT");
    expect(JSON.parse(putCall[1].body).sha).toBe("OLD");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run lib/github.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/github.ts`**

```ts
const API = "https://api.github.com";

type Base = { owner: string; repo: string; path: string; branch: string; token: string };

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export function buildPutBody(args: {
  contentUtf8: string; message: string; branch: string; sha?: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    message: args.message,
    branch: args.branch,
    content: Buffer.from(args.contentUtf8, "utf8").toString("base64"),
  };
  if (args.sha) body.sha = args.sha;
  return body;
}

export async function getFileSha(
  fetchImpl: typeof fetch, a: Base,
): Promise<string | null> {
  const url = `${API}/repos/${a.owner}/${a.repo}/contents/${a.path}?ref=${a.branch}`;
  const res = await fetchImpl(url, { headers: headers(a.token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getFileSha failed: ${res.status}`);
  const data = await res.json();
  return data.sha as string;
}

export async function commitFile(
  fetchImpl: typeof fetch,
  a: Base & { contentUtf8: string; message: string },
): Promise<{ commitUrl: string }> {
  const sha = await getFileSha(fetchImpl, a);
  const url = `${API}/repos/${a.owner}/${a.repo}/contents/${a.path}`;
  const res = await fetchImpl(url, {
    method: "PUT",
    headers: { ...headers(a.token), "content-type": "application/json" },
    body: JSON.stringify(
      buildPutBody({ contentUtf8: a.contentUtf8, message: a.message, branch: a.branch, sha: sha ?? undefined }),
    ),
  });
  if (!res.ok) throw new Error(`commitFile failed: ${res.status}`);
  const data = await res.json();
  return { commitUrl: data.commit.html_url as string };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run lib/github.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add lib/github.ts lib/github.test.ts
git commit -m "feat: add GitHub Contents API commit library"
```

---

### Task 12: GitHub proxy API route (auth-guarded)

**Files:**
- Create: `app/api/github/route.ts`

**Interfaces:**
- Consumes: `requireSession` (Task 10), `commitFile` (Task 11), env GitHub vars.
- Produces: `POST /api/github` — body `{ path, content, message }`; returns `{ commitUrl }` or 401/500.

- [ ] **Step 1: Implement the route**

```ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-cookie";
import { commitFile } from "@/lib/github";

export async function POST(req: Request) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { path, content, message } = await req.json().catch(() => ({}));
  if (!path || typeof content !== "string" || !message) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  try {
    const out = await commitFile(fetch, {
      owner: process.env.GITHUB_OWNER!, repo: process.env.GITHUB_REPO!,
      branch: process.env.GITHUB_BRANCH ?? "main", token: process.env.GITHUB_TOKEN!,
      path, contentUtf8: content, message,
    });
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Guard-rail check — unauthenticated request is rejected**

Run: `npm run dev`, then in a fresh terminal:
`curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:3000/api/github -H 'content-type: application/json' -d '{"path":"content/board.json","content":"[]","message":"x"}'`
Expected: `401` (no session cookie).

- [ ] **Step 3: Commit**

```bash
git add app/api/github
git commit -m "feat: add auth-guarded GitHub commit proxy route"
```

---

### Task 13: Admin board editor (the real vertical slice)

**Files:**
- Create: `app/admin/BoardEditor.tsx`
- Modify: `app/admin/page.tsx` (render `BoardEditor` when authed, pass `readBoard()`)

**Interfaces:**
- Consumes: `readBoard()` (Task 7), `requireSession` (Task 10), `POST /api/github` (Task 12).
- Produces: minimal add/remove board editor that commits `content/board.json` through the proxy.

- [ ] **Step 1: Create `app/admin/BoardEditor.tsx`** (client component):

```tsx
"use client";
import { useState } from "react";
import type { BoardMember } from "@/lib/content";

export default function BoardEditor({ initial }: { initial: BoardMember[] }) {
  const [members, setMembers] = useState<BoardMember[]>(initial);
  const [status, setStatus] = useState("");

  function addMember() {
    const n = members.length + 1;
    setMembers([...members, {
      id: `m${Date.now()}`, name: "New Member", role: "Member",
      chapter: "GA", bio: "", photo: "/images/board-placeholder.png", order: n,
    }]);
  }
  function removeMember(id: string) {
    setMembers(members.filter((m) => m.id !== id));
  }
  async function save() {
    setStatus("Saving…");
    const res = await fetch("/api/github", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: "content/board.json",
        content: JSON.stringify(members, null, 2) + "\n",
        message: "chore(admin): update board members",
      }),
    });
    const data = await res.json();
    setStatus(res.ok ? `Committed: ${data.commitUrl}` : `Error: ${data.error}`);
  }

  return (
    <div>
      <ul>
        {members.map((m) => (
          <li key={m.id}>
            {m.name} — {m.role} ({m.chapter})
            <button onClick={() => removeMember(m.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <button onClick={addMember}>Add member</button>
      <button onClick={save}>Save to GitHub</button>
      {status && <p>{status}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Wire it into `app/admin/page.tsx`**

```tsx
import { requireSession } from "@/lib/auth-cookie";
import { readBoard } from "@/lib/content";
import LoginForm from "./LoginForm";
import BoardEditor from "./BoardEditor";
import styles from "./page.module.css";

export default async function AdminPage() {
  const authed = await requireSession();
  return (
    <main className={styles.wrap}>
      <h1>JETAASE Admin</h1>
      {authed ? <BoardEditor initial={readBoard()} /> : <LoginForm />}
    </main>
  );
}
```

- [ ] **Step 3: Local end-to-end check (against the real repo)**

Set all env vars in `.env.local` (real `GITHUB_TOKEN` with Contents R/W). Run `npm run dev`, sign in at `/admin`, add a member, click "Save to GitHub".
Expected: status shows `Committed: https://github.com/Lasseignejk/jetaase/commit/...`; the commit appears on GitHub and `content/board.json` has the new member.

- [ ] **Step 4: Commit**

```bash
git add app/admin/BoardEditor.tsx app/admin/page.tsx
git commit -m "feat: add minimal admin board editor committing via proxy"
```

---

### Task 14: Vercel deploy + end-to-end loop validation (hands-on)

**Files:** none (configuration + manual validation). This task is driven by the human operator; the agent provides the exact steps and verifies each success criterion.

**Interfaces:**
- Consumes: everything above; the deployed Vercel project.
- Produces: a validated end-to-end loop meeting all four success criteria in the spec.

- [ ] **Step 1: Create a fine-grained GitHub PAT** (operator, browser)

GitHub → Settings → Developer settings → Fine-grained tokens → repository access = **only `Lasseignejk/jetaase`**, permission **Contents: Read and write**. Copy the token.

- [ ] **Step 2: Push the branch and import into Vercel** (operator)

```bash
git push origin HEAD
```

In Vercel: New Project → import `Lasseignejk/jetaase` → framework auto-detected as Next.js.

- [ ] **Step 3: Set Vercel environment variables** (operator)

Add for Production: `GITHUB_TOKEN` (the PAT), `GITHUB_OWNER=Lasseignejk`, `GITHUB_REPO=jetaase`, `GITHUB_BRANCH=main`, `ADMIN_PASSWORD` (chosen), `SESSION_SECRET` (random 32+ chars). Deploy.

- [ ] **Step 4: Verify criterion 1 — pages render**

Open the production URL; visit all 6 routes.
Expected: each matches the design (desktop) and is usable on mobile.

- [ ] **Step 5: Verify criteria 2–4 — the loop**

Open `/admin` on the production URL, sign in, add a board member, Save to GitHub.
Expected in order: (2) status shows a commit URL and the commit exists on GitHub; (3) Vercel starts a new deployment automatically; (4) after it finishes, `/who-we-are` shows the new board member.

- [ ] **Step 6: Record the result**

Note in the PR/README that the loop is validated, and that the next step is re-doing this on the official JETAASE org + Vercel account (fresh repo, fresh PAT, fresh env vars). No code changes needed to port — only the `GITHUB_OWNER`/`GITHUB_REPO`/token/secrets differ.
