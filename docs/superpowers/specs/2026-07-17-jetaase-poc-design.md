# JETAASE Southeast — POC Design

**Date:** 2026-07-17
**Status:** Approved, ready for planning
**Repo (POC):** https://github.com/Lasseignejk/jetaase

## Purpose

Validate one end-to-end content pipeline **before** committing to the real
JETAASE org. This is a throwaway proof-of-concept on a personal repo. Once the
flow is proven, everything here gets re-done on an official JETAASE
GitHub org + Vercel account. Because it is throwaway, favor **speed and
clarity** over polish, but keep the design-extraction script reusable so it can
be re-run against the real repo.

JETAASE = Japan Exchange and Teaching Alumni Association, Southeast US
(covers AL, GA, NC, SC).

## The one loop being validated

Edit content in a password-protected admin → serverless proxy commits JSON to
GitHub → Vercel auto-redeploys → the public page reflects the change.

```
Browser (/admin)  --password-->  Next.js API route (/api/github)
      |                                  |  server-side GITHUB_TOKEN
      |                                  v
      |                        GitHub Contents API (PUT board.json)
      |                                  |
      |                                  v
      +---- sees change after -----  commit -> Vercel build -> redeploy
```

The site deploys from the **same repo** it commits to, so the commit *is* the
deploy trigger. "Confirm Vercel auto-deploys" falls out of the loop for free.

## Success criteria

1. All 6 pages render faithfully (desktop pixel-match + working mobile) in prod.
2. Logging into `/admin` and editing a board member commits to GitHub via the
   serverless proxy.
3. Vercel auto-builds on that commit.
4. `/who-we-are` reflects the edit after redeploy.

## Stack

- **Next.js (App Router)** — Vercel-native; API routes are the serverless proxy;
  server components read `/content` JSON at build time.
- **TypeScript**, Node 25, npm.
- **CSS Modules + design tokens** for styling (no Tailwind for the public site).
- **GitHub as the content store**; **no database**.

## 1. Frontend: design → components

### Source material

Six Claude Design exports (`.dc.html`) are self-extracting bundles. The real
markup lives in a `<script type="__bundler/template">` JSON string; images are
base64 blobs referenced by UUID in a manifest. Markup is clean, semantic,
inline-styled, desktop-fixed (fixed px, no media queries).

Pages: **Home, Who We Are, Events, Join, Subchapters, Resources** (6, not 5 —
Resources was in the export).

### Design system (observed from export)

- **Fonts:** Newsreader (serif headings), Public Sans (body), Space Mono
  (uppercase eyebrow labels) — loaded via `next/font/google`.
- **Palette:** cream `#FBF7F0`, red accent `#ED1C24`, ink `#231f1a` / `#4a443b`,
  blue underline `#A1C5FF`, hairline border `#ece5d7`.
- **Structure:** sticky header nav, hero with eyebrow label + serif headline,
  sectioned content.

### Extraction

A throwaway-but-reusable Node script in `/scripts` that, per bundle:
- parses the `__bundler/template` markup and asset manifest,
- writes images to `/public/images/`,
- rewrites `<ASSET>` refs to `/images/...` and `*.dc.html` links to Next routes,
- strips Claude Design wrappers (`<x-dc>`, `<helmet>`).

Kept in-repo so it can be re-run on the real repo when the design changes.

### Component structure

- **Routes (App Router):** `/`, `/who-we-are`, `/events`, `/join`,
  `/subchapters`, `/resources`.
- **Shared components:** `Header`, `Footer`, `Eyebrow`, `Hero`, `Button` —
  extracted from repeated markup. Page-specific sections live in each
  `page.tsx`.
- **Styling:** `globals.css` holds tokens as CSS variables; each component has a
  co-located `.module.css` with exact design values plus `@media` breakpoints
  (~768px / ~1024px) so nav collapses and grids stack on mobile.

### Fidelity gate

Screenshot each rendered route, compare against the original bundle, confirm
pixel-faithfulness (desktop) before marking a page done. Mobile is a sensible
responsive adaptation, not a pixel target.

## 2. Content model (`/content`)

```
content/
  board.json          [{ id, name, role, chapter, bio, photo, order }]
  events/
    <slug>.json        one file per event (1-2 samples, not wired to editor)
  site.json            optional shared bits
```

**`/who-we-are` renders its board section from `board.json`** (server component
reads the file at build). This makes the admin edit visible on the live site —
it is the demo target. The events folder is scaffolded but not wired to a live
editor in this POC.

## 3. Serverless proxy + auth

- **`app/api/github/route.ts`** — the only code that touches the token. Accepts
  `{ path, content, message }`, validates the session cookie, fetches the
  target file's current SHA, then
  `PUT /repos/{owner}/{repo}/contents/{path}`. Rejects unauthenticated calls.
- **`app/api/auth/route.ts`** — verifies submitted password against
  `ADMIN_PASSWORD`; on success sets a short-lived, signed, httpOnly session
  cookie (HMAC with `SESSION_SECRET`). No password-reset flow; single shared
  password.
- **`/admin`** — password form → once authed, a **minimal board editor**: list
  members from `board.json`, add/remove one member, Save → calls the proxy.
  Just enough to exercise the real vertical slice.

### Environment variables

| Var | Purpose |
|-----|---------|
| `GITHUB_TOKEN` | Fine-grained PAT, Contents R/W on this repo only |
| `GITHUB_OWNER` | `Lasseignejk` |
| `GITHUB_REPO` | `jetaase` |
| `GITHUB_BRANCH` | e.g. `main` |
| `ADMIN_PASSWORD` | Single shared admin password |
| `SESSION_SECRET` | HMAC key for signing the session cookie |

## 4. Deploy & validation

Link repo to Vercel, set env vars, push. User performs the hands-on/browser
steps (Vercel link, fine-grained PAT creation) with guidance. Validate against
the four success criteria above.

## 5. Out of scope (deferred to the future CRUD spec)

Events editor, photo/gallery upload, post templates + template picker, board
reorder / photo-upload, freeform page-text editing (VS Code job), password
reset, any database. The future admin panel handles full CRUD for board
members, events, photos, and templated posts — none of that is built here.

## 6. Testing

- **Unit:** session cookie sign/verify; proxy request-shaping (SHA fetch + PUT
  payload) with the GitHub call mocked.
- **Fidelity:** screenshot comparison per route (not snapshot tests).
- No e2e harness for the POC; the deploy round-trip is validated manually
  against the success criteria.
