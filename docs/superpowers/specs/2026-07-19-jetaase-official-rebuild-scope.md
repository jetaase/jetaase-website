# JETAASE Southeast — Official Rebuild Scoping

Status: **scoping in progress** (started 2026-07-19)
⚠️ **Known issue (clear path):** GoDaddy 2FA is on a stale phone (`…8770`), but we have the login creds AND access to the account email → recoverable via GoDaddy support (email-code verification). Not a hard blocker. See §2.
Predecessor: throwaway POC on `Lasseignejk/jetaase` — validated the edit→commit→redeploy loop end-to-end. See `.superpowers/sdd/progress.md` and `docs/superpowers/specs/2026-07-17-jetaase-poc-design.md`.

Goal: re-home the validated POC onto the **official JETAASE GitHub org + Vercel account**, wire the real domain, and (optionally) build out the deferred admin CRUD.

---

## 0. Reproduction / kickoff (read this first)

**Goal of this section:** give a fresh Claude session (or a new contributor) everything needed to stand up the official site without regenerating code.

### Recommended path: COPY the validated code — do not rebuild from scratch
The POC app is complete, reviewed, and working. Regenerating it from a prompt would re-introduce already-fixed bugs (e.g. the fail-open `SESSION_SECRET`). Instead, copy the repo:

```bash
git clone https://github.com/Lasseignejk/jetaase.git jetaase-official
cd jetaase-official
git remote set-url origin https://github.com/<JETAASE-ORG>/<repo>.git
git push -u origin main
```

This carries over the whole app **plus** the committed specs/plan/ledger (full history travels with it — see "Docs that travel" below). Then follow §1–§3 for config, domain, and 2FA, and build CRUD (§4) on top of a known-good base.

### ⚠️ This is NOT stock Next.js
`AGENTS.md`/`CLAUDE.md` in the repo warn: this Next.js version has breaking changes vs. training data. **Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`.** Heed deprecation notices.

### Context block for a fresh Claude
- **What it is:** the JETAASE Southeast (Japan Exchange & Teaching Alumni Assoc., Southeast US — AL/GA/NC/SC) website. Public marketing site + a password-protected `/admin` that lets non-technical board members edit content without a database.
- **Stack:** Next.js 16.2.x App Router, TypeScript, **CSS Modules (no Tailwind)**, Node 25, **GitHub as the content store (no DB)**, deployed on Vercel. Tests: vitest.
- **The core loop (the whole thesis):** sign into `/admin` (password) → edit `content/board.json` in the browser → `POST /api/github` (auth-guarded proxy) → `lib/github.ts` commits the file via the **GitHub Contents API** → Vercel auto-redeploys → `/who-we-are` renders the updated `board.json`. Validated end-to-end on 2026-07-19.
- **Auth model:** password → `/api/auth` sets an **httpOnly signed session cookie** (HMAC-SHA256, `lib/session.ts`). `lib/auth-cookie.ts` has `requireSession`. Both `/api/auth` and `/api/github` fail **closed** (401 without a valid session; login throws 500 if `SESSION_SECRET` is unset — this is intentional hardening, commit `674fcfc`).
- **Key files:**
  - Pages: `app/page.tsx` (home), `app/who-we-are/`, `app/events/`, `app/join/`, `app/subchapters/`, `app/resources/` (6 pages total).
  - Admin: `app/admin/page.tsx`, `app/admin/LoginForm.tsx`, `app/admin/BoardEditor.tsx`.
  - API routes: `app/api/auth/route.ts`, `app/api/github/route.ts`.
  - Libs: `lib/session.ts`, `lib/auth-cookie.ts`, `lib/github.ts` (Contents API: `getFileSha`/`commitFile`, injectable `fetchImpl` for tests), `lib/content.ts` (`readBoard`).
  - Content: `content/board.json`, `content/events/*.json`.
  - Shared components: `components/` — `Header`, `Footer`, `Hero`, `Eyebrow`, `Button`, `BoardGrid`.
  - Design system: `app/tokens.css`, `app/fonts.ts`, `app/globals.css`.
- **Env vars (see `.env.local.example`, committed):** `GITHUB_TOKEN` (fine-grained PAT, Contents R/W, target repo only), `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`, `ADMIN_PASSWORD`, `SESSION_SECRET` (random 32+ chars). Local dev uses a gitignored `.env.local`.
- **Design source (for re-porting/adding pages):** 6 Claude Design `.dc.html` bundles from `~/Downloads/JETAASE Landing Page Redesign.zip`, unzipped to `.design-src/dist/` (gitignored). `scripts/extract-design.mjs` parses the bundle → writes images to `public/images/`, fragments to `design-extracted/` (gitignored). Fonts via `next/font/google`: **Newsreader** (serif headings), **Public Sans** (body), **Space Mono** (uppercase eyebrow labels). Palette tokens: cream `#FBF7F0`, red `#ED1C24`, ink `#231f1a`, muted `#4a443b`, blue `#A1C5FF`, border `#ece5d7`.
- **Known gotchas / carried-over minors:** `extract-design.mjs` misses `.dc.html` links with `#anchor` suffixes (fixed by hand during porting — watch for leftover `JETAASE X.dc.html#...` links). Join page is a **Google Forms iframe** (faithful to the real flow). `content/events/*.json` exist but the events page is **hardcoded/unwired**. Board editor can produce duplicate `order` values after remove-then-add. Password compare is `!==` (not constant-time). All acceptable-for-POC; revisit in the CRUD build (§4).

### Docs that travel with the code (already committed)
- `docs/superpowers/specs/2026-07-17-jetaase-poc-design.md` — POC design spec.
- `docs/superpowers/plans/2026-07-17-jetaase-poc.md` — the implementation plan.
- `.superpowers/sdd/progress.md` — the task-by-task SDD ledger (trust it + `git log` after any context reset).
- This file — the official-rebuild scope.

---

## 1. Port the app to the official org
- **No code changes needed** to move. Only env/config differs:
  - New repo under the official JETAASE org (was `Lasseignejk/jetaase`).
  - New Vercel project linked to that repo.
  - New env vars: `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_TOKEN` (fresh fine-grained PAT — Contents: R/W, that repo only), `GITHUB_BRANCH`, `ADMIN_PASSWORD`, `SESSION_SECRET` (fresh random 32+ char).
- **Rotate secrets** for the real build — the POC PAT was visible in a terminal; generate a brand-new PAT + `SESSION_SECRET`.

## 2. Custom domain (jetaase.org — currently on Squarespace)
`jetaase.org` is live on **Squarespace**, with DNS + registration at **GoDaddy** and **email on Google Workspace** (confirmed via dig, 2026-07-19 — see inventory below).

Steps once the official Vercel project is deployed:
1. Vercel project → **Settings → Domains** → add the domain (apex `jetaase-domain.tld` and/or `www.`).
2. Vercel shows the DNS records to create. Two cases:
   - **Apex/root:** A record → `76.76.21.21`, or ALIAS/ANAME → `cname.vercel-dns.com` if the registrar supports apex CNAME.
   - **Subdomain (`www` etc.):** CNAME → `cname.vercel-dns.com`.
3. Add those records wherever the domain's **DNS is managed** (GoDaddy dashboard, or Squarespace/Google Domains if DNS was delegated there — need to confirm).
4. HTTPS/SSL is **automatic** on Vercel — no cert config.
5. Vercel shows a live checkmark when DNS propagates (minutes to a few hours).

### Live DNS inventory — `jetaase.org` (checked 2026-07-19, read-only `dig`)
- **Domain:** `jetaase.org`. **DNS managed at GoDaddy** (nameservers `ns49`/`ns50.domaincontrol.com`). GoDaddy is registrar AND DNS host → **all record changes happen in the GoDaddy DNS dashboard**, not Squarespace.
- **Website = Squarespace:** apex A records `198.49.23.144`, `198.49.23.145`, `198.185.159.144`, `198.185.159.145`; `www` CNAME → `ext-sq.squarespace.com`.
- **🚨 EMAIL EXISTS — Google Workspace (Gmail).** MX → `aspmx.l.google.com` (pri 1), `alt1/alt2.aspmx.l.google.com` (5), `aspmx2/3.googlemail.com` (10). SPF TXT `v=spf1 include:_spf.google.com ~all`, plus a `google-site-verification` TXT. **DO NOT TOUCH these** — surgical swap only, never a nameserver move.
- **Current TTL** ~3600s (1h) → lower before cutover.

### Records to change vs. preserve
| Record | From (Squarespace) | To (Vercel) |
|--------|--------------------|-------------|
| Apex `A` (all 4) | `198.49.23.144/145`, `198.185.159.144/145` | single A → **the IP Vercel's Domains page shows** (typically `76.76.21.21`) |
| `www` `CNAME` | `ext-sq.squarespace.com` | `cname.vercel-dns.com` |

**Leave untouched:** all MX (Google Workspace email), SPF TXT, google-site-verification TXT.
> Use whatever apex IP/target Vercel's project Domains page shows — Vercel has rotated its recommended anycast IPs; the dashboard is authoritative.

### ⚠️ GoDaddy account access — 2FA on a stale phone (CLEAR RECOVERY PATH)
GoDaddy 2FA is on a phone ending `…8770` no current board member controls. **BUT: we have the account login (number/username + password) AND access to the email on the account.** That makes this the *easy* recovery branch, not a hard blocker. Editing DNS is gated on removing the stale 2FA first.

- **The domain is NOT at risk.** Registration is tied to the account, not the phone; while auto-renew + a valid card are on file, `jetaase.org` keeps renewing and the site + email keep resolving.

**Fix (do this before cutover):**
1. **Self-service check first:** on the 2FA prompt, look for "Need help? / Can't access your phone? / Try another way." If **backup codes** were ever saved, one bypasses the phone instantly — skip support.
2. **GoDaddy support (24/7 phone/chat) — the main lever.** Have the account number/username, password, and the account email inbox open. Say: *"Locked out of 2-step verification — the phone on the account (ending 8770) belongs to a former board member we no longer have; please remove/update it."* They verify identity via an **email code to the on-file address** (which we control) → remove/change the 2FA phone.

**Immediately after regaining access — harden (per §3):** switch GoDaddy 2-step to an **authenticator app (TOTP)**, store the setup key in the restricted JETAASE Drive folder, **save the new backup codes** there, and update the recovery email/phone to org-controlled contacts.

### Cutover sequence for jetaase.org
1. Build + verify the new site on Vercel (`*.vercel.app` URL) until content-complete.
2. In GoDaddy DNS, lower TTL on the 4 apex A records + `www` CNAME to 600s (or min), **24–48h before** cutover so the old 1h TTL expires everywhere.
3. Add `jetaase.org` + `www.jetaase.org` in Vercel → Settings → Domains (pre-stages SSL; reads "misconfigured" until flip — expected).
4. Cutover: in GoDaddy, delete the 4 Squarespace apex A records → add the single Vercel A record; change `www` CNAME to `cname.vercel-dns.com`. **Don't touch MX/TXT.**
5. Verify: apex + `www` load over HTTPS; send a test email to/from a `@jetaase.org` address to confirm mail still flows.
6. Rollback if needed: re-add the Squarespace records above (fast, thanks to lowered TTL).
7. Decommission Squarespace ~1–2 weeks later, once confident. Then cancel the subscription.

## 3. Account ownership & 2FA strategy (volunteer org, all free)

**Problem being solved:** the org is volunteer-run and geographically spread across the Southeast; the "person in charge" (and their phone number) rotates. SMS 2FA ties access to one person's phone → lockouts. Goal: durable, free, no single point of failure.

### Structure — multi-owner accounts (free tiers)
- **GitHub → Organization** (not a personal account). Add multiple people as **Owners** (myself + the jetaase account, plus others over time). Repo lives in the org, so no individual leaving breaks it.
- **Vercel → Team** (free Hobby tier). Add the same people as members/owners.
- The shared **jetaase root account** (Google/Workspace) is the anchor/billing owner but becomes a rarely-touched "break-glass" login — day-to-day access flows through each person's own org/team account.

### 2FA — never SMS; use TOTP (authenticator apps, free)
Two cases, and geography is a non-issue for both:

1. **Individual org/team accounts (90% of access):** each person enables 2FA on **their own** account independently, with their own phone. **No shared secret, nothing to distribute.** Free apps: Google Authenticator, Microsoft Authenticator, Bitwarden Authenticator.

2. **The one shared jetaase root account:** multiple people enroll the *same* TOTP secret — but you do NOT need to scan a QR together. The QR just encodes a text **"setup key"** (e.g. `JBSW Y3DP EHPK 3PXP`, shown under "can't scan? enter manually").
   - Copy that setup key once → store in a **restricted JETAASE Google Drive folder** (Workspace) along with the account's **recovery/backup codes**.
   - Each board member, from anywhere, opens their authenticator app → "Add account → Enter a setup key / manual entry" → pastes it.
   - Every app then generates the same rotating code. No co-location, no shared phone number.

### Rotation
When board members change, add/remove their org/team membership and Drive-folder access. The accounts themselves don't depend on any one person or phone.

### Notes / alternatives
- **Avoid Google Voice / shared phone numbers:** just moves the "who's logged in?" problem, and GitHub + some services reject VoIP numbers for 2FA.
- **Bitwarden** free tier + free Organization exists but caps at **2 users** sharing (fine for 2 keyholders, too small for a whole board). Bitwarden also offers **free/discounted nonprofit plans** — worth applying for once JETAASE is set up if a real shared vault is wanted later.

## 4. Deferred admin CRUD (from POC — separate spec likely)
Scoped OUT of the POC, candidates for the real build:
- Board CRUD: add/edit/**reorder**/remove, **photo upload** (POC had order-collision + no-reorder limitations).
- Events editor (POC has `content/events/*.json` but the events page is hardcoded — not wired).
- Photo/gallery upload.
- "Posts with template options" — the design export already encodes templated `sc-if`/`data-props` sections with editor types (boolean/text), a real foundation for this.
- Nice-to-haves: constant-time password compare, Save disabled-state, commit conflict (409) handling for multi-admin, password-reset flow.

Freeform page copy stays a VS Code / code job (locked, not admin-editable) unless we decide otherwise.

## Open questions to resolve during scoping
- [x] Exact domain name + registrar + DNS host → **jetaase.org, registered + DNS at GoDaddy, site on Squarespace, email on Google Workspace** (2026-07-19)
- [x] Cutover plan & timing off Squarespace → **surgical A/CNAME swap at GoDaddy, sequence documented above** (timing TBD once new site ready)
- [ ] ⚠️ **GoDaddy 2FA on stale phone (`…8770`) — clear path.** Have login creds + account email access → call GoDaddy support to remove/change the 2FA (email-code verification), then harden per §3. Must be done before the DNS cutover. Domain itself is safe. See §2.
- [ ] Confirm access to the Google Workspace admin (in case any email/DNS coordination needed)
- [x] Who owns/admins the official JETAASE GitHub org + Vercel account → **GitHub Org + Vercel Team, multi-owner (me + jetaase account); 2FA via shared TOTP setup key in restricted Drive folder — see §3** (2026-07-19)
- [ ] Which CRUD features are in-scope for v1 vs deferred again
