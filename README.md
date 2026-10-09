# JETAASE Southeast — Website

The website for JETAASE Southeast (Japan Exchange & Teaching Alumni Association, Southeast US: AL / GA / NC / SC). It has a public site plus a password-protected `/admin` where board members can edit content without touching code.

There is no database. The content lives in JSON files in this repo. When someone saves in `/admin`, the change is committed to GitHub and Vercel redeploys the site automatically.

## Stack

- **Next.js 16.2** (App Router) + React 19 + TypeScript
- **CSS Modules** with design tokens in `app/tokens.css` (no Tailwind)
- **GitHub as the content store** via the Contents API
- **Vercel** for hosting
- **Vitest** for tests

> ⚠️ This Next.js version has breaking changes compared with older docs and most AI training data. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (see `AGENTS.md`).

## How the admin loop works

1. A board member signs into `/admin` with the shared password. `/api/auth` sets an httpOnly session cookie signed with HMAC-SHA256.
2. They edit the board in the browser (`app/admin/BoardEditor.tsx`).
3. Clicking Save sends a `POST` to `/api/github`. That route requires a valid session, then `lib/github.ts` commits `content/board.json` through the GitHub Contents API.
4. The commit triggers a Vercel redeploy, and `/who-we-are` shows the updated board.

Both API routes fail closed: they return 401 without a valid session, and login refuses to work if `SESSION_SECRET` is unset.

## Project layout

```
app/
  (site)/layout.tsx        Header, <main> and Footer for every public page
  (site)/page.tsx          Home
  (site)/who-we-are/       Board / officers (renders content/board.json)
  (site)/events/  join/  subchapters/  resources/
  admin/                   Login form + board editor
  api/auth/route.ts        Password → signed session cookie
  api/github/route.ts      Auth-guarded commit proxy
  tokens.css fonts.ts globals.css   Design system
components/                Header, Footer, Hero, Eyebrow, Button, BoardGrid
lib/
  site.ts                  Contact emails and outside links
  session.ts               Sign and verify session tokens
  auth-cookie.ts           Cookie name, TTL, requireSession
  github.ts                getFileSha / commitFile (Contents API)
  content.ts               readBoard()
content/
  board.json               Board members (editable from /admin)
  events/*.json            Sample events (not wired up yet; see below)
scripts/extract-design.mjs Pulls images/fragments out of the design bundles
docs/superpowers/          Specs, plan, and the official-rebuild scope doc
```

## Local development

Requires Node 20 or newer.

```bash
npm install
cp .env.local.example .env.local   # then fill in the values
npm run dev                        # http://localhost:3000
```

Other scripts:

```bash
npm test         # vitest
npm run lint
npm run build
```

### Environment variables

| Variable | Purpose |
| --- | --- |
| `GITHUB_TOKEN` | Fine-grained PAT with **Contents: Read & write** on this repo only. Server-side only. |
| `GITHUB_OWNER` | Repo owner, e.g. `jetaase` |
| `GITHUB_REPO` | Repo name, e.g. `jetaase-website` |
| `GITHUB_BRANCH` | Branch to commit content to (usually `main`) |
| `ADMIN_PASSWORD` | Shared password for `/admin` |
| `SESSION_SECRET` | Random string, 32+ characters, used to sign session cookies |

Set the same variables in the Vercel project's settings for production. Note that saving from `/admin` while running locally still commits to the real GitHub repo named by these variables.

## Design source

The pages were ported from Claude Design `.dc.html` bundles. These are kept locally in `.design-src/dist/`, which is gitignored. `scripts/extract-design.mjs` writes images to `public/images/` and HTML fragments to `design-extracted/` (also gitignored).

Fonts: Newsreader (headings), Public Sans (body), Space Mono (eyebrow labels).

## Status and roadmap

The proof of concept is complete. The full edit → commit → redeploy loop was validated live on 2026-07-19. The code has since moved to the official `jetaase/jetaase-website` repo.

Remaining work, tracked in `docs/superpowers/specs/2026-07-19-jetaase-official-rebuild-scope.md`:

- [ ] Create the Vercel project under the official JETAASE team and set fresh env vars (new PAT and `SESSION_SECRET`; don't reuse the POC ones)
- [ ] Recover the GoDaddy account (2FA is tied to an old phone number), then switch it to an authenticator app
- [ ] Cut `jetaase.org` over from Squarespace to Vercel by swapping only the apex A record and the `www` CNAME. **Leave the MX/TXT records (Google Workspace email) alone.**
- [ ] Decide which admin CRUD features are in scope for v1: board reorder and photo upload, an events editor (the events page is currently hardcoded), galleries, and templated posts

Known minor issues that were acceptable for the POC: duplicate `order` values after removing and then adding a board member, a non-constant-time password comparison, and no 409 conflict handling when several admins save at once.
