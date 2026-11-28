# Tutor Time / Popcorn Maths — Local Completion Build Plan

**Date:** 2026-11-25  
**Target Repository:** `C:\Users\handa\OneDrive\Desktop\work2026\US Guy\Edn_Application_Repo`  
**Execution Branch (Phase 2):** `feature/local-completion` (branched from `main` at `f1105d1`; local small commits only, no `push`, `reset`, `clean`, or history rewriting)  
**Scope Mode:** **LOCAL ONLY** — zero AWS/cloud/Docker/SSH/DNS actions, zero live emails or live AI API calls, zero `.env` reads/edits, zero new npm packages.

---

## 0. Verification Against `FEATURE_AUDIT.md` & Hard-Rule Inventories

### Code Verification of `FEATURE_AUDIT.md`
Every gap reported in `FEATURE_AUDIT.md` was re-verified directly against source files and all 12 test suites:
- **Item 1 (Booking emails to Cassie):** Confirmed in `src/shared/forms/formPipeline.js:L113-121` — sends only `record.id` to `ADMIN_NOTIFICATION_EMAIL`, routes through `storage.sendNotificationEmail()` (coupled to `STORAGE_DRIVER=aws`), and throws HTTP 500 if email sending fails after saving.
- **Item 2 (Readiness check split):** Confirmed in `src/shared/content/readiness-questions.js` (24 questions across 4 subjects, 6 each) and `MyWebApp/src/main/webapp/js/readiness.js` (single combined 12-question quiz, no subject picker).
- **Item 3 (Chatbot recommendations from results):** Confirmed in `src/shared/chatbot/chatController.js:L116`, `systemPrompt.js`, `js/chatbot.js`, and `js/readiness.js` — zero result handoff or rule-based service recommendations exist.
- **Item 4 (Mascots):** Confirmed in `src/shared/config.js:L36-45`, `mascotGuide.js` (config-swappable), and `mascotBucket.js` (hardcoded inline SVG only). Both Downloads zips were hashed and visually inspected (details in Section 4).
- **Item 5 (Cleanup):** Confirmed `"Online / Virtual Cohort"` at `src/shared/content/index.js:L319-325` and current chatbot privacy block in `docs/legal/CHATBOT_PRIVACY_WORDING.md`.

### Existing Child-Related Fields Inventory (Zero-Expansion Privacy Guard)
Per hard rules, **no child's name or new identifying child data** will be collected or transmitted beyond what existing forms already collect:

| Form / Subsystem | Existing Child-Related Fields | Child Name / DOB Collected? |
|---|---|---|
| `book-consultation` (`validators.js:L49-59`) | `studentYearGroup` (`Early Primary` \| `Upper Primary` \| `Secondary`) | **No** |
| `concierge-application` (`validators.js:L126-135`) | `studentYearGroup` (`Early Primary` \| `Upper Primary` \| `Secondary`) | **No** |
| `learning-needs` (`validators.js:L275-287`) | `studentYearGroup`, `learningStrengths`, `areasForSupport`, `academicGoals`, `preferredLearningEnvironment` (explicit non-clinical notice) | **No** |
| `popcorn-parent-interest` (`validators.js:L503-513`) | `childGrade` (`Grade 1`–`Grade 5` \| `Multiple Grades (Siblings)`), `preferredSchool` | **No** (strictly rejects `childName`) |
| `school-enquiry` (`validators.js:L402-416`) | `studentAgeGroup` (`8-10` \| `11-13` \| `Mixed`), `estimatedStudentCount` (`10`–`500`) | **No** (aggregate cohort only) |
| `contact`, `presenter-application`, `/subscribe` | *(None — adult fields only)* | **No** |
| Private Portal SIS (`/office`, behind scrypt login) | `name`, `gradeLevel`, `notes` (private tutor records; never public) | Private authenticated portal only |
| **New optional attachment (Item 1)** | `readinessSummary`: `{ subject, score, total, band, recommendedService? }` (opt-in by parent on `/book`) | **No** (non-identifying score summary only; rejects unknown keys like `childName`) |

### Existing Tests Affected by Intentional Behaviour Changes (Out of 570 Total)
All 570 existing tests will continue passing, with **only these specific assertions updated due to intentional scope changes**:
1. **`tests/phase2_readiness.test.js` (L27, L32, L52, L56):**
   - Previously asserted `READINESS_QUESTIONS.length === 24`, `6` questions per subject, and `generateQuizSession()` returning `12` questions (3 across 4 subjects).
   - **Why it must change:** Item 2 intentionally expands `Mathematics` and `Language Arts` to `>= 20` original sample questions each (keeping 6 Science & 6 Social Studies hidden in code -> `>= 52` total) and changes sessions to **10 questions for a selected subject** (`Mathematics` or `Language Arts`).
2. **`tests/stage5.test.js` (L237):**
   - Previously asserted `content.popcornLocations.length === 5` ("5 community/virtual cohorts").
   - **Why it must change:** Item 5 intentionally removes `"Online / Virtual Cohort"` (`id: 'virtual'`), leaving `4` in-person Anguilla cohorts.
3. **`tests/phase2_mascots.test.js` (L29–33, L57–60) — *conditional on Question Q4*:**
   - Currently asserts `renderGuideMascot()` with default config renders inline `<svg>` + `TODO(mascot)`.
   - If you choose to activate the copied photos by default in `config.js`, those default-SVG assertions will explicitly pass `assetConfig: { imagePath: null, expressions: null }` to test the SVG fallback while asserting `<img>` rendering under the configured default. If photos remain opt-in via env/config, zero assertions in `phase2_mascots.test.js` need to change.

### Local Desktop & Mobile Viewport Verification Method
Playwright and Puppeteer are not installed (and no packages will be installed). However, **Google Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`)** and **Microsoft Edge** are installed locally. During Phase 2, after each item we will start `server.js` locally in isolated mock mode and use Chrome headless (`--headless=new --screenshot` at `1280×900` desktop and `375×812` mobile) to visually inspect rendered pages and verify layout/overflow; any interactive JS state that cannot be clicked headlessly without a browser driver will be explicitly marked `UNVERIFIED` or verified via automated Node/HTTP tests.

---

## Item 1: Consultation Results to Cassie

### Current Behaviour
- `src/shared/forms/formPipeline.js:L113-121` emails `process.env.ADMIN_NOTIFICATION_EMAIL` (`.env.example:L85` sets `notifications@popcornmaths.com`), with HTML body containing **only** `<p>A new ${formType} submission was received with ID: ${record.id}.</p>` — none of the parent's submitted booking details.
- Email dispatch runs via `storage.sendNotificationEmail()`, so AWS SES is coupled to `STORAGE_DRIVER=aws` and ignores `EMAIL_DRIVER`.
- If `sendNotificationEmail()` throws, the outer `try/catch` returns HTTP 500 even though `storage.saveSubmission()` already persisted the booking.
- `src/shared/forms/validators.js:L49-59` (`BOOK_CONSULTATION_FIELDS`) rejects any readiness summary field as an unknown field (`HTTP 400`).

### Files to Change
- **[NEW] `src/shared/email/formNotificationService.js`** — Standalone notification mailer decoupled from `STORAGE_DRIVER`, selecting driver via `EMAIL_DRIVER` (`mock` | `ses`, defaulting to `mock` unless `EMAIL_DRIVER=ses` or `STORAGE_DRIVER=aws`), with injectable mock/SES client for tests, HTML-escaped structured consultation email formatter (HTML + plaintext), and Reply-To set to the parent's submitted email (when valid).
- **[MODIFY] `src/shared/forms/validators.js`** — Add optional `readinessSummary` to `BOOK_CONSULTATION_FIELDS` with strict server-side validation: plain object containing ONLY allowed keys `{ subject, score, total, band, recommendedService? }`, `subject` ∈ `['Mathematics', 'Language Arts']`, `total === 10`, integer `0 <= score <= 10`, `band` ∈ `['Exam Star', 'Looking Good', 'Getting There', 'Just Starting']` matching the score band, and `recommendedService` (if present) matching allowed service labels. Reject unknown keys (e.g., `childName`).
- **[MODIFY] `src/shared/forms/formPipeline.js`** —
  - Resolve consultation recipient from `process.env.CASSIE_NOTIFICATION_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL`.
  - Send full HTML-escaped booking details (parent name, email, phone, year group, service interest, additional notes/message, and attached readiness summary if provided, plus record ID & timestamp) using `formNotificationService`.
  - Isolate email dispatch in its own `try/catch` **after** `storage.saveSubmission()`: if email fails, log a zero-PII structured error (`event: 'form_notification_email_failed'`, `formType`, `recordId`) and **still return HTTP 201** (`{ success: true, id: record.id, emailQueued: false }`) so the saved booking is never lost.
- **[MODIFY] `src/shared/templates/pages.js`** (`/book`) & **`MyWebApp/src/main/webapp/js/forms.js`** —
  - Render an opt-in "Attach Readiness Check Result" card on `/book` (hidden unless valid `rcSubject`, `rcScore`, `rcTotal`, `rcBand` query parameters are present from `/readiness-check`), displaying the non-identifying summary with a checkbox ("Include this readiness check summary with my consultation request" — `PROPOSED-COPY`). Zero `localStorage`/`sessionStorage`.
  - When checked on submit, include validated `readinessSummary` in the `POST /api/forms/book-consultation` JSON payload; when unchecked, omit it.
- **[MODIFY] `.env.example`** — Add `CASSIE_NOTIFICATION_EMAIL=Cassie@tutortime.ai` placeholder and document `EMAIL_DRIVER=mock` (independent of `STORAGE_DRIVER`).
- **[NEW] `tests/local_booking_email.test.js`** — Automated tests covering full escaped booking email body, XSS-escaping check, `CASSIE_NOTIFICATION_EMAIL` precedence, `EMAIL_DRIVER` independence from `STORAGE_DRIVER`, valid/invalid `readinessSummary` validation (rejecting `childName` and mismatched score/band), and email-failure resilience (booking still saved and HTTP 201 returned).

### Approach
1. Build `formNotificationService.js` mirroring the clean mock/SES separation in `src/portal/emailService.js`, defaulting strictly to `mock` when `EMAIL_DRIVER=mock` or unset in local mode so no real emails are ever sent locally.
2. Escape every user-supplied field via `escapeHtml()` before inserting into HTML email templates; also generate a clean plain-text fallback body.
3. Keep all logging zero-PII (never log parent name, email, phone, or notes).

### Acceptance Criteria
- `POST /api/forms/book-consultation` persists the booking and dispatches an email to `CASSIE_NOTIFICATION_EMAIL` containing all submitted fields (safely HTML-escaped) plus any attached `readinessSummary`.
- `EMAIL_DRIVER=mock` prevents SES calls even if `STORAGE_DRIVER=aws`, and `EMAIL_DRIVER=ses` selects the SES path even when `STORAGE_DRIVER=local` (verified with injected mock SES client; zero live network calls).
- Submitting invalid `readinessSummary` (out-of-range score, wrong band, extra key like `childName`) returns HTTP 400.
- Simulating an email-driver exception still persists the record to storage and returns HTTP 201.
- Existing tests (`stage1`, `stage2`, `stage4`, etc.) continue passing 100%.

### Risks & Mitigations
- **XSS / HTML injection in notification emails:** Mitigated by escaping every field via `escapeHtml()` and testing `<script>` payloads.
- **Accidental live SES call in local tests:** Mitigated by keeping default `EMAIL_DRIVER=mock` and injecting mock SES clients in unit tests.
- **Zero-storage violation if readiness summary used `sessionStorage`:** Avoided completely by passing non-identifying summary via explicit URL query parameters on the `/book` link and making attachment opt-in via checkbox.

---

## Item 2: Readiness Check Split by Subject (Mathematics & Language Arts)

### Current Behaviour
- `src/shared/content/readiness-questions.js` has 24 questions (6 each in `Language Arts`, `Mathematics`, `Science`, `Social Studies`).
- `generateQuizSession()` returns 12 questions (3 from each of the 4 subjects).
- `src/shared/templates/pages.js:L900-962` and `MyWebApp/src/main/webapp/js/readiness.js` immediately launch the combined 4-subject quiz with no subject picker.

### Files to Change
- **[MODIFY] `src/shared/content/readiness-questions.js`** —
  - Keep all 6 existing `Science` (`sci-01`..`sci-06`) and 6 existing `Social Studies` (`ss-01`..`ss-06`) questions in the file (`HIDDEN_SUBJECTS = ['Science', 'Social Studies']`), excluded from active sessions and public page output.
  - Expand `Mathematics` to **20 original primary-level sample questions** (`math-01`..`math-20`: geometry/area/perimeter with inline SVGs, elapsed time, charts/mean, fractions/percentages, distance/speed, word problems, algebra/missing values, ratio, decimals, angles, sequences, measurement — all original, culturally grounded, NOT real exam items).
  - Expand `Language Arts` to **20 original primary-level sample questions** (`la-01`..`la-20`: original short reading passages, literary devices, context vocabulary, punctuation, proverbs, root words/prefixes/suffixes, subject-verb agreement, verb tenses, parts of speech, homophones, sentence structure, inference).
  - Export `ACTIVE_SUBJECTS = ['Mathematics', 'Language Arts']`, `HIDDEN_SUBJECTS = ['Science', 'Social Studies']`, `QUESTIONS_PER_SESSION = 10`, `getActiveQuestions()`, `getQuestionsBySubject(subject)`, `getReadinessBand(score, total = 10)`, and updated `generateQuizSession(subject = 'Mathematics', questions = READINESS_QUESTIONS)` returning **10 randomized questions** for the selected active subject with shuffled options.
- **[MODIFY] `src/shared/templates/pages.js`** (`/readiness-check`, `/resources`) & **`src/shared/content/index.js`** (`readinessCta`, marked `PROPOSED-COPY`) —
  - Update `/readiness-check` to embed **only** active subject questions (`Mathematics` & `Language Arts`) in `#readiness-questions-data` so Science & Social Studies remain hidden in server code.
  - Render an accessible Subject Picker (two cards: **Mathematics** — 10 sample questions & **Language Arts** — 10 sample questions), supporting `?subject=math` or `?subject=language-arts`.
  - Keep `"Sample questions: not an official CPEA paper."` disclaimer pill, guide mascot + speech bubble, star trail (`#readiness-stars-trail`), and feature flag gating (`FEATURES_READINESS_CHECK_ENABLED`).
- **[MODIFY] `MyWebApp/src/main/webapp/js/readiness.js`** & **`MyWebApp/src/main/webapp/css/components.css`** —
  - Add Subject Picker screen -> 10-question quiz flow for selected subject -> preserve 10-star progress trail, streak badges (`🔥 N In a Row!`), mascot reactions (`neutral`, `thinking`, `happy`, `celebrating`), instant feedback explanations, 4 readiness bands (`Exam Star` 9–10, `Looking Good` 7–8, `Getting There` 5–6, `Just Starting` 0–4), printable summary (`window.print()`), "Try Again (New 10 Questions)", and "Switch Subject" button.
  - Zero `localStorage`, `sessionStorage`, or cookies.
- **[MODIFY] `tests/phase2_readiness.test.js`** — Update the 4 intentional assertions (bank size & 10-question subject sessions) and add assertions verifying:
  - Mathematics >= 20 and Language Arts >= 20 valid schema questions.
  - Science (6) and Social Studies (6) are preserved in `READINESS_QUESTIONS` but excluded from rendered `/readiness-check` HTML and active sessions.
  - `generateQuizSession('Mathematics')` returns 10 Math questions; `generateQuizSession('Language Arts')` returns 10 Language Arts questions.
  - Option shuffling preserves exact correct answer text; grading bands map accurately across 0–10.

### Acceptance Criteria
- `/readiness-check` shows a clear Mathematics vs. Language Arts picker with sample-question disclaimer.
- Each session serves exactly 10 randomized questions drawn from 20+ original sample questions for that subject, with educational explanations.
- Science and Social Studies remain in `readiness-questions.js` but do not appear in `/readiness-check` HTML, JSON payload, or active sessions.
- Star trail, streaks, mascot reactions, 4 result bands, and printable summary all work cleanly on desktop and mobile widths.

### Risks & Mitigations
- **Duplicate/ambiguous sample math/English answers:** Mitigated by writing deterministic verification assertions checking 4 unique options per question, valid `correctIndex`, non-empty explanation, and manually verifying every arithmetic solution.
- **Inline SVG / CSP compliance:** All diagrams remain pure inline SVG strings inside JSON data (zero inline `<script>` or event handlers; verified by `stage5.test.js` CSP check).

---

## Item 3: Chatbot Recommendations from Results

### Current Behaviour
- `MyWebApp/src/main/webapp/js/readiness.js` result screen has only Print, Try Again, and plain `/book` link — no recommendation card and no chatbot trigger.
- `MyWebApp/src/main/webapp/js/chatbot.js` sends `{ message, history }` only.
- `src/shared/chatbot/chatController.js:L116` and `systemPrompt.js` have no readiness-result validation or recommendation mapping.

### Proposed Recommendation Rule Table (For Your Approval)

This deterministic rule table lives in a single shared source of truth (`src/shared/readiness/recommendationRules.js` + mirrored constants for client rendering) so the **non-AI result card** and the **Claude chatbot** always give consistent recommendations without inventing prices or dates:

| Score (out of 10) | Band | Subject | Primary Recommendation | Secondary Option | Visitor Summary (`PROPOSED-COPY`) |
|---|---|---|---|---|---|
| **0 – 4** (0–40%) | **Just Starting** 🌱 | Mathematics | **One-on-One Tutoring** (`/services/traditional-tutoring`) | Sunday Workshops (`/book?service=Small%20Group%20Tutoring`) | Dedicated one-on-one tutoring helps build core math foundations step-by-step at your child's own pace, with Sunday workshops as a confidence booster later. |
| **0 – 4** (0–40%) | **Just Starting** 🌱 | Language Arts | **One-on-One Tutoring** (`/services/traditional-tutoring`) | Sunday Workshops (`/book?service=Small%20Group%20Tutoring`) | Focused one-on-one tutoring strengthens reading comprehension, grammar, and writing foundations in a calm, supportive setting. |
| **5 – 6** (50–60%) | **Getting There** 💪 | Mathematics | **One-on-One Tutoring** (`/services/traditional-tutoring`) | Sunday Workshops (`/book?service=Small%20Group%20Tutoring`) | Your child has emerging skills; targeted one-on-one tutoring closes tricky topic gaps quickly, while Sunday workshops build steady fluency. |
| **5 – 6** (50–60%) | **Getting There** 💪 | Language Arts | **One-on-One Tutoring** (`/services/traditional-tutoring`) | Sunday Workshops (`/book?service=Small%20Group%20Tutoring`) | Your child is making steady progress; targeted one-on-one tutoring sharpens comprehension and grammar, paired with Sunday workshops for practice. |
| **7 – 8** (70–80%) | **Looking Good** 🚀 | Mathematics | **Sunday Workshops** (`/book?service=Small%20Group%20Tutoring`) | Seasonal Pop-Ups (`/#holiday-specials`) | Strong foundations are already in place! Regular Sunday workshops refine speed, problem-solving, and test confidence, supported by seasonal pop-ups during school breaks. |
| **7 – 8** (70–80%) | **Looking Good** 🚀 | Language Arts | **Sunday Workshops** (`/book?service=Small%20Group%20Tutoring`) | Seasonal Pop-Ups (`/#holiday-specials`) | Strong literacy habits are taking hold! Regular Sunday workshops deepen comprehension and editing skills, supported by seasonal pop-ups during breaks. |
| **9 – 10** (90–100%) | **Exam Star** 🌟 | Mathematics | **Seasonal Pop-Ups** (`/#holiday-specials`) | Sunday Workshops (`/book?service=Small%20Group%20Tutoring`) | Outstanding work! Short seasonal pop-ups keep skills sharp and stretch higher-order problem solving ahead of exam season. |
| **9 – 10** (90–100%) | **Exam Star** 🌟 | Language Arts | **Seasonal Pop-Ups** (`/#holiday-specials`) | Sunday Workshops (`/book?service=Small%20Group%20Tutoring`) | Outstanding work! Short seasonal pop-ups keep reading, vocabulary, and test-taking momentum high ahead of exam season. |

> **Note on Service Naming:** Because there is no standalone `/sunday-workshops` route yet, Sunday Workshops CTAs point to `/book` (with query pre-fill) and Seasonal Pop-Ups point to `/#holiday-specials` (existing holiday specials section on `/`). Neither quotes any invented dates or prices.

### Files to Change
- **[NEW] `src/shared/readiness/recommendationRules.js`** — Pure, zero-IO module implementing the approved rule table, `getBandForScore(score, total = 10)`, `getRecommendationForResult({ subject, score, band })`, and strict `validateReadinessResultContext(obj)` (validates ONLY `subject`, `score`, `band` — rejects unknown keys, out-of-range scores, and mismatched score/band pairs).
- **[MODIFY] `src/shared/templates/pages.js`** — Embed the serialized recommendation rule map (or pass lightweight config) alongside `/readiness-check` so client rendering stays 100% in sync with server rules.
- **[MODIFY] `MyWebApp/src/main/webapp/js/readiness.js`** —
  - Render the **non-AI Recommendation Card** directly on the results screen (always visible, works without an Anthropic API key).
  - Add **"Talk about my results"** button that dispatches an in-memory `CustomEvent('tt:open-chat-with-results', { detail: { subject, score, band, recommendation } })` — zero `localStorage` / `sessionStorage`.
  - Wire the **"Book a Consultation"** CTA on the results screen to `/book?service=<mapped>&rcSubject=<subject>&rcScore=<score>&rcTotal=10&rcBand=<band>` (opt-in attachment in Item 1).
- **[MODIFY] `MyWebApp/src/main/webapp/js/chatbot.js`** —
  - Listen for `tt:open-chat-with-results`: open chat panel; hold `{ subject, score, band }` in in-memory closure state (`activeReadinessResult`, discarded on page unload/navigation — zero storage).
  - If chat is **available**, automatically submit a friendly starter prompt to `POST /api/chat` with `{ message, history, readinessResult: { subject, score, band } }`.
  - If chat is **offline/unavailable** (`data-chatbot-unavailable="true"`), display the deterministic non-AI recommendation message right inside the chat drawer without calling `/api/chat`.
- **[MODIFY] `src/shared/chatbot/chatController.js`** & **`src/shared/chatbot/systemPrompt.js`** —
  - Validate optional `req.body.readinessResult` via `validateReadinessResultContext()`. Return HTTP 400 on malformed/PII-bearing payloads (e.g., extra `childName` key or score `99`).
  - When valid, append a clean, server-constructed recommendation guidance block (from `recommendationRules.js`) to the system prompt sent to Claude for that turn, instructing Claude to explain the rule-table recommendation (one-on-one tutoring, Sunday workshops, or seasonal pop-ups), encourage the student/parent, and point to `/book` — without inventing prices/dates or asking for personal details.
  - Log ONLY `{ hasReadinessResult: Boolean(...) }` in structured audit logs (zero score/PII persistence).
- **[MODIFY] `tests/phase2_chatbot.test.js`** (adding a new section, preserving all 36 existing assertions) & **`tests/phase2_readiness.test.js`** —
  - Test rule-table outputs for every band (0–4, 5–6, 7–8, 9–10) in both Mathematics and Language Arts.
  - Test `POST /api/chat` with mocked Anthropic client receiving valid `readinessResult` (verifying system prompt receives the exact rule-table primary/secondary services).
  - Test rejection (`HTTP 400`) of invalid `readinessResult` (extra `childName` key, invalid subject like `Science`, mismatched score/band, non-integer score).
  - Test zero-storage invariant (`readiness.js` and `chatbot.js` contain zero `localStorage` / `sessionStorage` / `document.cookie` calls).

### Acceptance Criteria
- Result screen always displays the non-AI service recommendation card (works with no API key).
- Clicking "Talk about my results" opens the chatbot drawer and passes only `{ subject, score, band }` (or shows the offline recommendation cleanly when no API key is configured).
- Server rejects malformed or PII-bearing `readinessResult` payloads with HTTP 400.
- Zero `localStorage`, `sessionStorage`, cookies, or server files store readiness results.

### Risks & Mitigations
- **Prompt injection via `readinessResult`:** Eliminated by strict allowlist validation (`subject` enum, integer `score`, `band` enum matching `score`) — no free-text field from `readinessResult` ever enters the system prompt.
- **Rule drift between client non-AI card and server chatbot:** Mitigated by deriving both from `src/shared/readiness/recommendationRules.js`.

---

## Item 4: Mascot (Downloads Comparison, Expression Mapping & Dual Swappable Config)

### Downloads Zip Comparison (Verified Read-Only)
- **Found in `C:\Users\handa\Downloads\Compressed\`:**
  - `Mascot_facial_expression.zip` (2026-11-14 09:24:52, `1,230,170` bytes) — SHA-256: `7644240C40B5B34C041C68CB2BA7557441DD32144BC12444C86C8AA734042DB8`
  - `Mascot_facial_expression_2.zip` (2026-11-23 05:10:44, `1,230,170` bytes) — SHA-256: `7644240C40B5B34C041C68CB2BA7557441DD32144BC12444C86C8AA734042DB8`
  - **Result:** The two zip files are **byte-for-byte identical**! Each contains 12 `600×750` JPEG portrait photographs (`Face_01.jpg` through `Face_12.jpg`). An unzipped subfolder (`Downloads\Compressed\Mascot_facial_expression\`) also holds 7 of those same 12 files (`Face_01, 03, 06, 07, 10, 11, 12`), all byte-identical to the zips.
- **Important Visual Finding:** All 12 files are **real portrait photographs of Teacher Cassie (Kashamar Lewis)** — not cartoon illustrations and not Popcorn Bucket graphics.

### Visual Inventory of All 12 Files & Proposed Expression Mapping (For Your Approval)

| File | Visual Description | Suitability | Proposed Mapping |
|---|---|---|---|
| **`Face_08.jpg`** | Clean **white-background studio cutout headshot**, blue collared shirt, pearl earrings, warm composed closed-mouth smile | **Best clean default** (only white cutout) | **`neutral`** (and default `imagePath`) |
| **`Face_12.jpg`** | Warm bright smile wearing tortoiseshell glasses, black top, soft neutral background | **Very polished educator look** | **`happy`** *(Alt: `Face_04.jpg` or `Face_09.jpg`)* |
| **`Face_05.jpg`** | Black-rimmed glasses, wide-eyed attentive/curious closed-mouth expression | **Best attentive/curious look** | **`thinking`** *(Alt: `Face_02.jpg` matches `Face_08` blue shirt)* |
| **`Face_01.jpg`** | Big beaming laugh/smile with dimples, hand near chin, bright turquoise water behind | **Most celebratory / joyful** | **`celebrating`** *(Alt: `Face_04.jpg`)* |
| `Face_02.jpg` | Calm serious/attentive expression in car, same blue shirt as `Face_08` | Good backup for `thinking` | *(Backup for `thinking`)* |
| `Face_04.jpg` | Polished smiling portrait, braided hair, green top, hand near cheek | Good backup for `happy`/`celebrating` | *(Backup)* |
| `Face_09.jpg` | Classroom selfie in front of whiteboard, bright smile, dark polo | Authentic teacher vibe | *(Backup for `happy`)* |
| `Face_11.jpg` | Smiling portrait in dark glasses with red bow, stone wall background | Casual portrait | *(Unused)* |
| `Face_06.jpg` | Outdoors wearing baseball cap, calm neutral expression | Casual outdoor | *(Unused)* |
| `Face_10.jpg` | Backlit/hazy portrait with thin glasses, smiling | Lower image sharpness | *(Unused)* |
| `Face_03.jpg` | Sunhat selfie eating a yellow popsicle | Too casual for site avatar | *(Do not use)* |
| `Face_07.jpg` | Playful wink wearing **Elmo & Cookie Monster** headband | **COPYRIGHT / TRADEMARK RISK** | **DO NOT USE** |

### Current Behaviour
- `src/shared/config.js:L36-45` & `src/shared/components/mascotGuide.js` support config-swappable Guide mascot (`GUIDE_MASCOT_IMAGE_PATH` + `expressions` map) with inline SVG fallback.
- `src/shared/components/mascotBucket.js` is hardcoded inline SVG only (no config swap support).
- `MyWebApp/src/main/webapp/assets/mascots/` does not exist yet.

### Files to Change
- **[NEW] `MyWebApp/src/main/webapp/assets/mascots/guide-{neutral,happy,thinking,celebrating}.jpg`** — **Copied** (never moved!) from the approved faces in `Mascot_facial_expression.zip` ONLY after you confirm the mapping and whether to activate them now or keep them opt-in.
- **[MODIFY] `src/shared/config.js`** —
  - Keep `mascots.guide` (`imagePath` via `GUIDE_MASCOT_IMAGE_PATH` / approved default, `expressions` map, `alt`).
  - Add `mascots.bucket` (`imagePath: process.env.BUCKET_MASCOT_IMAGE_PATH || null`, `expressions: null`, `alt: 'Popcorn Math bucket character mascot'`).
- **[MODIFY] `src/shared/components/mascotBucket.js`** —
  - Mirror `mascotGuide.js`: accept `assetConfig = config.mascots?.bucket`, render `<img ... data-expression="..." [data-expressions='...']>` when configured, and fall back to the existing inline SVG Popcorn Bucket when unconfigured.
- **[MODIFY] `MyWebApp/src/main/webapp/css/components.css`** — Ensure `.mascot-guide-img` and `.mascot-bucket-img` use `border-radius: 50%; object-fit: cover; object-position: center 20%;` so `600×750` portrait photos render crisply inside circular badges without stretching.
- **[MODIFY] `.env.example`** — Add `GUIDE_MASCOT_IMAGE_PATH=` and `BUCKET_MASCOT_IMAGE_PATH=` placeholders.
- **[MODIFY] `docs/MASCOT_SWAP.md`** — Document both Guide and Bucket mascot configuration and fallback behavior.
- **[MODIFY] `tests/phase2_mascots.test.js`** — Add tests for `renderBucketMascot` single-image swap, expression-map swap, and inline SVG fallback (plus guide fallback test if photos are enabled by default).

### Acceptance Criteria
- Originals in `Downloads\Compressed\` are untouched (strictly copied, never moved).
- Both `renderGuideMascot` and `renderBucketMascot` render configured images/expression maps when configured and fall back cleanly to their inline SVGs when config is `null`.
- Portrait photos (if enabled) display cleanly without aspect distortion on desktop and mobile widths.

### Risks & Mitigations
- **Third-party IP in `Face_07.jpg`:** Explicitly excluded from ever being copied into the repo.
- **Aspect ratio distortion (`600×750` portrait inside square `width="84" height="84"`):** Mitigated with `object-fit: cover; object-position: center 20%` CSS styling.

---

## Item 5: Cleanup

### Current Behaviour
- `src/shared/content/index.js:L319-325` includes `{ id: 'virtual', name: 'Online / Virtual Cohort', venue: 'Interactive Live Video Classroom', ... }` inside `CONTENT.popcornLocations`, which is rendered in `#popcorn-location-select` on `/services/popcorn-math` (`popcornRebuild.js:L188-191`) — contradicting the in-person-only Popcorn Math model.
- `docs/legal/CHATBOT_PRIVACY_WORDING.md` (rendered on `/privacy`) does not yet disclose:
  1. Transient sharing of non-identifying Readiness Check summaries (`subject`, `score`, `band`) when the visitor clicks "Talk about my results".
  2. Zero browser/server storage of Readiness Check results except when a parent explicitly opts in to attach their summary to a consultation booking.

### Files to Change
- **[MODIFY] `src/shared/content/index.js`** — Remove the `id: 'virtual'` (`Online / Virtual Cohort`) item from `popcornLocations`, leaving the 4 Anguilla in-person locations.
- **[MODIFY] `tests/stage5.test.js:L237`** — Update assertion from `5 community/virtual cohorts` to `4 in-person community cohorts` and explicitly assert no `virtual`/`online` cohort exists.
- **[MODIFY] `docs/legal/CHATBOT_PRIVACY_WORDING.md`** — Update the visitor-facing fenced markdown block rendered on `/privacy` with `PROPOSED-COPY` subsections explaining:
  - Readiness Check zero-storage behaviour (in-memory only; no `localStorage`, `sessionStorage`, cookies, or server database records).
  - Voluntary result sharing with Tutor Time Helper ("Talk about my results" transmits only `subject`, `score`, and `band` transiently to Anthropic's Claude API — no child names or PII).
  - Voluntary parent opt-in to attach a non-identifying readiness summary to a consultation booking sent to Teacher Cassie.
  - Ensure all `tests/phase2_legal.test.js` assertions remain green (preserve `Tutor Time Helper`, `Zero Personal Data Collection`, `Draft, pending review`, `data-todo="legal"`, and avoid banned internal strings like `CONFIDENTIAL` or `TO CONFIRM WITH COUNSEL` inside the visitor block).
- **[MODIFY] `tests/phase2_legal.test.js`** — Add assertions confirming `/privacy` discloses Readiness Check zero-storage, voluntary chatbot result sharing (`subject`, `score`, `band`), and voluntary booking attachment.

### Deferred Deployment & Infrastructure Work (Out of Scope for Local Build)
The following items identified in `FEATURE_AUDIT.md` are **explicitly deferred** (zero Docker/ECS/CloudFormation edits in this local build):
1. **`Dockerfile`:** Add `COPY docs ./docs` (required so `/privacy` does not throw `ENOENT` in containers) and remove `COPY .env.example ./.env`.
2. **`ecs-task-definition.json` & `ecs-task-definition-with-otel.json`:** Remove legacy `SENDER_PASSWORD`, remove hardcoded AWS account ID, and wire `STORAGE_DRIVER`, `EMAIL_DRIVER`, `CASSIE_NOTIFICATION_EMAIL`, `DYNAMODB_TABLE_NAME`, `UPLOADS_BUCKET_NAME`, and `PORTAL_*` environment variables.
3. **`infra/tutortime-stack.yaml` & `infra/OWNER_RUNBOOK.md`:** Align `CVRetentionDays` (`180` vs `90`), add `PortalTableName` output, optionally grant `ses:GetAccount` / `ses:GetEmailIdentity` IAM actions, and add portal runbook instructions.
4. **Live AWS / DNS / SES:** Verify SES domain/identities, exit SES sandbox for live parent/Cassie emails, configure `ANTHROPIC_API_KEY` secret, and deploy to production host.

---

## Questions for Your Approval Before Phase 2

1. **Recommendation Rule Table (Item 3):** Do you approve the 4-band mapping above (`0–4` & `5–6` → One-on-One Tutoring primary / Sunday Workshops secondary; `7–8` → Sunday Workshops primary / Seasonal Pop-Ups secondary; `9–10` → Seasonal Pop-Ups primary / Sunday Workshops secondary), or would you prefer **Getting There (5–6/10)** to recommend **Sunday Workshops** as primary instead?
2. **Mascot Photos vs. Cartoon SVG Default (Item 4):** All 12 files in `Mascot_facial_expression.zip` / `_2.zip` (identical zips) are **real photographs of Teacher Cassie**, not illustrated cartoons (and `Face_07.jpg` contains copyrighted Elmo/Cookie Monster imagery and will be excluded).
   - **Option A (Recommended):** Copy the 4 mapped photos (`Face_08` → `neutral`, `Face_12` → `happy`, `Face_05` → `thinking`, `Face_01` → `celebrating`) into `MyWebApp/src/main/webapp/assets/mascots/`, wire both Guide & Bucket as config-swappable, and **enable the 4 Guide photos by default** (with SVG fallback when disabled).
   - **Option B:** Copy the 4 mapped photos into `assets/mascots/` and wire full config-swap support for both mascots, but **keep inline SVG active by default** (enabled via `GUIDE_MASCOT_IMAGE_PATH` / config flag) until illustrated artwork is ready.
   - *(Also please confirm if you prefer any alternative face swap, e.g., `Face_02` for `thinking` or `Face_04`/`Face_09` for `happy`.)*
3. **Consultation Email Scope (Item 1):** Should `CASSIE_NOTIFICATION_EMAIL` receive full formatted field emails for **`book-consultation` only**, or for **all 7 public forms** (falling back to `ADMIN_NOTIFICATION_EMAIL` if `CASSIE_NOTIFICATION_EMAIL` is unset)? *(Recommended: use `CASSIE_NOTIFICATION_EMAIL || ADMIN_NOTIFICATION_EMAIL` with full escaped field details for `book-consultation`, and also safely format submitted fields for the other forms so Cassie never receives ID-only emails.)*
4. **Test Updates Confirmation:** Please confirm you approve updating the intentional assertions in `tests/phase2_readiness.test.js` (20+ Math/LA bank & 10-question subject sessions) and `tests/stage5.test.js` (4 in-person locations after removing `Online / Virtual Cohort`) as documented above.

---

*End of Phase 1 Plan. Stopping here and awaiting your approval before creating branch `feature/local-completion` or modifying any project files.*
