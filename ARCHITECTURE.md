# System Architecture: Tutor Time with Teacher Cassie & Popcorn Math

**Document:** System Architecture (As-Built Modular Monolith)  
**Status:** As-Built (Stages 1–4 Complete)  
**Repository:** `Edn_Application_Repo`  
**Runtime:** Node.js (v20+) / Express 5  

---

## 1. Executive Summary

The application is structured as a **modular monolith** serving public educational web pages, interactive browser experiences, and secure form ingestion pipelines for **Tutor Time with Teacher Cassie** and its flagship mathematics initiative, **Popcorn Math**.

The architecture prioritizes:
1. **Zero External Runtime Dependencies**: Operates 100% self-contained without external CDNs, third-party font hosting, or external API requirements for core browsing and mini-games.
2. **Pluggable Dual-Driver Storage**: Complete parity between an offline JSON flat-file storage driver (`localDriver.js`) and a cloud production driver (`awsDriver.js`) targeting Amazon DynamoDB, Amazon S3, and Amazon SESv2.
3. **Child & Student Privacy by Default**: Zero storage, zero tracking, and zero cookies on interactive student pages (`/popcorn-maths/game` and `/find-your-programme`). Strict PII redaction on server logs.
4. **Strong Security Posture**: Strict Content Security Policy (CSP), nosniff, frameguard, honeypot bot mitigation, IP rate limiting, and input schema validation with unknown field rejection.

---

## 2. Directory Layout & Module Structure

```
Edn_Application_Repo/
├── server.js                             # Express application entrypoint, route registration & middleware
├── package.json                          # Package configuration and test script runners
├── .env.example                          # Example environment configuration with documentation
│
├── src/                                  # Modular application source code
│   ├── tutoring/                         # Module 1: Personalised Tutoring & Academic Support
│   ├── concierge/                        # Module 2: Concierge Academic Coaching
│   ├── popcorn/                          # Module 3: Popcorn Math
│   ├── specialist-support/               # Module 4: Individualised Learning Support
│   │
│   └── shared/                           # Shared foundational services
│       ├── brand.js                      # Canonical brand definitions, names, slugs, and themes
│       ├── config.js                     # Runtime feature flags (e.g. testimonials disabled)
│       │
│       ├── content/                      # Centralized copy and navigation registry
│       │   ├── index.js                  # Master content registry with PROPOSED-COPY tracking
│       │   └── siteContent.js            # Structured site metadata
│       │
│       ├── forms/                        # Unified form processing pipeline
│       │   ├── formPipeline.js           # Ingestion router, honeypot check, rate limit & storage dispatch
│       │   └── validators.js             # Strict schema validation & unknown field rejection
│       │
│       ├── finder/                       # Smart Service Finder pure mapping logic
│       │   └── serviceFinder.js          # In-memory mapping covering all 84 combinations
│       │
│       ├── game/                         # Popcorn Math mini-game pure logic
│       │   └── popcornGame.js            # Question evaluation, multiplication math, and round tracking
│       │
│       ├── middleware/                   # Security and observability middleware
│       │   ├── logger.js                 # PII-redacting structured request logger
│       │   └── security.js               # Rate limiting and security middleware
│       │
│       ├── storage/                      # Pluggable persistence layer
│       │   ├── index.js                  # Storage factory (dispatches to local or aws driver)
│       │   ├── localDriver.js            # Offline JSON file storage (data/tutortime-submissions.json)
│       │   └── awsDriver.js              # AWS DynamoDB, S3 presigned POST & SESv2 driver
│       │
│       └── templates/                    # Server-side HTML template renderers
│           ├── layout.js                 # Base HTML5 layout, navigation, footer & CSP compliance
│           └── pages.js                  # Page renderers (Home, Services, Game, Finder, Forms)
│
├── MyWebApp/src/main/webapp/             # Public static assets & client-side controllers
│   ├── css/                              # Modular stylesheets
│   │   ├── tokens.css                    # Design tokens (colors, typography, radii, spacing)
│   │   ├── style.css                     # Global base styles, layouts, animations, accessibility
│   │   └── components.css                # Buttons, cards, form inputs, badges
│   ├── js/                               # Client controllers (strictly memory-only)
│   │   ├── game.js                       # Interactive mini-game client controller (zero storage)
│   │   ├── finder.js                     # Smart service finder client controller (zero storage)
│   │   ├── forms.js                      # Client AJAX form submission handler
│   │   └── main.js                       # Accessible navigation drawer & mobile menu
│   └── assets/                           # Official logos and favicon icons
│
├── infra/                                # Infrastructure as Code (DRAFT)
│   ├── tutortime-stack.yaml              # CloudFormation template (DynamoDB, S3, IAM policy)
│   └── OWNER_RUNBOOK.md                  # Deployment and emergency rollback operational runbook
│
├── docs/                                 # Governance & operational documentation
│   ├── COPY_REVIEW.md                    # Registry of all PROPOSED-COPY items for owner approval
│   ├── PLACEHOLDERS.md                   # Inventory of "Details coming soon." stubs
│   └── LAUNCH_BLOCKERS.md                # Comprehensive pre-launch operational checklist
│
├── scripts/                              # Verification and quality check scripts
│   ├── check-todos.js                    # HTTP scanner auditing rendered visible vs hidden markers
│   ├── check-copy.js                     # Registry auditor reporting all PROPOSED-COPY items
│   └── check-syntax.js                   # Node --check syntax validator across all JS files
│
└── tests/                                # Automated test suites (298 assertions)
    ├── stage1.test.js                    # Core routing, security headers, preserved endpoints
    ├── stage2.test.js                    # Page canonical names, form pipeline, rate limit, PII redaction
    ├── stage3.test.js                    # Game logic, finder mapping, zero-storage token scan
    └── stage4.test.js                    # AWS driver with injected mock DynamoDB/S3/SES clients
```

---

## 3. Data Storage & Record Schema

### Unified Storage Record Shape
Both `localDriver.js` and `awsDriver.js` persist records in an identical format, ensuring every personal field is stored once at the top level without redundant nested payloads:

```json
{
  "formType": "SCHOOL_ENQUIRY",
  "createdAt#id": "2026-10-28T10:00:00.000Z#abc123xyz",
  "id": "abc123xyz",
  "createdAt": "2026-10-28T10:00:00.000Z",
  "status": "PENDING_REVIEW",
  "schoolName": "Island Academy",
  "contactPerson": "Sarah Connor",
  "roleTitle": "Head of Mathematics",
  "email": "sconnor@example.edu",
  "phone": "+1 264 497 1234",
  "locationDistrict": "West End",
  "studentAgeGroup": "8-10",
  "estimatedStudentCount": 45,
  "programmeType": "Workshop",
  "targetDate": "November 2026",
  "message": "Looking forward to an interactive math session.",
  "consent": true
}
```

### Table Index Design (DynamoDB)
- **Partition Key (`HASH`)**: `formType` (String) — allows querying all submissions of a specific type (e.g. `SCHOOL_ENQUIRY`, `PRESENTER_APPLICATION`, `BOOK_CONSULTATION`).
- **Sort Key (`RANGE`)**: `createdAt#id` (String) — enables reverse chronological sorting and unique identification.
- **Billing Mode**: `PAY_PER_REQUEST` (On-Demand) — zero idle hourly costs.

---

## 4. Frontend & Interactive Architecture

### 4.1 Server-Rendered Semantic HTML
Pages are rendered server-side using pure JavaScript template functions in `src/shared/templates/pages.js` wrapped by `src/shared/templates/layout.js`. All dynamic values are strictly escaped via `escapeHtml()`.

### 4.2 Popcorn Math Mini-Game (`/popcorn-maths/game`)
- **Pure Evaluation Module**: `src/shared/game/popcornGame.js` contains a bank of 10 verified multiplication questions suited for ages 8–13 ($8 \times 7 = 56$ anchor).
- **In-Memory Client**: `game.js` manages quiz rounds, SVG kernel animations, and aria-live status announcements in memory.
- **Zero Storage Rule**: The script contains zero references to `fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `localStorage`, `sessionStorage`, `indexedDB`, or `document.cookie`.

### 4.3 Smart Service Finder (`/find-your-programme`)
- **Pure Mapping Module**: `src/shared/finder/serviceFinder.js` maps 3 questions (3 year groups $\times$ 7 support areas $\times$ 4 support levels = 84 total combinations) to canonical services.
- **Wording Standard**: Uses canonical "Individualised Learning Support" terminology without medical diagnostic assertions.
- **Allowlist Sanitizer**: Filters `?interest=` URL parameters against an explicit allowlist.

---

## 5. Security & Privacy Controls

1. **Strict Content Security Policy (CSP)**:
   ```
   default-src 'self';
   script-src 'self';
   style-src 'self';
   img-src 'self' data:;
   connect-src 'self';
   object-src 'none';
   base-uri 'self';
   ```
2. **Honeypot Bot Mitigation**: Invisible `_gotcha` field sinks automated spam silently (returns HTTP 200 without writing to storage).
3. **PII Redaction in Logging**: Custom request logger (`logger.js`) ensures applicant email addresses, phone numbers, and full names are never written to server console or disk log files.
4. **Direct-to-S3 Uploads**: Applicant CV PDFs are uploaded directly from the browser to Amazon S3 via presigned POST requests with size (1 byte to 5 MB) and MIME-type (`application/pdf`) enforcement, ensuring the Node.js server never buffers files in memory.
