# Tutor Time / Popcorn Maths — Feature Audit Report

**Audit Date:** 2026-11-25  
**Mode:** Strictly read-only, code-verified audit (zero state-changing git commands, zero AWS/server changes, zero `.env` reads or secret output).  
**Headline Summary:** The recovered repository (`HEAD` at `f1105d1` on `main`) is much more complete than feared—PR `#5` (`feature/private-portal`, which linearly included Phase 2 and PR `#4`) was merged into `main` on 2026-11-25. All **12 automated test suites pass (570 passed, 0 failed, 2 platform skips)** and all **20 canonical HTML pages + portal + API routes load cleanly** in isolated local mode. Out of the 18 gap-check targets, **14 are PRESENT**, **2 are PARTIAL** (#12 swappable mascot setup, #14 consultation booking results sent to Cassie), and **2 are MISSING** (#9 readiness check split into Math & Language Arts, #15 chatbot recommending services based on results). Several concrete runtime/deployment defects were also uncovered directly in code (notably `Dockerfile` omitting `COPY docs ./docs`, which would break `/privacy` in containerized deployments).

---

## Step 1: Repository Snapshot

| Field | Value |
|---|---|
| **Repository Path** | `C:\Users\handa\OneDrive\Desktop\work2026\US Guy\Edn_Application_Repo` |
| **Workspace Parent Folder** | `C:\Users\handa\OneDrive\Desktop\work2026\US Guy` |
| **Current Branch** | `main` |
| **HEAD Commit** | `f1105d18c30e0f92f2029d324dd5cadad6e6886e` (`f1105d1`) |
| **Total Reachable Commits** | `67` |
| **Configured Remote (`origin`)** | `https://github.com/Risky007-dev/Edn_Application_Repo/` (fetch/push) |
| **Local Branches** | `* main` (`f1105d1`, tracking `origin/main`) |
| **Remote-Tracking Branches** | `origin/HEAD -> origin/main`, `origin/main` (`f1105d1`) |
| **Tags** | *(none)* |
| **Uncommitted Changes** | Clean working tree prior to writing this report (`git status --short` returned empty). Note: gitignored local runtime files `.env`, `subscribers.json`, and `data/tutortime-submissions.json` exist on disk and are untracked per `.gitignore`. |

### Last 20 Commits (`main`)

| # | Hash | Date | Message |
|---|---|---|---|
| 1 | `f1105d1` | `2026-11-25T17:30:09+01:00` | Merge pull request #5 from Risky007-dev/feature/private-portal |
| 2 | `668c396` | `2026-11-25T17:29:59+01:00` | fix(pages): align Popcorn Math forms/game/locations, complete 4-pathway home grid, add branded 404, and remove dead runtime modules |
| 3 | `0c9d4b0` | `2026-11-25T16:14:27+01:00` | fix(security,tests): restore timingSafeCompare export and fix stage1/stage5 test isolation |
| 4 | `ec48eb9` | `2026-11-19T19:13:29Z` | feat(portal): styled HTML parent emails, QuickSchools roll-call sheet, and moderate parent view |
| 5 | `5e540aa` | `2026-11-19T18:58:34Z` | feat(portal): upgrade to QuickSchools-inspired SIS shell, roll-call grid, and tabbed student profiles |
| 6 | `2d69229` | `2026-11-19T15:10:03Z` | refactor(home): redesign landing page with taste-skill editorial layout and stand-in photography |
| 7 | `0d52eff` | `2026-11-19T15:02:36Z` | feat(home): add feature showcase carousel and 3 holiday special programmes |
| 8 | `9511b06` | `2026-11-19T14:59:21Z` | style(main-site): editorial studio retouch for typography, cards, and micro-interactions |
| 9 | `6ba4ca0` | `2026-11-19T14:56:41Z` | style(portal): upgrade portal UI to Tutor Time editorial studio design |
| 10 | `516d1e6` | `2026-11-19T14:13:00Z` | test(portal): add portal infra, env config, and isolated test suite |
| 11 | `08ccd8f` | `2026-11-19T14:13:00Z` | feat(portal): add portal routes, checkin.tutortime.ai host routing, UI, and print styles |
| 12 | `29fd772` | `2026-11-19T14:13:00Z` | feat(portal): add portal storage, scrypt auth, billing math, and SES email service |
| 13 | `a76800f` | `2026-11-13T16:33:48Z` | style(mascot): redesign inline SVG guide mascot with clean proportions and circular badge frame |
| 14 | `fe00df6` | `2026-11-13T16:29:33Z` | fix(legal): stop exposing internal docs on /terms and /privacy; render visitor-facing draft only |
| 15 | `7125792` | `2026-11-13T16:22:53Z` | refactor(mascot): make guide mascot config-driven for single-setting artwork swap |
| 16 | `9e199b5` | `2026-11-13T16:22:14Z` | content(pages): replace Details coming soon stubs on about, resources, contact, and faq from Nov 8 brief |
| 17 | `c0a5b25` | `2026-11-13T16:21:26Z` | feat(legal): add /privacy and /terms draft routes from docs/legal/ with review banner |
| 18 | `7e5c8db` | `2026-11-13T16:20:38Z` | feat(chatbot): update default model to claude-haiku-5-5, web_search_20260318, and explicit unavailable widget state |
| 19 | `dbdb347` | `2026-11-09T12:16:58Z` | chore(deploy): wire Claude model and secret references in deployment definitions |
| 20 | `0e5574e` | `2026-11-09T00:29:58Z` | docs(task6): legal and privacy document pack in docs/legal/ |

---

## Step 2: Code-Verified Feature Inventory

All statuses below are verified directly against source files and live local execution (no reliance on READMEs, plans, or ClickUp).

### Pages & Public Routes

| Feature | Status | Evidence (File Paths) | One-Line Note |
|---|---|---|---|
| Home Page (`/`, `/index.html`) | **DONE** | `server.js`, `src/shared/templates/pages.js`, `src/shared/content/index.js` | Split editorial hero, 4 pathway cards, interactive tools band, 3 holiday specials, and newsletter signup; stand-in photography in place. |
| Core Service Pages (`/services/:slug`) | **DONE** | `server.js`, `src/shared/brand.js`, `src/shared/templates/pages.js`, `src/popcorn/popcornRebuild.js` | Serves `traditional-tutoring`, `concierge` (with 4-question readiness survey + application), `popcorn-math`, and `specialist-support`; 301 from `/services/popcorn-maths`. |
| Popcorn Math Sub-Site (6 sub-routes + redirects) | **PARTIAL** | `server.js`, `src/popcorn/popcornRebuild.js`, `src/shared/content/popcornSchools.js`, `src/shared/content/index.js` | All 6 sub-pages (`/parents`, `/schools`, `/presenters`, `/locations`, `/play`, `/faq`) + 301s (`/join`, `/popcorn-maths/*`) work, but school list uses placeholders and hub dropdown still includes an `"Online / Virtual Cohort"` contradicting the in-person-only brief. |
| Book Consultation Page (`/book`) | **DONE** | `server.js`, `src/shared/templates/pages.js`, `MyWebApp/src/main/webapp/js/forms.js` | Consultation request form with query-param prefill (`?service=`, `?interest=`, `?location=`) and printable consultation preparation checklist. |
| About, Resources, Contact, FAQ Pages | **PARTIAL** | `server.js`, `src/shared/templates/pages.js`, `src/shared/content/index.js` | All 4 routes render real visitor content (HTTP 200), but retain owner-pending `data-todo="content"` notices (founder bio, downloadable worksheets, confirmed office hours). |
| Smart Service Finder (`/find-your-programme`) | **DONE** | `server.js`, `src/shared/templates/pages.js`, `src/shared/finder/serviceFinder.js`, `MyWebApp/src/main/webapp/js/finder.js` | Zero-storage 3-question quiz mapping to all 4 canonical services with allowlisted `?interest=` hints; minor wording note (`ADHD or dyslexia` option remains in Q2). |
| CPEA Readiness Check (`/readiness-check`) | **DONE** | `server.js`, `src/shared/templates/pages.js`, `src/shared/content/readiness-questions.js`, `MyWebApp/src/main/webapp/js/readiness.js` | Feature-flagged 12-question gamified MC quiz across 4 subjects (24-question bank), star trail, streaks, mascot reactions, 4 bands, and printable parent summary. |
| Draft Legal Pages (`/privacy`, `/terms`) | **PARTIAL** | `server.js`, `src/shared/templates/legalPages.js`, `docs/legal/CHATBOT_PRIVACY_WORDING.md` | Works locally (visitor-only AI disclosure on `/privacy`, neutral coming-soon on `/terms`, no internal docs leaked), but `Dockerfile` does not copy `docs/`, which will break `/privacy` in Docker. |
| SEO, Favicon & Branded 404 | **DONE** | `server.js`, `src/shared/templates/pages.js` | Dynamic `/robots.txt` (host-aware `Disallow: /` for `checkin.tutortime.ai`), `/sitemap.xml` (18 canonical URLs), `/favicon.{ico,png}`, sensitive-extension blocklist, and branded HTML 404 page. |

### API Endpoints

| Feature | Status | Evidence (File Paths) | One-Line Note |
|---|---|---|---|
| Health & Tracing Probes (`/health`, `/api/health`, `/api/health/ping`) | **DONE** | `server.js`, `src/shared/middleware/logger.js` | Zero-IO unthrottled health endpoints plus structured JSON logging with `X-Trace-Id` and `Server-Timing` headers. |
| Unified Form Pipeline (`POST /api/forms/:formType`) | **DONE** | `src/shared/forms/formPipeline.js`, `src/shared/forms/validators.js` | Handles 7 form types with honeypot sinkhole, consent check, strict unknown-field rejection, rate limiting, and storage persistence. |
| CV Presigned Upload (`POST /api/uploads/presign`, `/api/uploads/mock-post`) | **DONE** | `src/shared/forms/formPipeline.js`, `src/shared/storage/{localDriver,awsDriver}.js` | PDF-only, 5 MB max presigned POST generator for S3 (`cv-uploads/YYYY/MM/...`) or local mock sink (`204`). |
| Admin Metrics & Brand Info (`GET /api/metrics`, `GET /api/brand-info`) | **DONE** | `src/shared/forms/formPipeline.js`, `src/shared/middleware/security.js` | `/api/metrics` gated by timing-safe `X-Admin-Key` (returns 404 when unauthorized); `/api/brand-info` serves canonical brand & WhatsApp JSON. |
| Newsletter Subscribe & Admin Read (`POST /subscribe`, `GET /subscribers`) | **DONE** | `server.js` | Rate-limited atomic JSON subscriber signup with duplicate 409 handling; admin listing gated by `X-Admin-Key`. |
| Claude Chatbot API (`POST /api/chat`) | **DONE** | `server.js`, `src/shared/chatbot/chatController.js` | Anthropic SDK Messages API (`claude-haiku-5-5`, `web_search_20260318`), IP rate limit, daily 200-req cap, 500-char limit, graceful 503 when key missing. |
| Synthetic Fault Injection (`POST /api/debug/fault`) | **DONE** | `server.js`, `src/shared/config.js` | Disabled by default (`404`); requires `FAULT_INJECTION_ENABLED=true` and timing-safe `X-Debug-Fault-Key`. |

### Forms

| Feature | Status | Evidence (File Paths) | One-Line Note |
|---|---|---|---|
| 7 Validated Launch Forms + Client Handler | **DONE** | `src/shared/forms/validators.js`, `src/shared/forms/formPipeline.js`, `MyWebApp/src/main/webapp/js/forms.js` | Covers `book-consultation`, `concierge-application`, `presenter-application` (18+ gate + PDF CV upload), `learning-needs` (non-clinical), `contact`, `school-enquiry`, and `popcorn-parent-interest` (no child names). |
| Homepage Interest Subscribe Form | **DONE** | `src/shared/templates/pages.js`, `MyWebApp/src/main/webapp/js/main.js`, `server.js` | Client AJAX submission to `POST /subscribe` with ARIA live status feedback. |

### UI Components, Theme & Interactive Features

| Feature | Status | Evidence (File Paths) | One-Line Note |
|---|---|---|---|
| Bright Kid-Friendly Theme, Dark Toggle & Component Library | **DONE** | `MyWebApp/src/main/webapp/css/{tokens,components,style}.css`, `MyWebApp/src/main/webapp/fonts/*.woff2`, `MyWebApp/src/main/webapp/js/main.js` | Warm ivory/cream default palette, self-hosted `Fredoka`/`Quicksand`/`Reenie Beanie` fonts (zero CDN), responsive nav/dropdowns, and `localStorage` dark-mode toggle. |
| Swappable Guide Mascot & Popcorn Bucket Mascot | **PARTIAL** | `src/shared/config.js`, `src/shared/components/{mascotGuide,mascotBucket}.js`, `MyWebApp/src/main/webapp/js/readiness.js` | Guide mascot supports single-setting image/expression swap (`GUIDE_MASCOT_IMAGE_PATH`); Popcorn Bucket mascot is hardcoded inline SVG only; no image assets installed under `assets/mascots/`. |
| Popcorn Math Browser Mini-Game | **DONE** | `src/shared/game/popcornGame.js`, `MyWebApp/src/main/webapp/js/game.js`, `src/popcorn/popcornRebuild.js` | 3-level arithmetic teaser (`kernels`, `poppers`, `crunch`), 3-kernel bucket progression, celebration screen, zero storage/tracking. |
| Concierge Readiness Self-Assessment & Printable Checklists | **DONE** | `src/shared/templates/pages.js`, `src/popcorn/popcornRebuild.js`, `MyWebApp/src/main/webapp/js/main.js` | 4-question inline survey on `/services/concierge` (prefills goals field) plus `window.print()` handouts on `/book` and `/popcorn-math/presenters`. |
| Chatbot Floating Widget | **DONE** | `src/shared/chatbot/widget.js`, `src/shared/templates/layout.js`, `MyWebApp/src/main/webapp/js/chatbot.js` | Accessible keyboard-friendly drawer on all public pages, privacy notice linking to `/privacy`, quick chips, char counter, and explicit offline/disabled state when unconfigured. |

### Private Attendance & Invoicing Portal

| Feature | Status | Evidence (File Paths) | One-Line Note |
|---|---|---|---|
| Portal Auth, Sessions & Security (`/office/*`, `checkin.tutortime.ai`) | **DONE** | `server.js`, `src/portal/auth.js`, `src/portal/router.js` | Scrypt hashing, forced first-login password change, 12h HttpOnly/SameSite cookies, CSRF verification, 5/15m login rate limit, `noindex`/`no-store` headers. |
| SIS Shell, Student Roster, Tabbed Profiles & Progress Notes | **DONE** | `src/portal/router.js`, `src/portal/templates.js`, `MyWebApp/src/main/webapp/css/portal.css`, `MyWebApp/src/main/webapp/js/portal.js` | QuickSchools-inspired dashboard, student CRUD/archive with `pricePerSession`, live table filter, and Homework & Mastery notes. |
| Daily Attendance & Batch Roll-Call Sheet | **DONE** | `src/portal/router.js`, `src/portal/billing.js`, `src/portal/templates.js` | Individual & batch attendance marking (`present`/`late`/`absent`/`cancelled`), "Mark All" helper, undo/delete, configurable `lateIsBillable`. |
| Printable Monthly Invoices & CSV Export | **DONE** | `src/portal/billing.js`, `src/portal/router.js`, `src/portal/templates.js`, `MyWebApp/src/main/webapp/css/portal.css` | Server-computed totals from attendance records, `/office/invoices` with dedicated `@media print` CSS, and `/office/export.csv` download. |
| Private Read-Only Parent Links (`/p/:token`) | **DONE** | `src/portal/router.js`, `src/portal/templates.js`, `src/portal/portalStore.js` | 256-bit random tokens stored SHA-256 hashed, strict single-student isolation, token regeneration, optional progress-note visibility toggle. |

### Email & Data Storage

| Feature | Status | Evidence (File Paths) | One-Line Note |
|---|---|---|---|
| Public Form Notification Email | **PARTIAL** | `src/shared/forms/formPipeline.js`, `src/shared/storage/{localDriver,awsDriver}.js` | Sends only `record.id` (no form field contents) to `ADMIN_NOTIFICATION_EMAIL`, and only uses SES when `STORAGE_DRIVER=aws`; `SEND_CONFIRMATIONS` defaults off. |
| Portal SESv2 Email Service & Audit Log | **DONE** | `src/portal/emailService.js`, `src/portal/router.js`, `src/portal/templates.js` | Styled HTML + plaintext attendance & custom parent notices with `Cassie@tutortime.ai` Reply-To, SES sandbox verification guard, mock mode locally, and `/office/emails` audit log. |
| Public Submissions Storage (Local JSON / DynamoDB + S3) | **DONE** | `src/shared/storage/{index,localDriver,awsDriver}.js` | Uniform record shape across `data/tutortime-submissions.json` and DynamoDB `tutortime-submissions`, plus S3 presigned POSTs. |
| Portal Storage (Local JSON / DynamoDB Single-Table) | **DONE** | `src/portal/portalStore.js` | Identical data interface across `data/tutortime-portal.json` and DynamoDB `tutortime-portal` (with `GSI1` token lookup and session TTL). |

### Infrastructure Templates, Scripts & Tests

| Feature | Status | Evidence (File Paths) | One-Line Note |
|---|---|---|---|
| CloudFormation Stack & Owner Runbook | **PARTIAL** | `infra/tutortime-stack.yaml`, `infra/OWNER_RUNBOOK.md` | Defines `SubmissionsTable`, `PortalTable`, private encrypted `UploadsBucket`, and least-privilege `AppManagedPolicy`; minor drift (`OWNER_RUNBOOK.md` says 90d vs template 180d, omits `PortalTable`/`PORTAL_*`, IAM omits `ses:GetAccount`/`GetEmailIdentity` and `PortalTableName` output). |
| Docker & ECS Task Definitions | **BROKEN** | `Dockerfile`, `Dockerfile.otel-collector`, `docker-compose.yml`, `ecs-task-definition*.json`, `otel-collector-config.yaml`, `deploy-to-ecs.{ps1,sh}` | `Dockerfile` does not copy `docs/` (causes `/privacy` ENOENT in container) and copies `.env.example` into `.env`; `ecs-task-definition-with-otel.json` hardcodes an AWS account ID and omits DynamoDB/portal/S3 env vars; `ecs-task-definition.json` retains legacy `SENDER_PASSWORD` secret. |
| Maintenance & Verification Scripts | **DONE** | `scripts/{check-syntax,check-copy,check-todos,seed-kashamar}.js`, `scripts/{analyze-colors-and-extract,create-web-assets,inspect-pdf}.py`, `run.{bat,sh}`, `start-server.bat` | JS syntax checker (53 files), proposed-copy reporter, rendered-HTTP TODO scanner, Kashamar admin seeder, and Python asset extraction helpers. |
| Automated Test Suite (12 Files) | **DONE** | `tests/stage{1..5}.test.js`, `tests/phase2_{local_env,mascots,chatbot,readiness,popcorn,legal}.test.js`, `tests/portal.test.js` | 570 total assertions covering routing, security, forms, AWS mock driver, chatbot mocks, readiness check, Popcorn rebuild, legal routes, and isolated portal flows. |

---

## Step 3: Isolated Test Run & Local Server Results

### Safety & Isolation Setup
- **Tests:** Executed directly via `node tests/<file>.test.js` (Node `v24.18.0`; `npm.ps1` is blocked by Windows PowerShell execution policy) with `STORAGE_DRIVER=local`, `EMAIL_DRIVER=mock`, `SEND_CONFIRMATIONS=false`, `ADMIN_NOTIFICATION_EMAIL=audit-mock@example.invalid`, and external `%TEMP%` overrides for `DATA_DIR`, `SUBSCRIBERS_DB_FILE`, and `PORTAL_DATA_FILE`. Zero AWS, SES, or Anthropic network calls occurred.
- **Local Server:** Started `node server.js` on `PORT=5099` with `cwd` set to an empty `%TEMP%` directory so `dotenv.config()` could not load `.env`, with `STORAGE_DRIVER=local`, `EMAIL_DRIVER=mock`, `SEND_CONFIRMATIONS=false`, external `%TEMP%` data files, and `ANTHROPIC_API_KEY` unset. All temp directories were removed afterward and `git status --short` remained completely clean.

### Automated Test & Check Script Results

| Suite / Script | Exit Code | Passed | Failed | Notes |
|---|---:|---:|---:|---|
| `tests/stage1.test.js` | `0` | 55 | 0 | Core routes, Helmet CSP, traversal blocks, uploads, forms, metrics, subscribe. |
| `tests/stage2.test.js` | `0` | 74 | 0 | All form validators, edge cases, unknown-field rejections. |
| `tests/stage3.test.js` | `0` | 182 | 0 | Mini-game, service finder, zero-storage checks, hints, accessibility. |
| `tests/stage4.test.js` | `0` | 34 | 0 | Mocked AWS SDK v3 driver (DynamoDB, S3 presigned POST, SESv2) + shape parity. |
| `tests/stage5.test.js` | `0` | 56 | 0 | Fault injection, tracing headers, Stage 5 toggles (1 skip: POSIX `SIGTERM` on `win32`). |
| `tests/phase2_local_env.test.js` | `0` | 6 | 0 | Preview banner, `SITE_URL`, `robots.txt`/`sitemap.xml` (Playwright viewport audit skipped — not installed). |
| `tests/phase2_mascots.test.js` | `0` | 25 | 0 | Guide & Bucket SVG renderers + config-driven guide image swap. |
| `tests/phase2_chatbot.test.js` | `0` | 36 | 0 | 100% mocked Anthropic client, `claude-haiku-5-5`, caps, error redaction, unavailable widget. |
| `tests/phase2_readiness.test.js` | `0` | 23 | 0 | 24-question bank, 4 subjects, flag disable check. |
| `tests/phase2_popcorn.test.js` | `0` | 58 | 0 | All 7 Popcorn Math routes, 301s, forms alignment, game DOM, 4 pathways, 404. |
| `tests/phase2_legal.test.js` | `0` | 10 | 0 | `/privacy` & `/terms` banners, visitor AI wording, zero internal doc leakage. |
| `tests/portal.test.js` | `0` | 11 | 0 | Billing math, token isolation, auth/CSRF/rate-limit, SES sandbox mock, progress notes. |
| **Total Tests** | **0** | **570** | **0** | **All 12 suites passed (2 expected environment skips).** |
| `scripts/check-syntax.js` | `0` | All JS | 0 | All JavaScript files passed `node --check`. |
| `scripts/check-copy.js` | `0` | — | 0 | Reported `6` `PROPOSED-COPY` items awaiting owner approval. |
| `scripts/check-todos.js` | `0` | — | 0 | Reported `0` visible `TODO(` markers and `100` hidden `data-todo`/HTML comment markers across 20 routes. |

### Local Server Live Route Probe (`http://127.0.0.1:5099`)

| Route / Request | Result | Status | Notes |
|---|---|---|---|
| `GET /`, `/index.html` | **200** | LOADED | 30,987 bytes; renders `data-chatbot-unavailable`, `Chat (Offline)`, and disabled input when `ANTHROPIC_API_KEY` is unset. |
| `GET /about`, `/resources`, `/faq`, `/contact`, `/book` | **200** | LOADED | All 5 core pages render cleanly (19–22 KB). |
| `GET /find-your-programme`, `/readiness-check` | **200** | LOADED | Service finder (22.8 KB) and CPEA readiness check (38.5 KB). |
| `GET /privacy`, `/terms` | **200** | LOADED | Draft legal pages render cleanly locally (21.8 KB, 18.3 KB). |
| `GET /services/traditional-tutoring`, `/services/concierge`, `/services/popcorn-math`, `/services/specialist-support` | **200** | LOADED | All 4 canonical service pages render cleanly. |
| `GET /popcorn-math/{parents,schools,presenters,locations,play,faq}` | **200** | LOADED | All 6 Popcorn Math sub-pages render cleanly. |
| `GET /services/popcorn-maths`, `/join`, `/popcorn-maths/{presenter,game,school-partnership}` | **301** | LOADED | Permanent redirects to canonical `/services/popcorn-math` and `/popcorn-math/*` routes. |
| `GET /health`, `/api/health`, `/api/health/ping` | **200** | LOADED | JSON status + `pong`. |
| `GET /robots.txt`, `/sitemap.xml`, `/api/brand-info` | **200** | LOADED | Expected SEO & brand payloads. |
| `GET /css/{tokens,style,components,portal}.css` & `/js/{main,forms,finder,game,readiness,chatbot,portal}.js` & `/favicon.{ico,png}` | **200** | LOADED | All static CSS, JS, and icon assets served cleanly. |
| `GET /office` | **302** | LOADED | Redirects unauthenticated users to `/office/login`. |
| `GET /office/login` | **200** | LOADED | Renders private portal login page (1,992 bytes). |
| `GET /` & `/robots.txt` with `Host: checkin.tutortime.ai` | **302 / 200** | LOADED | Redirects `/` to `/login`; `/robots.txt` returns `Disallow: /`. |
| `GET /api/metrics` (no key / valid `X-Admin-Key`) | **404 / 200** | LOADED | Protected as designed. |
| `POST /api/chat` (no `ANTHROPIC_API_KEY`) | **503** | EXPECTED | Returns friendly unavailable JSON without calling Anthropic. |
| `POST /api/forms/book-consultation` | **201** | LOADED | Saved to temp `tutortime-submissions.json`; mock email logged. |
| `POST /api/uploads/presign` (`sample_cv.pdf`) | **200** | LOADED | Returns local mock presigned POST payload (`cv-uploads/local/...`). |
| `GET /services/invalid-slug`, `/p/nonexistent-token-...`, `/nonexistent-page-check`, `/api/nonexistent-endpoint`, `/.env`, `/package.json`, `/README.md` | **404** | EXPECTED | Unknown pages render branded 404 HTML; API/blocked extensions/invalid tokens return plain 404. |

**Failed Routes:** None (0 unexpected 4xx/5xx responses across all 55+ tested requests).

---

## Step 4: 18-Point Gap Check

| # | Target Feature | Verdict | Code Evidence & Details |
|---|---|---|---|
| 1 | Main page with four reusable service cards | **PRESENT** | `src/shared/content/index.js:L68-105` defines 4 pathways (`tutoring`, `concierge`, `popcorn`, `specialist`); `src/shared/templates/pages.js:L89-99` loops over `hp.options` to render 4 `.pathway-card` elements in `.pathways-grid`. |
| 2 | A page for each service (`/services/:slug`) | **PRESENT** | `server.js:L246-267` & `src/shared/brand.js:L67-73` serve `/services/traditional-tutoring`, `/services/concierge`, `/services/popcorn-math`, `/services/specialist-support` (+ 301 from `/services/popcorn-maths`, 404 for unknown slugs). |
| 3 | Bright, kid-friendly theme and shared CSS components | **PRESENT** | `MyWebApp/src/main/webapp/css/tokens.css:L74-191` defines default bright ivory/warm-cream palette (`#FFFDF9`, `#FFF8EE`) and self-hosted `Fredoka`/`Quicksand`/`Reenie Beanie` fonts; `style.css:L7-8` imports `tokens.css` and `components.css` (2,155 lines); dark mode is toggleable via `main.js:L8-47`. |
| 4 | School enquiry form and other launch forms | **PRESENT** | `src/shared/forms/formPipeline.js:L39-144`, `src/shared/forms/validators.js`, `MyWebApp/src/main/webapp/js/forms.js`: `school-enquiry` (`/popcorn-math/schools`), `book-consultation` (`/book`), `concierge-application` (`/services/concierge`), `learning-needs` (`/services/specialist-support`), `contact` (`/contact`), `presenter-application` (`/popcorn-math/presenters` + PDF CV upload), `popcorn-parent-interest` (`/popcorn-math/parents`), plus `/subscribe`. |
| 5 | Mini-game | **PRESENT** | `/popcorn-math/play` (`server.js:L286-288`, `src/popcorn/popcornRebuild.js:L689-765`), client controller `MyWebApp/src/main/webapp/js/game.js`, pure logic `src/shared/game/popcornGame.js` (3 levels, 3-kernel bucket progression, zero storage). |
| 6 | Service finder | **PRESENT** | `/find-your-programme` (`server.js:L330-333`, `src/shared/templates/pages.js:L729-845`), `src/shared/finder/serviceFinder.js`, `MyWebApp/src/main/webapp/js/finder.js` (3-question in-memory quiz mapping to all 4 services). |
| 7 | Resources, About, Contact and FAQ pages | **PRESENT** | `/resources` (`pages.js:L848-897`), `/about` (`pages.js:L691-726`), `/contact` (`pages.js:L563-648`), `/faq` (`pages.js:L651-688`, plus `/popcorn-math/faq`). All render real visitor content, with remaining `data-todo="content"` notes for founder bio, downloadable packs, and confirmed office hours. |
| 8 | Gamified readiness check with multiple-choice questions and grading summary | **PRESENT** | `/readiness-check` (`pages.js:L900-962`), `src/shared/content/readiness-questions.js` (24 MC questions with passages, inline SVGs, explanations), `MyWebApp/src/main/webapp/js/readiness.js` (12-question session, star trail, streaks, mascot reactions, 4 readiness bands, subject bars, strengths/practice summary, print button). |
| 9 | Readiness check split into Math and Language Arts | **MISSING** | `readiness-questions.js:L16-360` and `js/readiness.js:L71-102` hardcode a single combined 12-question quiz across **4** subjects (`Language Arts`, `Mathematics`, `Science`, `Social Studies`, 3 each). No subject picker, separate Math/Language Arts modes, or dedicated subject routes exist. |
| 10 | Claude chatbot, on by default, model `claude-haiku-5-5` | **PRESENT** | Enabled by default (`src/shared/config.js:L5`, `layout.js:L29,L130`), `DEFAULT_MODEL = 'claude-haiku-5-5'` (`src/shared/chatbot/chatController.js:L14`), `web_search_20260318`, caps/rate-limits, and offline widget/503 fallback. *(Live Anthropic API acceptance of `claude-haiku-5-5` is UNVERIFIED without calling the external API.)* |
| 11 | `/privacy` and `/terms` pages with AI assistant disclosure, no internal documents exposed | **PRESENT** | `src/shared/templates/legalPages.js:L149-216` extracts only the visitor-facing markdown block from `docs/legal/CHATBOT_PRIVACY_WORDING.md` (AI assistant disclosure) and renders a neutral coming-soon notice on `/terms` (no internal governance docs or ClickUp IDs). **Container bug:** `Dockerfile` must add `COPY docs ./docs` or `/privacy` will fail in Docker. |
| 12 | Swappable mascot setup | **PARTIAL** | **Guide mascot** is config/env swappable (`src/shared/config.js:L36-45`, `src/shared/components/mascotGuide.js:L11-25`, `js/readiness.js:L38-51` via `GUIDE_MASCOT_IMAGE_PATH` + `expressions` map). **Popcorn Bucket mascot** (`src/shared/components/mascotBucket.js:L9-134`) is hardcoded inline SVG only with no config swap support, and no final artwork exists under `MyWebApp/src/main/webapp/assets/mascots/`. |
| 13 | Updated Popcorn Math content | **PRESENT** | `src/popcorn/popcornRebuild.js` implements all 7 rebuilt routes reflecting the Anguilla in-person Grades 1–5 hands-on take-home craft model, January pilot, and 18+ presenter roles. **Contradiction to clean up:** `content/index.js:L319-325` still lists an `"Online / Virtual Cohort"` in the hub dropdown (`popcornRebuild.js:L188-191`), and `popcornSchools.js` still uses placeholder cohort names (`Cohort 2`–`6`). |
| 14 | Consultation booking results sent to Cassie | **PARTIAL** | `src/shared/forms/formPipeline.js:L113-121` emails `process.env.ADMIN_NOTIFICATION_EMAIL` (`.env.example:L85` defaults to `notifications@popcornmaths.com`, not `Cassie@tutortime.ai`), sends **only the submission ID** (`"A new book-consultation submission was received with ID: ..."` — zero booking fields/details), only uses SES when `STORAGE_DRIVER=aws` (not `EMAIL_DRIVER=ses`), and `validators.js:L49-59` does not accept readiness/finder result summaries. |
| 15 | Chatbot recommending services based on results | **MISSING** | `src/shared/chatbot/chatController.js:L116` only accepts `{ message, history }`. `js/chatbot.js`, `js/readiness.js`, and `js/finder.js` have zero cross-module communication or result handoff, and `src/shared/chatbot/systemPrompt.js` has no instructions or mapping for recommending services based on readiness-check or finder results. |
| 16 | Private attendance and invoicing portal (login, students, per-session price, daily attendance, private parent links, printable invoices, automatic email) | **PRESENT** | Complete implementation in `src/portal/{auth,billing,emailService,portalStore,router,templates}.js`, `portal.css`, `portal.js`, `scripts/seed-kashamar.js`, and `tests/portal.test.js` (11/11 passed): scrypt login + forced first-change + CSRF + rate limit, students & `pricePerSession`, daily/batch roll-call, `/p/:token` isolated parent links, printable monthly invoices (`@media print`) + CSV export, and automatic SESv2 HTML/text parent emails with sandbox guard and `/office/emails` audit log. |
| 17 | Draft CloudFormation template, runbook and docs | **PRESENT** | `infra/tutortime-stack.yaml` (`SubmissionsTable`, `PortalTable`, `UploadsBucket`, `AppManagedPolicy`), `infra/OWNER_RUNBOOK.md`, 18 files under `docs/` (including `docs/legal/` pack), and root docs. *(Minor drift: runbook says `CVRetentionDays=90` vs template `180` and predates `PortalTable`.)* |
| 18 | No Dec 1 countdown on the site | **PRESENT** | Zero `Dec 1` / `December 1` / countdown text or JS in `server.js`, `src/`, and `MyWebApp/src/main/webapp/js/` (verified by regex scan and `tests/stage1.test.js`). Only inert legacy CSS `.countdown-container` / `.countdown` remains in `components.css:L520-545`; `docs/legacy-static/` is not served. |

---

## Step 5: Recovery Leads (Read-Only — Nothing Restored)

### 1. Git Internals (`Edn_Application_Repo/.git`)

| Lead | Location | Date | What It Contains / Missing Features Possibly Inside |
|---|---|---|---|
| **Git Reflog** | `Edn_Application_Repo/.git/logs/` (`git reflog --all`) | 2026-11-01 to 2026-11-25 17:30 | Only shows clone (`b4b8df1`, 2026-11-01), checkout to `feature/private-portal` (`ec48eb9`), commits `0c9d4b0` & `668c396`, and fast-forward merge to `f1105d1`. **No lost newer commits locally.** |
| **Git Stash & Other Branches** | `git stash list`, `git branch -a`, `git tag -l` | — | Empty stash, 0 tags, only `main` & `origin/main` at `f1105d1`. |
| **Unreachable Git Objects (`git fsck --no-reflogs --unreachable`)** | Commits `2c91ca5`, `711a8ba` (+ 5 blobs, 2 trees) in `Edn_Application_Repo/.git/objects` | 2026-10-10 | Obsolete early commits (`Migrate subsciber storage to DynamoDB`, `Track package-lock.json for reproducible Docker builds`, from closed PR `#2`). **Contains none of the missing Nov features (#9, #12, #14, #15).** |

### 2. Other Local Copies, Archives & Assets on This Machine

| Lead | Location | Date | What It Contains / Missing Features Possibly Inside |
|---|---|---|---|
| **Mascot Expression Image Archives (2 copies)** | `C:\Users\handa\Downloads\Compressed\Mascot_facial_expression.zip` and `Mascot_facial_expression_2.zip` | 2026-11-14 09:24 & 2026-11-23 05:10 | Each contains `Face_01.jpg` through `Face_12.jpg` (12 expression images, ~1.23 MB total). **Direct recovery lead for Gap #12 (swappable mascot artwork).** |
| **Parent Workspace Planning & Handover Docs** | `C:\Users\handa\OneDrive\Desktop\work2026\US Guy\{PLAN.md, FEATURE_PLAN.md, REQUIREMENTS_CASSIE_v1.md, TRD.md, AWS_INVENTORY.md, Tutor_Time_Contractor_Handover.pptx, Tutor_Time_Contractor_Handover_Slides.html}` | 2026-10-26 to 2026-10-29 | Design specifications, requirements, and handover decks. Contains text references to consultation/Cassie emails (`FEATURE_PLAN.md`, `PLAN.md`, `REQUIREMENTS_CASSIE_v1.md`, `TRD.md`) and chatbot recommendations (`PLAN.md`, `REQUIREMENTS_CASSIE_v1.md`, `FEATURE_PLAN.md`), useful as specs for rebuilding **#14** and **#15** (no code copies). |
| **Raw Brand Asset Originals & Zips** | `C:\Users\handa\OneDrive\Desktop\work2026\US Guy\assests\` and `C:\Users\handa\Downloads\Compressed\{Popcorn1-1,Popcorn1-2.zip, popcornmaths2-1,popcornmaths2-2.zip}` | 2026-10-28 | Original PDFs and WebP exports for logos/branding. Not missing code. |
| **DMARC Email Report Archive** | `C:\Users\handa\Downloads\Compressed\google.com_tutortime.ai_1795132800_1795219199.zip` | 2026-11-23 04:13 | Single XML DMARC aggregate report for `tutortime.ai` (confirms live mail domain activity; no source code). |
| **Other Local Repo Copies / Build Outputs** | Scanned `work2026`, `Desktop`, `Downloads`, `Documents`, `OneDrive`, `.claude`, `.copilot`, `%TEMP%` | — | **No alternate local clone, zip backup, or dist/build copy of `Edn_Application_Repo` was found.** |

### 3. Antigravity Saved Artifacts, Conversation History & Editor Local File History

| Lead | Location | Date | What It Contains / Missing Features Possibly Inside |
|---|---|---|---|
| **Antigravity CLI Session `2794ab98...`** | `C:\Users\handa\.gemini\antigravity-cli\brain\2794ab98-8f23-45fb-a8fa-a560627b3e4d\` (`implementation_plan.md`, `walkthrough.md`, transcript) & `...\conversations\2794ab98-8f23-45fb-a8fa-a560627b3e4d.db` | 2026-11-25 17:33 | Documents today's PR `#5` merge, branch pruning (`PR #2` closed, `PR #4` & `#5` merged), and page fixes already present in `HEAD` (`f1105d1`). Also notes production domains (`tutortime.ai`, `checkin.tutortime.ai`, `mail.tutortime.ai`) were left untouched. |
| **Antigravity IDE Session `199d146c...`** | `C:\Users\handa\.gemini\antigravity\brain\199d146c-3fb3-49cc-83eb-e10ee888d741\` (`contractor_handover_deck.md`, transcript) & `...\conversations\199d146c-3fb3-49cc-83eb-e10ee888d741.db` | 2026-10-29 10:57 | Early contractor handover deck and transcript discussing consultation emails and chatbot ideas (planning stage, predates Nov code). |
| **Other Antigravity Conversation DBs** | `C:\Users\handa\.gemini\antigravity-cli\conversations\` (5 older `.db` files, Nov 3–24) & `C:\Users\handa\.gemini\antigravity\conversations\` (22 older `.db` files, Oct 16–28) | 2026-10-16 to 2026-11-24 | Binary SQLite databases without matching brain `.md` hits for this repo; **UNVERIFIED** whether any Nov 16–24 `.db` contains lost edits from the missing project folder. |
| **Cursor Local History** | `C:\Users\handa\AppData\Roaming\Cursor\User\History\-6a383965\` | 2026-11-25 17:09 | 1 revision of `Edn_Application_Repo/.env` only (**do not expose**). Zero source-file revisions found. |
| **VS Code & Antigravity IDE Local History** | `%APPDATA%\Code\User\History`, `%APPDATA%\Antigravity\User\History` | — | **0 matched resources** for `Edn_Application_Repo`, `US Guy`, `popcorn`, or `tutortime`. |

### 4. Remote Repository & Deployed Server (Not Connected — How to Check Yourself)

> **Important:** Per strict audit rules, no network connections were made to GitHub or AWS. A newer deployment or unmerged/deleted GitHub branch/PR commit could still exist remotely.

#### A. Check GitHub Remote (`https://github.com/Risky007-dev/Edn_Application_Repo/`)
Run these read-only commands yourself to inspect remote branches, tags, PRs, and orphaned commits on GitHub:
```powershell
# 1. List all remote refs (branches, tags, PR refs) without modifying local git state
git ls-remote https://github.com/Risky007-dev/Edn_Application_Repo/

# 2. If GitHub CLI (gh) is authenticated, inspect all PRs, branches, releases, and recent events/pushes
gh pr list --repo Risky007-dev/Edn_Application_Repo --state all --limit 50
gh api repos/Risky007-dev/Edn_Application_Repo/branches --jq '.[].name'
gh api repos/Risky007-dev/Edn_Application_Repo/events --jq '.[] | select(.type=="PushEvent") | {created_at, ref: .payload.ref, head: .payload.head, commits: [.payload.commits[].message]}'
```
*(In GitHub's web UI, also check **Insights → Network** and **Pull requests → Closed** for any commit SHAs from deleted branches—GitHub often retains dangling PR commits accessible by SHA.)*

#### B. Check Deployed AWS / EC2 / ECS Infrastructure
Based on `infra/tutortime-stack.yaml`, `ecs-task-definition-with-otel.json`, `deploy-to-ecs.ps1`, and session `2794ab98` notes, a deployed instance or container image in `us-east-2` (or `us-east-1`) may hold code from before the original folder was lost. Check read-only:
```powershell
# 1. Check CloudFormation stacks and outputs (us-east-2)
aws cloudformation list-stacks --region us-east-2 --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE
aws cloudformation describe-stacks --region us-east-2 --stack-name tutortime-production-infra --query "Stacks[0].Outputs"

# 2. Check running EC2 instances (including host serving tutortime.ai / checkin.tutortime.ai)
aws ec2 describe-instances --region us-east-2 --query "Reservations[].Instances[].{Id:InstanceId,State:State.Name,IP:PublicIpAddress,Name:Tags[?Key=='Name']|[0].Value}" --output table

# 3. Check ECS services, task definitions, and ECR image push timestamps
aws ecs list-clusters --region us-east-2
aws ecs list-task-definitions --region us-east-2 --sort DESC
aws ecr describe-images --region us-east-2 --repository-name edn-app --query "sort_by(imageDetails,&imagePushedAt)[-5:].{Tags:imageTags,Pushed:imagePushedAt,Digest:imageDigest}"

# 4. If an EC2 server is running the Node app directly, SSH in read-only and check its deployed commit & file list:
# ssh <user>@<server-ip> "cd <app-dir> && git status && git log -n 10 --oneline && ls -la src/"
```

---

## Recommended Order for Restoring or Rebuilding Missing & Partial Features

Before rebuilding, spend 10 minutes running the read-only **GitHub `events`/PR check** and **deployed EC2/ECS check** above in case items #9, #14, or #15 already exist on the live server or in an unmerged GitHub commit. If not found remotely, rebuild in this order (highest launch/runtime risk first):

1. **Fix Deployment & Content Blockers Found in Code (Quick Wins — ~30 min)**
   - Update `Dockerfile` to add `COPY docs ./docs` (otherwise `/privacy` throws `ENOENT` in Docker/ECS) and remove `COPY .env.example ./.env`.
   - Remove the stale `"Online / Virtual Cohort"` entry from `src/shared/content/index.js` (`popcornLocations`) so the Popcorn Math hub no longer contradicts the in-person-only model, and confirm actual school names in `popcornSchools.js`.
   - Reconcile `infra/OWNER_RUNBOOK.md` and `infra/tutortime-stack.yaml` (`CVRetentionDays` 180 vs 90, `PortalTableName` output, optional `ses:GetAccount`/`ses:GetEmailIdentity` IAM actions, portal env vars) and scrub hardcoded account IDs from `ecs-task-definition-with-otel.json`.

2. **Complete Gap #14 — Send Full Consultation Booking Results to Cassie**
   - Update `src/shared/forms/formPipeline.js` to format and email the full structured submission fields (parent name, email, phone, student year group, service interest, notes, plus optional readiness/finder summary) to Cassie's configured inbox (`CASSIE_NOTIFICATION_EMAIL` / `ADMIN_NOTIFICATION_EMAIL` defaulting to `Cassie@tutortime.ai`), with HTML-escaped rendering and support for `EMAIL_DRIVER=ses` independently of `STORAGE_DRIVER` (matching `src/portal/emailService.js`).
   - Optionally allow a sanitized `assessmentSummary` field on `book-consultation` in `src/shared/forms/validators.js` so readiness-check results flow smoothly into Cassie's booking email.

3. **Build Gap #9 — Split Readiness Check into Math and Language Arts**
   - Update `src/shared/content/readiness-questions.js`, `src/shared/templates/pages.js` (`/readiness-check`), and `MyWebApp/src/main/webapp/js/readiness.js` to offer dedicated **Mathematics** and **Language Arts** readiness check tracks (either a clear mode selector on `/readiness-check` and/or `/readiness-check?subject=math|language-arts`, while deciding with Cassie whether to retain Science/Social Studies as optional CPEA tracks or focus strictly on Math & Language Arts).
   - Expand Math and Language Arts question banks if a 10–12 question per-subject check is desired (currently 6 questions per subject).
   - Update `tests/phase2_readiness.test.js` accordingly.

4. **Build Gap #15 — Chatbot Recommending Services Based on Results**
   - Emit/store completed Readiness Check and Service Finder results purely in browser memory / `sessionStorage` (preserving the zero-server-PII rule) and add a `"Discuss my results with Tutor Time Helper"` CTA on both result screens.
   - Extend `MyWebApp/src/main/webapp/js/chatbot.js` and `POST /api/chat` (`src/shared/chatbot/chatController.js`) to accept a validated, non-PII `context` object (e.g., `{ source: 'readiness-check' | 'service-finder', subjectScores, band, finderRecommendation }`).
   - Update `src/shared/chatbot/systemPrompt.js` with explicit, grounded mapping rules so Claude recommends the matching Tutor Time / Popcorn Math services and links (`/services/...`, `/book`) based on the passed scores/results, and add mocked unit tests in `tests/phase2_chatbot.test.js`.

5. **Finish Gap #12 — Complete Swappable Mascot Setup & Install Artwork**
   - Review `C:\Users\handa\Downloads\Compressed\Mascot_facial_expression.zip` / `_2.zip` (`Face_01.jpg`–`Face_12.jpg`) with Cassie to confirm if those are the approved Guide mascot assets; optimize to WebP/PNG under `MyWebApp/src/main/webapp/assets/mascots/` and wire `config.mascots.guide`.
   - Extend `src/shared/config.js` (`mascots.bucket`) and `src/shared/components/mascotBucket.js` to mirror `mascotGuide.js`'s config-driven image/expression swap pattern so both mascots can be swapped via configuration without code edits.

---

*Audit complete. No project files were edited, moved, or deleted outside creating this report. Standing by for your approval before making any code or recovery changes.*
