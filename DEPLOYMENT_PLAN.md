# Tutor Time & Popcorn Math — Approved Zero-VM CloudFormation Deployment Plan

**Document Status:** APPROVED ARCHITECTURE — Templates & Repo Hardening Built Locally (**Zero AWS Resources Created or Modified**)  
**Date:** 2026-11-26  
**Authorised Scope (Approved by Owner / Cassie):**
- **Compute & Edge:** **AWS Lambda (Container Image + AWS Lambda Web Adapter 0.8.4) + Amazon CloudFront** (`us-east-2` compute/data + `us-east-1` ACM edge cert)
- **`popcornmaths.com` Forwarding:** Forwards `popcornmaths.com` & `www.popcornmaths.com` with **HTTP `302` at first** -> `https://tutortime.ai/services/popcorn-math` at the CloudFront edge (zero Lambda cost; 1-parameter update to flip to `301` later). *Replaces earlier "redirect pending" wording.*
- **Staging Environment:** Full isolated staging (`staging.tutortime.ai` + `checkin-staging.tutortime.ai`) with `EMAIL_DRIVER=mock`, `SITE_NOINDEX=true`, `X-Robots-Tag: noindex`, `SHOW_LOCAL_PREVIEW_BANNER=true`, and separate staging DynamoDB tables.
- **Newsletter Persistence:** `/subscribe` & `/subscribers` migrated off ephemeral `subscribers.json` to **Amazon DynamoDB** (`popcorn-maths-subscribers` in prod; `tutortime-staging-subscribers` in staging) while preserving local `subscribers.json` for offline dev & tests.
- **Existing Stack Check:** Read-only AWS audit executed **before** authoring templates (findings below prevented a production CloudFormation table collision!).
- **OTel Lab:** Omitted for now (zero `optional-ecs-otel-lab.yaml`).
- **Safety Gate:** **No AWS deployments, stack updates, DNS changes, or resource creations have been executed.**

---

## 1. Read-Only Live AWS Inspection Results (Verified 2026-11-26)

Checking the existing AWS account (`******2392`, read-only) before choosing the stack design uncovered **5 decisive facts** that shaped every template:

| Verified AWS Asset | Live Read-Only State | Architectural Decision Made Because of This |
|---|---|---|
| **Existing Stack `tutortime-production-infra` (`us-east-2`)** | `CREATE_COMPLETE`. Owns **only 4 resources**: `SubmissionsTable` (`tutortime-submissions`, 0 items, TTL `DISABLED`), `UploadsBucket` (`tutortime-production-infra-uploadsbucket-s0sf7c8ntwfh`), `UploadsBucketPolicy`, and `AppManagedPolicy`. | **Update `tutortime-production-infra` in-place** using `infra/01-data-stack.yaml` with identical Logical IDs (`Replacement: False` on every retained store) to enable TTL (`expireAt`) and upgrade S3 CORS to `https://tutortime.ai` + `https://www.tutortime.ai`. |
| **Existing Unmanaged Tables (`us-east-2`)** | `tutortime-portal` (`ACTIVE`, GSI1, TTL `expiresAt` enabled, **3 items**) and `popcorn-maths-subscribers` (`ACTIVE`, PK `email`, **10 items**) exist **outside CloudFormation**. *(Also `tutortime-mail` & `tutortime-mail-staging` owned by separate mail stacks — untouched!)* | `01-data-stack.yaml` parameterizes `CreatePortalTable` and `CreateSubscribersTable`. **Production sets both to `'false'`** (zero collision with live data, while still exporting `PortalTableName/Arn` and `SubscribersTableName/Arn`!). **Staging sets both to `'true'`** to create fresh isolated staging tables. |
| **Route 53 Hosted Zones** | **Both zones exist:** `tutortime.ai.` (`Z04729501Z8GNOKNPRCKY`, 20 records including critical `MX`/`TXT`/`_dmarc`/DKIM/`mail.tutortime.ai` AND live `A` records on `tutortime.ai` & `checkin.tutortime.ai`) and `popcornmaths.com.` (`Z06398441PSCZ7Z00DXBZ`, 8 records with `A` Alias -> `web-elb` + DKIM CNAMEs). | **Staging** (`staging.tutortime.ai`, `checkin-staging.tutortime.ai`) and **`www.tutortime.ai`** do not exist yet -> safe to create via CFN (`ManageNewSubdomainDnsRecords=true`). **Production live cutover** keeps `ManageLiveDnsRecords=false` during initial deploy so existing VM/ALB `A` records never collide; cutover replaces ONLY the 4 web `A`/`AAAA` records and **never touches mail/MX/TXT/DKIM/DMARC records**. |
| **Amazon SESv2 (`us-east-2`)** | `ProductionAccessEnabled: true` (`50,000/day`). **All 3 domains verified (`SUCCESS`):** `mail.tutortime.ai`, `tutortime.ai`, `popcornmaths.com`. | Stack 02 `LambdaExecutionRole` grants `ses:SendEmail` across all 3 verified domains (built dynamically via `${AWS::AccountId}` — zero hardcoded account IDs!) plus `ses:GetAccount` & `ses:GetEmailIdentity` for portal sandbox guards. |
| **ACM (`us-east-1`), ECR (`us-east-2`), OIDC** | `us-east-1` ACM: `[]` (0 certs). `us-east-2` ECR: `[]` (0 repos). IAM OIDC Providers: `[]` (0 providers). | Stack `03a-edge-cert-stack.yaml` (`us-east-1`) provisions DNS-validated ACM certs automatically via Route 53. Stack `02-security-cicd-stack.yaml` provisions the shared immutable `tutortime-app` ECR repo and passwordless GitHub Actions OIDC Provider + Deploy Role once. |

---

## 2. Approved Architecture Diagram (Zero-VM Lambda + CloudFront)

```text
           Parents, Students, Schools, Teacher Cassie (Anguilla & Global)
                                         │
       ┌─────────────────────────────────┼──────────────────────────────────┐
       ▼                                 ▼                                  ▼
 tutortime.ai / www.*         checkin.tutortime.ai              popcornmaths.com / www.*
 (Public Site + AI Helper)    (Private SIS & Billing)           (Edge 302 -> Popcorn Math)
       └─────────────────────────────────┼──────────────────────────────────┘
                                         ▼  Route 53 Alias Records (Stack 03b)
            ┌────────────────────────────────────────────────────────────┐
            │  Amazon CloudFront Distribution (HTTP/2 & HTTP/3, TLS 1.2) │
            │  • ACM Certificate in us-east-1 (Stack 03a, Auto-DNS-Val)  │
            │  • Edge Viewer-Request Function (cloudfront-js-2.0):       │
            │      1) popcornmaths.com* -> 302 Found (0 Lambda calls!)   │
            │         Location: https://tutortime.ai/services/popcorn-math
            │      2) www.tutortime.ai  -> 301 https://tutortime.ai...   │
            │      3) Copies Host -> X-Forwarded-Host, strips spoofed    │
            │         x-origin-verify                                    │
            │  • Static CDN Cache (/css,/js,/fonts,/assets,/favicon.*):  │
            │      CachingOptimized (fast Caribbean mobile loads!)       │
            │  • Dynamic Routes (*, /api/*, /office/*, /p/*, /subscribe):│
            │      CachingDisabled + AllViewerExceptHostHeader           │
            │  • Injects secret header: X-Origin-Verify (Secrets Manager)│
            │  • Staging adds ResponseHeadersPolicy: X-Robots-Tag noindex│
            └────────────────────────────┬───────────────────────────────┘
                                         │ HTTPS Only + X-Origin-Verify
                                         ▼
            ┌────────────────────────────────────────────────────────────┐
            │  AWS Lambda Container Function (us-east-2, 512 MB, x86_64) │
            │  • Immutable ECR image `tutortime-app:git-<sha>` (Stack 02)│
            │  • Node 24-alpine (USER node) + AWS Lambda Web Adapter     │
            │  • Express 5 monolith (`server.js :5001`) + `docs/legal/`  │
            │  • Blocks direct Lambda URL calls without X-Origin-Verify  │
            │  • Zero local disk writes in AWS mode (read-only /app safe)│
            │  • Optional 5-min EventBridge /health warmer (prod)        │
            └─┬─────────────┬──────────────┬──────────────┬──────────────┘
              │             │              │              │
   IAM Role   ▼             ▼              ▼              ▼
  (Stack 02)  │             │              │              │
   ┌──────────────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────────┐
   │ Amazon DynamoDB  │ │ Amazon S3│ │Amazon SES │ │ Anthropic Claude │
   │ (Stack 01 Retain)│ │(Retain)  │ │   (v2)    │ │ (Haiku 5.5)      │
   │ • submissions    │ │• Private │ │• Prod: ses│ │• Hard console cap│
   │   (+TTL expireAt,│ │• AES256  │ │• Stg: mock│ │• Atomic DynamoDB │
   │    +chatbot cap) │ │• TLS-only│ │• 3 domains│ │  daily cap (200) │
   │ • portal (GSI1)  │ │• 180d exp│ └───────────┘ └──────────────────┘
   │ • subscribers    │ │• CORS    │
   └──────────────────┘ └────▲─────┘
                             │ Direct Browser Presigned POST (PDF <= 5 MB)
                             │ (Allowed by dynamic CSP connect-src in security.js)
                             └──────────── Presenter Applicant Browser
```

---

## 3. Repository Artifacts Built (Ready for Review — Zero AWS Changes Made)

### A. CloudFormation Stacks & Parameter Files (`infra/`)
| File | Region | Purpose |
|---|---|---|
| `infra/01-data-stack.yaml` *(synced to `infra/tutortime-stack.yaml`)* | `us-east-2` | Stateful DynamoDB (`SubmissionsTable` + TTL `expireAt`, conditional `PortalTable` & `SubscribersTable`) + private TLS-only S3 `UploadsBucket` (multi-origin CORS, 180d CV expiry) + `DeletionPolicy: Retain`. Updates existing `tutortime-production-infra` in place with zero replacement. |
| `infra/02-security-cicd-stack.yaml` | `us-east-2` | Shared immutable `tutortime-app` ECR repo (scan-on-push, 15-image retention), 4 Secrets Manager secrets (`anthropic-api-key` placeholder + auto-generated `admin-api-key`, `fault-injection-key`, `origin-verify-secret`), least-privilege `LambdaExecutionRole`, and passwordless GitHub Actions OIDC Provider + `GitHubDeployRole`. |
| `infra/03a-edge-cert-stack.yaml` | `us-east-1` | DNS-validated ACM TLS certificates for CloudFront (Production: 5 SANs across `tutortime.ai` + `popcornmaths.com`; Staging: 2 SANs on `staging.tutortime.ai` + `checkin-staging.tutortime.ai`). |
| `infra/03b-app-stack.yaml` | `us-east-2` | Lambda container function + Function URL + CloudFront Distribution + Edge `viewer-request` function (`302` `popcornmaths.com` forward, `301` `www` redirect, `X-Forwarded-Host`) + Staging `X-Robots-Tag: noindex` policy + optional 5-min warmer + safe conditional Route 53 Alias records. |
| `infra/04-ops-budget-stack.yaml` | `us-east-2` | SNS Alert Topic, $15/mo AWS Budget (80% actual / 100% forecasted), optional Cost Anomaly Detection, CloudWatch Alarms (Lambda errors/throttles/p95 latency, DynamoDB errors, zero-PII log metric filters for booking email failures & chatbot errors/cap), and Ops Dashboard. |
| `infra/params/staging.json` & `infra/params/production.json` | — | Complete non-secret parameter matrices for Staging (`EMAIL_DRIVER=mock`, `SiteNoIndex=true`, `CreatePortalTable=true`, `CreateSubscribersTable=true`) and Production (`EMAIL_DRIVER=ses`, `PopcornRedirectStatusCode=302`, `CreatePortalTable=false`, `CreateSubscribersTable=false`, `ManageLiveDnsRecords=false` until cutover). |
| `infra/OWNER_RUNBOOK.md` | — | Complete zero-VM deploy, Change Set inspection, secret population, zero-downtime DNS cutover, `302 -> 301` flip, rollback, and legacy VM/ALB cleanup runbook. |

### B. Application Hardening & CI/CD Implemented in `Edn_Application_Repo`
1. **`Dockerfile` & `.dockerignore` & `.gitignore`:** Added AWS Lambda Web Adapter `0.8.4`, `COPY docs/legal ./docs/legal`, `COPY scripts/seed-kashamar.js`, `USER node`, `npm ci --omit=dev`; removed `COPY .env.example ./.env`; un-ignored `package-lock.json` so deterministic CI `npm ci` builds work.
2. **`src/shared/middleware/security.js`:** Dynamically appends configured `UPLOADS_BUCKET_NAME` S3 HTTPS endpoints to Helmet CSP `connect-src` so presenter CV presigned POST uploads work in production.
3. **`src/shared/middleware/logger.js`:** Redacts `/p/<token>` parent portal bearer tokens to `/p/[redacted]` and strips query strings before emitting zero-PII JSON logs to CloudWatch.
4. **`src/shared/storage/{localDriver,awsDriver,index}.js` & `server.js`:**
   - Lazy storage initialization (eliminates read-only `/app` `EROFS` crash on AWS Lambda cold start).
   - Added automated data-retention TTL `expireAt` across both drivers (180d presenter, 730d school enquiry, 365d parent forms).
   - Migrated `POST /subscribe` and `GET /subscribers` to DynamoDB (`popcorn-maths-subscribers`) with atomic `attribute_not_exists(email)` duplicate detection when `STORAGE_DRIVER=aws`, preserving local `subscribers.json` offline and honoring `EMAIL_DRIVER=mock` on staging.
   - Added numeric `TRUST_PROXY` hop support, `SITE_NOINDEX` `/robots.txt` support, and `ORIGIN_VERIFY_SECRET` middleware (blocking raw Lambda Function URL bypass with HTTP `403` while exempting `/health` for Lambda Web Adapter).
5. **`src/portal/router.js`:** Added `getEffectiveHost(req)` (trusting `X-Forwarded-Host` from CloudFront when `TRUST_PROXY` is enabled) and configurable `PORTAL_HOST` (`checkin.tutortime.ai` prod / `checkin-staging.tutortime.ai` staging).
6. **`src/shared/chatbot/chatController.js`:** Added atomic DynamoDB daily request counter (`formType='SYSTEM_COUNTER'`, `'createdAt#id'='CHATBOT_DAILY#YYYY-MM-DD'`, 7-day TTL) in AWS mode so Lambda cold starts/concurrent containers cannot bypass `CHATBOT_DAILY_REQUEST_CAP`.
7. **Legacy Hygiene:** Scrubbed hardcoded AWS Account ID from `ecs-task-definition-with-otel.json` and removed obsolete `SENDER_PASSWORD` from `ecs-task-definition.json`.
8. **CI/CD & Verification:** Added `.github/workflows/ci-deploy.yml` (test, `cfn-lint`, container smoke test, Trivy scan, OIDC ECR push, Staging deploy + smoke test, manual-approval Production deploy + smoke test, weekly drift check), `scripts/smoke-test.js`, and `tests/deployment_readiness.test.js` wired into `npm test`.

---

## 4. Estimated Monthly AWS Cost (Approved Lambda + CloudFront Architecture)

| Component | Staging | Production | Notes |
|---|---|---|---|
| **AWS Lambda (512 MB, x86_64)** | ~$0.00 | ~$0.00 – $0.50 | AWS Free Tier (1M req + 400k GB-s/mo); 5-min warmer uses ~8.6k invocations/mo (<1% of free tier). |
| **Amazon CloudFront (`PriceClass_100` + Edge Functions)** | ~$0.00 | ~$0.00 | Always-Free Tier (1 TB data transfer, 10M HTTP req, 2M CF Functions/mo) covers both site & `popcornmaths.com` 302 forward! |
| **ACM TLS Certificates (`us-east-1`)** | $0.00 | $0.00 | Free public TLS certificates with auto-renewal. |
| **DynamoDB (`submissions`, `portal`, `subscribers`)** | <$0.05 | ~$0.25 | On-Demand + PITR on low-volume educational tables. |
| **S3 Private CV Uploads (`cv-uploads/`, 180d lifecycle)** | <$0.01 | <$0.05 | Encrypted private bucket. |
| **Amazon SESv2 (`us-east-2`)** | $0.00 (`mock`) | <$0.10 | $0.10 per 1,000 emails. |
| **AWS Secrets Manager (4 secrets/env)** | $1.60 | $1.60 | $0.40/secret/mo. |
| **Route 53 Hosted Zones (`tutortime.ai` + `popcornmaths.com`)** | *(shared)* | $1.00 | $0.50/zone/mo (already active). |
| **ECR + CloudWatch Logs (30d retention)** | ~$0.10 | ~$0.20 | Lifecycle keeps last 15 immutable images. |
| **Estimated AWS Subtotal** | **~$1.75/mo** | **~$3.20 – $3.70/mo** | **Combined Prod + Staging: ~$5.00 – $5.50/month** *(saves ~$32+/mo vs current idle ~$37.10/mo ALB+VM spend once cleaned up!)* |
| *Anthropic Claude API (separate bill)* | *$0.00 (empty key)* | *$1 – $25/mo* | *Protected by Anthropic Console hard spend cap + atomic DynamoDB 200 req/day guardrail.* |

---

## 5. Next Step (Owner Action Required Before Any Live Deployment)

See **`infra/OWNER_RUNBOOK.md`** for exact copy-paste deployment commands when you are ready to go live:
1. Review and merge `feature/local-completion` into `main` on GitHub.
2. Run first-time bootstrap of Stacks `01` (in-place Change Set on `tutortime-production-infra` verifying `Replacement: False`), `02`, `03a` (`us-east-1`), push first `git-<sha>` image, then deploy Staging (`staging.tutortime.ai`) for Cassie & Abiodun QA.
3. Populate `ANTHROPIC_API_KEY` out-of-band in Secrets Manager (after setting Anthropic Console spend cap).
4. Execute Production cutover (swapping ONLY the 4 web `A` records while keeping all mail/DKIM/DMARC records untouched), verify `popcornmaths.com` `302 -> https://tutortime.ai/services/popcorn-math`, and later flip `PopcornRedirectStatusCode` to `301` once satisfied.
5. After 48–72 hours of clean operation, execute Phase 7 cleanup in `infra/OWNER_RUNBOOK.md` to retire legacy `web-elb` ALB and stopped VMs (~$36+/mo savings).
