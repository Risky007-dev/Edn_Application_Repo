# Tutor Time / Popcorn Maths — Local Completion Build Report

**Date:** 2026-11-26  
**Repository:** `C:\Users\handa\OneDrive\Desktop\work2026\US Guy\Edn_Application_Repo`  
**Branch:** `feature/local-completion` (5 clean local commits ahead of `main` at `f1105d1`; **not pushed**)  
**Safety Compliance:** Local-only execution — zero deployments, zero AWS/SSH/DNS/Docker actions, zero live emails or live AI API calls, zero `.env` reads/edits, zero new packages installed, zero real photographs committed.

---

## 1. Features Delivered & Local Commits

| Item | Local Commit | Summary of Changes | Key Files |
|---|---|---|---|
| **1. Consultation Results & Form Notifications to Cassie** | `1c78473` | Decoupled `EMAIL_DRIVER` (`mock` \| `ses`) from `STORAGE_DRIVER`; routed notifications to `CASSIE_NOTIFICATION_EMAIL` (falling back to `ADMIN_NOTIFICATION_EMAIL`); formatted full HTML-escaped + plaintext notifications with strict privacy limits on `learning-needs` and `presenter-application`; added server-validated optional `readinessSummary` + opt-in checkbox card on `/book`; isolated email dispatch in `try/catch` so failed emails never lose saved bookings. | `src/shared/email/formNotificationService.js`, `src/shared/forms/formPipeline.js`, `src/shared/forms/validators.js`, `src/shared/templates/pages.js`, `src/shared/content/index.js`, `MyWebApp/src/main/webapp/js/forms.js`, `MyWebApp/src/main/webapp/css/components.css`, `.env.example`, `tests/local_booking_email.test.js` |
| **2. Readiness Check Split by Subject** | `377a9eb` | Split `/readiness-check` into separate **Mathematics** (20 original samples) and **Language Arts** (20 original samples) tracks with an accessible subject picker (`?subject=math` / `?subject=language-arts` supported) drawing 10 randomized questions per session with explanations and sample disclaimer. Preserved Science (6) and Social Studies (6) in code while hiding them from public UI/JSON/sessions. Retained 10-star progress trail, streaks, mascot reactions, 4 bands (`0–4`, `5–6`, `7–8`, `9–10`), printable summary, and zero browser storage. | `src/shared/content/readiness-questions.js`, `src/shared/content/index.js`, `src/shared/templates/pages.js`, `MyWebApp/src/main/webapp/js/readiness.js`, `MyWebApp/src/main/webapp/css/components.css`, `tests/phase2_readiness.test.js` |
| **3. Chatbot & Non-AI Recommendations from Results** | `0cf9225` | Added single configurable rule table (`0–4`: One-on-One Tutoring / Sunday Workshops; `5–6`: Sunday Workshops / One-on-One Tutoring; `7–8`: Sunday Workshops / Seasonal Pop-Ups; `9–10`: Seasonal Pop-Ups / Sunday Workshops) with all visitor copy marked `PROPOSED-COPY` and zero invented dates/availability. Rendered non-AI recommendation card on results screen (works with no API key) and wired **"Talk about my results"** button passing strictly `{ subject, score, band }` in memory to `chatbot.js` & server-validated `POST /api/chat` (rejecting PII/extra keys with HTTP 400 and showing offline recommendation when unconfigured). | `src/shared/readiness/recommendationRules.js`, `src/shared/chatbot/chatController.js`, `src/shared/chatbot/systemPrompt.js`, `src/shared/chatbot/knowledge.json`, `src/shared/content/index.js`, `src/shared/templates/pages.js`, `MyWebApp/src/main/webapp/js/readiness.js`, `MyWebApp/src/main/webapp/js/chatbot.js`, `MyWebApp/src/main/webapp/css/components.css`, `tests/phase2_chatbot.test.js` |
| **4. Dual Swappable Mascots & Local Preview** | `b63a613` | Made both **Guide** (`config.mascots.guide`) and **Popcorn Bucket** (`config.mascots.bucket`) config-swappable via `GUIDE_MASCOT_IMAGE_PATH`, `GUIDE_MASCOT_EXPRESSIONS_DIR`, and `BUCKET_MASCOT_IMAGE_PATH` while keeping inline SVGs as defaults. Copied (never moved) the 4 approved photos from `Downloads\Compressed\Mascot_facial_expression.zip` (`Face_08`→`neutral`, `Face_12`→`happy`, `Face_05`→`thinking`, `Face_01`→`celebrating`; `Face_07` excluded) into `MyWebApp/src/main/webapp/assets/mascots-local-preview/`, excluded via both `.gitignore` and `.dockerignore`. Never used Cassie's photos for the Bucket mascot. | `src/shared/config.js`, `src/shared/components/mascotBucket.js`, `MyWebApp/src/main/webapp/css/components.css`, `.gitignore`, `.dockerignore`, `.env.example`, `docs/MASCOT_SWAP.md`, `tests/phase2_mascots.test.js` |
| **5. Cleanup & Privacy Wording** | `b1187f2` | Removed `"Online / Virtual Cohort"` (`id: 'virtual'`) from `CONTENT.popcornLocations` (4 Anguilla in-person cohorts remain; 0 virtual-cohort runtime hits). Added `PROPOSED-COPY` section `7.3 Readiness Check Result Sharing & Voluntary Booking Attachment` in `docs/legal/CHATBOT_PRIVACY_WORDING.md` (rendered on `/privacy`) and added `tests/local_booking_email.test.js` to `package.json`'s `"test"` script. | `src/shared/content/index.js`, `docs/legal/CHATBOT_PRIVACY_WORDING.md`, `tests/stage5.test.js`, `tests/phase2_legal.test.js`, `package.json` |

### Notification Email Field & Child-Data Privacy Summary (Decision 3)
- **Full HTML-escaped fields sent:**
  - `book-consultation`: `parentName`, `email`, `phone`, `serviceInterest`, `studentYearGroup` *(broad bracket: Early Primary / Upper Primary / Secondary — no child name/DOB)*, `additionalNotes`, `message`, plus parent-opted-in `readinessSummary` (`subject`, `score`, `total`, `band`, optional `recommendedService`).
  - `concierge-application`: `parentName`, `email`, `phone`, `studentYearGroup` *(broad bracket)*, `academicGoals`, `preferredSchedule`.
  - `popcorn-parent-interest`: `parentName`, `email`, `phone`, `contactMethod`, `childGrade` *(Grades 1–5 — child names strictly rejected)*, `preferredSchool`, `message`.
  - `school-enquiry`: `schoolName`, `contactPerson`, `roleTitle`, `email`, `phone`, `locationDistrict`, `studentAgeGroup` *(aggregate cohort `8-10`/`11-13`/`Mixed`)*, `estimatedStudentCount`, `programmeType`, `targetDate`, `message`.
  - `contact`: `fullName`, `email`, `phone`, `subject`, `message` *(adult fields only)*.
- **Strict privacy exclusions enforced:**
  - `learning-needs`: sends **ONLY** submission ID, form type, timestamp, and parent contact details (`parentName`, `email`, `phone`). Strictly omits all 6 student/learning fields (`studentYearGroup`, `learningStrengths`, `areasForSupport`, `areasRequiringSupport`, `academicGoals`, `preferredLearningEnvironment`).
  - `presenter-application`: sends applicant details only; **omits CV attachment, CV storage key (`cvUploadKey`/`cvFileKey`), and any download link** (reports only boolean `CV Uploaded: Yes / No`).

---

## 2. Verification & Test Results

### Automated Test Suites (Isolated Local Mode: `STORAGE_DRIVER=local`, `EMAIL_DRIVER=mock`, Temp Data Files)

| Test Suite / Check | Result | Passed | Failed | Notes |
|---|---|---:|---:|---|
| `tests/stage1.test.js` | **PASS** | 55 | 0 | Unchanged |
| `tests/stage2.test.js` | **PASS** | 74 | 0 | Unchanged |
| `tests/stage3.test.js` | **PASS** | 182 | 0 | Unchanged |
| `tests/stage4.test.js` | **PASS** | 34 | 0 | Unchanged |
| `tests/stage5.test.js` | **PASS** | 56 | 0 | Approved update on L237 (`4` in-person cohorts, no virtual); 1 Windows POSIX `SIGTERM` skip |
| `tests/phase2_local_env.test.js` | **PASS** | 6 | 0 | Unchanged; Playwright headless skip (not installed) |
| `tests/phase2_mascots.test.js` | **PASS** | 31 | 0 | All 25 existing SVG assertions untouched + 6 new Bucket swap / ignore assertions; passes without photo files |
| `tests/phase2_chatbot.test.js` | **PASS** | 49 | 0 | All 36 existing assertions untouched + 13 new rule-table, validation & zero-storage assertions |
| `tests/phase2_readiness.test.js` | **PASS** | 34 | 0 | Approved updates for 20+ Math/LA split, 10-Q sessions, hidden Science/Social Studies |
| `tests/phase2_popcorn.test.js` | **PASS** | 58 | 0 | Unchanged |
| `tests/phase2_legal.test.js` | **PASS** | 11 | 0 | All 10 existing assertions untouched + 1 new result-sharing disclosure assertion |
| `tests/portal.test.js` | **PASS** | 11 | 0 | Unchanged |
| `tests/local_booking_email.test.js` | **PASS** | 33 | 0 | New Item 1 suite (escaping, driver independence, 7-form limits, readinessSummary validation, failure resilience) |
| **Total Automated Assertions** | **PASS** | **634** | **0** | **13/13 suites passed** |
| `scripts/check-syntax.js` | **PASS** | All JS | 0 | Zero syntax errors |
| `scripts/check-copy.js` | **PASS** | 28 items | 0 | All new unapproved wording tracked as `PROPOSED-COPY` |
| `scripts/check-todos.js` | **PASS** | 20 routes | 0 | `0` visible `TODO(` markers; `100` hidden `data-todo`/HTML comment markers |

### Local Desktop (`1280px`) & Mobile (`375px`) Viewport Verification (Headless Chrome CDP)

| Page / Scenario | Desktop (`1280px`) | Mobile (`375px`) | Verified Details |
|---|---|---|---|
| `/book` (with opt-in readiness query) | **PASS** (`1280px`) | **PASS** (rendered; cropped by Chrome min-window on initial non-CDP capture, later CDP emulation verified `375px`) | Opt-in readiness card renders cleanly above consent with checkbox unchecked by default. |
| `/readiness-check` (Subject Picker & Math track) | **PASS** (`1280px`) | **PASS** (`375px`) | Two subject cards (Mathematics & Language Arts only), 10-star trail, sample disclaimer, no Science/Social Studies. |
| `/readiness-check` Results + `"Talk about my results"` | **PASS** (`scrollW=1265/1280`, `overflow=false`) | **PASS** (`scrollW=375/375`, `overflow=false`) | Completed 10-question Math session interactively; verified non-AI recommendation card, zero `localStorage`/`sessionStorage` writes, and offline chatbot drawer handoff. |
| `/` & `/services/popcorn-math` (Default SVGs & Local Mascot Preview) | **PASS** (`scrollW=1265/1280`, `overflow=false`) | **PASS** (`scrollW=375/375`, `overflow=false`) | Both SVG defaults and circular portrait preview (`GUIDE_MASCOT_IMAGE_PATH=/assets/mascots-local-preview/guide-neutral.jpg`) render cleanly; Bucket mascot remains SVG. |
| `/services/popcorn-math` & `/privacy` (Item 5 Cleanup) | **PASS** (`scrollW=1265/1280`, `overflow=false`) | **PASS** (`scrollW=375/375`, `overflow=false`) | No `Online / Virtual Cohort` option; Section `7.3` `PROPOSED-COPY` result-sharing disclosure renders cleanly on `/privacy`. |

---

## 3. Commands to Run Locally (Zero External Calls)

Run from PowerShell (using an isolated temp folder so repository `data/` and `.env` are untouched):

```powershell
# 1. Start the app locally in safe offline/mock mode (default SVG mascots)
$tmp = Join-Path $env:TEMP "tutortime-local-run"
New-Item -ItemType Directory -Path "$tmp\data" -Force | Out-Null
$env:PORT = "5001"
$env:NODE_ENV = "development"
$env:STORAGE_DRIVER = "local"
$env:EMAIL_DRIVER = "mock"
$env:SEND_CONFIRMATIONS = "false"
$env:CASSIE_NOTIFICATION_EMAIL = "Cassie@tutortime.ai"
$env:DATA_DIR = "$tmp\data"
$env:SUBSCRIBERS_DB_FILE = "$tmp\subscribers.json"
$env:PORTAL_DATA_FILE = "$tmp\portal.json"
Remove-Item Env:ANTHROPIC_API_KEY -ErrorAction SilentlyContinue
Push-Location $tmp
node "C:\Users\handa\OneDrive\Desktop\work2026\US Guy\Edn_Application_Repo\server.js"
```

```powershell
# 2. Optional: Preview the 4 gitignored local mascot photos (Guide mascot only)
$env:GUIDE_MASCOT_EXPRESSIONS_DIR = "/assets/mascots-local-preview"
# (Then start node server.js as above; unset GUIDE_MASCOT_EXPRESSIONS_DIR to return to SVG defaults.)
```

```powershell
# 3. Run the complete 13-suite automated test pass (PowerShell-safe without npm.ps1)
$repo = "C:\Users\handa\OneDrive\Desktop\work2026\US Guy\Edn_Application_Repo"
$tmp = Join-Path $env:TEMP "tutortime-test-run"
New-Item -ItemType Directory -Path "$tmp\data" -Force | Out-Null
$env:STORAGE_DRIVER = "local"; $env:EMAIL_DRIVER = "mock"; $env:SEND_CONFIRMATIONS = "false"
$env:DATA_DIR = "$tmp\data"; $env:SUBSCRIBERS_DB_FILE = "$tmp\subscribers.json"; $env:PORTAL_DATA_FILE = "$tmp\portal.json"
Push-Location $repo
foreach ($t in @(
  "tests/stage1.test.js","tests/stage2.test.js","tests/stage3.test.js","tests/stage4.test.js",
  "tests/stage5.test.js","tests/phase2_local_env.test.js","tests/phase2_mascots.test.js",
  "tests/phase2_chatbot.test.js","tests/phase2_readiness.test.js","tests/phase2_popcorn.test.js",
  "tests/phase2_legal.test.js","tests/portal.test.js","tests/local_booking_email.test.js"
)) { node $t; if ($LASTEXITCODE -ne 0) { break } }
node scripts/check-syntax.js
node scripts/check-copy.js
node scripts/check-todos.js
Pop-Location
```

---

## 4. Items Marked `UNVERIFIED`

- **Live Anthropic Claude API (`claude-haiku-5-5`) round-trip:** `UNVERIFIED` (per local-only hard rules, zero live AI API calls were made; `chatController.js` was verified end-to-end with an injected mock Anthropic client).
- **Online browser `"Talk about my results"` turn with a live AI key:** `UNVERIFIED` in live browser against Anthropic (the offline drawer handoff was verified in headless Chrome CDP, and the server-side `POST /api/chat` with `readinessResult` was verified with a mocked Anthropic client).
- **Live AWS SESv2 / DynamoDB / S3 dispatch:** `UNVERIFIED` (per local-only hard rules; verified strictly via injected mock AWS SDK clients).
- **POSIX `SIGTERM` graceful-shutdown child-process test (`tests/stage5.test.js`):** `UNVERIFIED` on Windows (`win32` skips POSIX signal delivery; runs on Linux/macOS).
- **`tests/phase2_local_env.test.js` Playwright viewport block:** `UNVERIFIED` via Playwright because Playwright is not installed (desktop `1280px` and mobile `375px` layouts were verified via local headless Chrome CDP instead).

---

## 5. Owner / Cassie Inputs Still Needed

1. **Review & Approve 28 `PROPOSED-COPY` Items:** Run `node scripts/check-copy.js` to review all proposed wording (including the Readiness Check subject picker copy, the 4-band recommendation rationales for One-on-One Tutoring / Sunday Workshops / Seasonal Pop-Ups, the `/book` opt-in attachment label, and the updated `/privacy` Section 7.3 wording).
2. **Mascot Artwork Approval:**
   - Preview the 4 copied photos in `MyWebApp/src/main/webapp/assets/mascots-local-preview/` (`guide-neutral.jpg`=`Face_08`, `guide-happy.jpg`=`Face_12`, `guide-thinking.jpg`=`Face_05`, `guide-celebrating.jpg`=`Face_01`) with Cassie to decide whether to use approved photos or commission illustrated cartoon versions.
   - Supply illustrated Popcorn Bucket artwork when ready (`BUCKET_MASCOT_IMAGE_PATH` — never photos of Cassie).
3. **Consultation & Email Config:** Confirm final production values for `CASSIE_NOTIFICATION_EMAIL` (placeholder `Cassie@tutortime.ai`) and verified `SENDER_EMAIL` in Amazon SES.
4. **Remaining Content Placeholders:** Confirm Anguilla primary school cohort names in `src/shared/content/popcornSchools.js`, Teacher Cassie's full biography (`/about`), confirmed office hours (`/contact`), downloadable resource packs (`/resources`), and legal counsel sign-off on `/privacy` and `/terms`.
5. **Service Finder Option Wording:** Confirm whether `"Learning support for ADHD or dyslexia"` in `src/shared/finder/serviceFinder.js` / `pages.js` should be softened to align with `brand.js` non-clinical positioning.

---

## 6. Deferred Deployment & Infrastructure Work (Out of Scope)

No Docker, ECS, CloudFormation, DNS, or AWS changes were made in this local build. Before deploying `feature/local-completion` to production:

1. **`Dockerfile`:** Add `COPY docs ./docs` (critical — `/privacy` reads `docs/legal/CHATBOT_PRIVACY_WORDING.md` at runtime and will throw `ENOENT` in a container without it) and remove `COPY .env.example ./.env`.
2. **`ecs-task-definition.json` & `ecs-task-definition-with-otel.json`:** Remove legacy `SENDER_PASSWORD` secret, scrub hardcoded AWS account ID, and wire `STORAGE_DRIVER`, `EMAIL_DRIVER`, `CASSIE_NOTIFICATION_EMAIL`, `DYNAMODB_TABLE_NAME`, `UPLOADS_BUCKET_NAME`, and `PORTAL_*` environment variables.
3. **`infra/tutortime-stack.yaml` & `infra/OWNER_RUNBOOK.md`:** Align `CVRetentionDays` (`180` vs `90`), add `PortalTableName` stack output, optionally add `ses:GetAccount` / `ses:GetEmailIdentity` IAM actions for portal sandbox checks, and update the runbook with portal & `EMAIL_DRIVER` / `CASSIE_NOTIFICATION_EMAIL` setup.
4. **AWS Production Activation:** Verify SES domain/sender identities, request SES production access (out of sandbox), configure `ANTHROPIC_API_KEY` in Secrets Manager, and deploy/merge `feature/local-completion` after review.
