# Tutor Time & Popcorn Math — Approved Zero-VM Production CloudFormation Deployment Plan

**Document Status:** APPROVED PRODUCTION-DIRECT ARCHITECTURE  
**Updated:** 2026-11-27  
**Authorised Scope (Approved by Owner / Cassie):**
- **Compute & Edge:** **AWS Lambda (Container Image + AWS Lambda Web Adapter 0.8.4) + Amazon CloudFront** (`us-east-2` compute/data + `us-east-1` ACM edge cert).
- **Direct-to-Production CI/CD:** Every push to `main` automatically runs tests → builds immutable `git-<sha>` image → verifies Stack `01` change set has zero replacements/removals → deploys production → invalidates CloudFront (`/*`) → runs live smoke tests → automatically rolls back to the last known-good image on failure (first deploy stops and reports). **No staging environment, no manual approval gate, one deploy at a time, and pull requests never deploy.**
- **`popcornmaths.com` Forwarding:** Forwards `popcornmaths.com` & `www.popcornmaths.com` with **HTTP `302` at first** → `https://tutortime.ai/services/popcorn-math` at the CloudFront edge (zero Lambda cost; 1-parameter update to flip to `301` later).
- **Anthropic API Key:** Fetched lazily at **runtime from AWS Secrets Manager** (`ANTHROPIC_API_KEY_SECRET_ARN`) with in-memory caching (zero plaintext API key in Lambda env vars; no CloudFormation dynamic reference). If missing or unreadable, **only the chatbot goes offline** (HTTP `503` + offline widget state).
- **Newsletter Persistence:** `/subscribe` & `/subscribers` backed by **Amazon DynamoDB** (`popcorn-maths-subscribers`) in AWS mode while preserving local `subscribers.json` offline.
- **DNS Safety:** `ManageNewSubdomainDnsRecords=false` and `ManageLiveDnsRecords=false` stay permanently `false` in `infra/params/production.json`; web records are cut over atomically via Route 53 `UPSERT` so later pushes can never conflict with or undo live DNS. **Mail DNS (`MX`, `TXT`, `DKIM`, `DMARC`) and mail Lambdas are never touched** *(one owner-approved go-live exception: delete only the stale `A` record on `mail.tutortime.ai` after confirming no MX, CNAME, or SES rule depends on it).*
- **Legacy Cleanup:** **Out of scope** — zero AWS resources or old servers are deleted. *(Note: Read-only audit verified legacy ALB `web-elb` is already deleted.)*
- **OTel Lab:** Omitted (`optional-ecs-otel-lab.yaml` excluded).

---

## 1. Read-Only Live AWS Inspection Results (Verified 2026-11-27)

| Verified AWS Asset | Live Read-Only State | Architectural Decision Made Because of This |
|---|---|---|
| **Existing Stack `tutortime-production-infra` (`us-east-2`)** | `CREATE_COMPLETE`. Owns **4 resources**: `SubmissionsTable` (`tutortime-submissions`, 0 items, TTL `DISABLED`, PITR `ENABLED`), `UploadsBucket` (`tutortime-production-infra-uploadsbucket-s0sf7c8ntwfh`, 0 objects, 180d `cv-uploads/` expiry active, CORS currently `https://popcornmaths.com`), `UploadsBucketPolicy`, and `AppManagedPolicy`. | **Update `tutortime-production-infra` in-place via inspected Change Set** using `infra/01-data-stack.yaml` with identical Logical IDs (`Replacement: False` on every retained store) to enable TTL (`expireAt`) and upgrade S3 CORS to `https://tutortime.ai` + `https://www.tutortime.ai`. CI enforces a hard Change-Set gate failing on any `Remove` or `Replacement`. |
| **Existing Unmanaged Tables (`us-east-2`)** | `tutortime-portal` (`ACTIVE`, `PK`/`SK`, `GSI1`, TTL `expiresAt` `ENABLED`, PITR `ENABLED`, 3 user items) and `popcorn-maths-subscribers` (`ACTIVE`, PK `email`, TTL `DISABLED`, **PITR currently `DISABLED`**, 10 items) exist outside CloudFormation. *(Separate `tutortime-mail` & `tutortime-mail-staging` stacks untouched.)* | `01-data-stack.yaml` sets `CreatePortalTable=false` and `CreateSubscribersTable=false` in production (zero collision, exports all ARNs). Phase 2 preparation takes on-demand backups of all 3 tables and enables PITR on `popcorn-maths-subscribers`. |
| **Lambda Concurrency Quota (`us-east-2`)** | Account limit `ConcurrentExecutions: 10`, `UnreservedConcurrentExecutions: 10` (5 existing functions including live `tutortime-mail-inbound-processor`, all unreserved). | `infra/params/production.json` sets **`LambdaReservedConcurrency: "0"`** (unreserved) so Stack `03b` deploys cleanly without violating AWS's 10-unreserved minimum or starving live mail Lambdas. |
| **Route 53 Hosted Zones & Live Web Records** | `tutortime.ai.` (`Z04729501Z8GNOKNPRCKY`): `tutortime.ai`, `checkin.tutortime.ai`, and `mail.tutortime.ai` currently have legacy `A` records pointing to an old crashed server (HTTP/HTTPS timing out) plus active `MX`/`TXT`/`DMARC`/DKIM records. `popcornmaths.com.` (`Z06398441PSCZ7Z00DXBZ`): `popcornmaths.com` & `www.popcornmaths.com` have dangling `A` Alias records → already-deleted `web-elb` (SOA only / unresolvable) plus DKIM CNAMEs. | Keep `ManageNewSubdomainDnsRecords=false` and `ManageLiveDnsRecords=false` in `infra/params/production.json`. Cut over **only** the approved web records atomically via Route 53 `UPSERT` in Phase 4 (plus remove only the dead `A` record on `mail.tutortime.ai` per owner decision, leaving `MX`, `TXT`, `DKIM`, and `DMARC` untouched). |
| **Amazon SESv2 (`us-east-2`)** | `ProductionAccessEnabled: true`, `SendingEnabled: true`, `HEALTHY`, `50,000/day`. All 3 domains verified with DKIM (`SUCCESS`): `mail.tutortime.ai`, `tutortime.ai`, `popcornmaths.com`. | Stack `02` `LambdaExecutionRole` grants `ses:SendEmail` across all 3 verified domains plus `ses:GetAccount` & `ses:GetEmailIdentity`. |
| **ACM (`us-east-1`), ECR (`us-east-2`), OIDC** | `us-east-1` ACM: `[]`. `us-east-2` ECR: `[]`. IAM OIDC Providers: `[]`. | Stack `03a` (`us-east-1`) provisions DNS-validated ACM cert for all 5 SANs; Stack `02` (`us-east-2`) provisions immutable `tutortime-app` ECR repo and passwordless GitHub Actions OIDC Provider + `GitHubDeployRole`. |

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
                                         ▼  Atomic Route 53 Alias Records (Phase 4)
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
            │      CachingOptimized (invalidated automatically on deploy)│
            │  • Dynamic Routes (*, /api/*, /office/*, /p/*, /subscribe):│
            │      CachingDisabled + AllViewerExceptHostHeader           │
            │  • Injects secret header: X-Origin-Verify (Secrets Manager)│
            └────────────────────────────┬───────────────────────────────┘
                                         │ HTTPS Only + X-Origin-Verify
                                         ▼
            ┌────────────────────────────────────────────────────────────┐
            │  AWS Lambda Container Function (us-east-2, 512 MB, x86_64) │
            │  • Immutable ECR image `tutortime-app:git-<sha>` (Stack 02)│
            │  • Node 24-alpine (USER node) + AWS Lambda Web Adapter     │
            │  • Dual Function URL permissions: InvokeFunctionUrl +      │
            │    InvokeFunction (InvokedViaFunctionUrl: true)            │
            │  • Unreserved concurrency (0) to protect live mail Lambdas │
            │  • Blocks direct Lambda URL calls without X-Origin-Verify  │
            │  • Runtime cached Secrets Manager fetch for Anthropic key  │
            │  • 5-min EventBridge /health warmer                        │
            └─┬─────────────┬──────────────┬──────────────┬──────────────┘
              │             │              │              │
   IAM Role   ▼             ▼              ▼              ▼
  (Stack 02)  │             │              │              │
   ┌──────────────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────────┐
   │ Amazon DynamoDB  │ │ Amazon S3│ │Amazon SES │ │ Secrets Manager  │
   │ (Stack 01 Retain)│ │(Retain)  │ │   (v2)    │ │  -> Anthropic    │
   │ • submissions    │ │• Private │ │• Prod: ses│ │    (Haiku 5.5)   │
   │   (+TTL expireAt,│ │• AES256  │ │• 3 domains│ │• Runtime cached  │
   │    +chatbot cap) │ │• TLS-only│ └───────────┘ │• Atomic DynamoDB │
   │ • portal (GSI1)  │ │• 180d exp│               │  daily cap (200) │
   │ • subscribers    │ │• CORS    │               └──────────────────┘
   └──────────────────┘ └────▲─────┘
                             │ Direct Browser Presigned POST (PDF <= 5 MB)
                             └──────────── Presenter Applicant Browser
```

---

## 3. Repository Artifacts (`infra/` & `.github/workflows/`)

| File | Region | Purpose |
|---|---|---|
| `infra/01-data-stack.yaml` | `us-east-2` | Stateful DynamoDB (`SubmissionsTable` + TTL `expireAt`) + private TLS-only S3 `UploadsBucket` (CORS `tutortime.ai` + `www.tutortime.ai`, 180d CV expiry) + `DeletionPolicy: Retain`. Updates existing `tutortime-production-infra` in-place with zero replacement. |
| `infra/02-security-cicd-stack.yaml` | `us-east-2` | Immutable `tutortime-app` ECR repo (scan-on-push, 15-image retention), 4 Secrets Manager secrets, least-privilege `LambdaExecutionRole`, and passwordless GitHub OIDC Provider + `GitHubDeployRole` (strict `StringEquals` trust on `repo:Risky007-dev/Edn_Application_Repo:ref:refs/heads/main` with zero wildcards and zero GitHub environments; permissions scoped to ECR, safe Stack 01 updates with zero delete actions, Stacks 03a/03b/04, and CloudFront cache invalidation). |
| `infra/03a-edge-cert-stack.yaml` | `us-east-1` | DNS-validated ACM TLS certificate for CloudFront covering all 5 SANs (`tutortime.ai`, `www.tutortime.ai`, `checkin.tutortime.ai`, `popcornmaths.com`, `www.popcornmaths.com`). |
| `infra/03b-app-stack.yaml` | `us-east-2` | Lambda container + Function URL + **both required Function URL permissions** (`InvokeFunctionUrl` & `InvokeFunction` with `InvokedViaFunctionUrl: true`) + runtime `ANTHROPIC_API_KEY_SECRET_ARN` + CloudFront distribution + edge `302` `popcornmaths.com` forward & `301` `www` canonicalization + 5-min warmer + DNS creation disabled (`false`) so pushes never collide with live Route 53 records. |
| `infra/04-ops-budget-stack.yaml` | `us-east-2` | SNS Alert Topic, $15/mo AWS Budget (80% actual / 100% forecasted), CloudWatch Alarms (Lambda errors/throttles/p95 latency, DynamoDB errors, zero-PII log metric filters for booking email failures & chatbot errors/cap), and Ops Dashboard. |
| `infra/params/production.json` | — | Production non-secret parameter matrix (`LambdaReservedConcurrency="0"`, `PopcornRedirectStatusCode="302"`, `ManageNewSubdomainDnsRecords="false"`, `ManageLiveDnsRecords="false"`, `CreatePortalTable="false"`, `CreateSubscribersTable="false"`). |
| `.github/workflows/ci-deploy.yml` | — | Production-direct CI/CD pipeline: PRs validate only; pushes to `main` run tests → build & push ECR image → Stack 01 Change-Set guard (fail on replace/remove) → deploy production (`03b` + `04`) → invalidate CloudFront (`/*`) → live smoke test → automatic rollback to last known-good image on failure (first deploy stops and reports). One deploy at a time; weekly read-only drift check. |
| `infra/OWNER_RUNBOOK.md` | — | End-to-end execution runbook for preparation, backups, DNS exports, pre-merge bootstrap, secret population, PR merge, pre-cutover verification, atomic Route 53 cutover, and rollback. |

---

## 4. Estimated Monthly AWS Cost (Production Lambda + CloudFront)

| Component | Production Estimate | Notes |
|---|---|---|
| **AWS Lambda (512 MB, x86_64)** | ~$0.00 – $0.50 | Free Tier covers 1M req + 400k GB-s/mo; 5-min warmer uses ~8.6k invocations/mo (<1% of free tier). |
| **Amazon CloudFront (`PriceClass_100` + Edge Functions)** | ~$0.00 | Always-Free Tier (1 TB transfer, 10M HTTP req, 2M CF Functions/mo) covers site & `popcornmaths.com` 302 forward. |
| **ACM TLS Certificate (`us-east-1`)** | $0.00 | Free public TLS certificate with auto-renewal. |
| **DynamoDB (`submissions`, `portal`, `subscribers`)** | ~$0.25 | On-Demand + PITR on low-volume educational tables. |
| **S3 Private CV Uploads (`cv-uploads/`, 180d lifecycle)** | <$0.05 | Encrypted private bucket. |
| **Amazon SESv2 (`us-east-2`)** | <$0.10 | $0.10 per 1,000 emails. |
| **AWS Secrets Manager (4 production secrets)** | $1.60 | $0.40/secret/mo. |
| **Route 53 Hosted Zones (`tutortime.ai` + `popcornmaths.com`)** | $1.00 | $0.50/zone/mo (already active). |
| **ECR + CloudWatch Logs (30d retention)** | ~$0.20 | Lifecycle retains last 15 immutable images. |
| **Estimated Production AWS Subtotal** | **~$3.20 – $3.70/mo** | Legacy ALB `web-elb` is already deleted; no old servers are deleted in this rollout. |
| *Anthropic Claude API (separate bill)* | *$1 – $25/mo* | *Protected by Anthropic Console hard spend cap + atomic DynamoDB 200 req/day guardrail.* |

---

## 5. Rollout Summary

See [`infra/OWNER_RUNBOOK.md`](infra/OWNER_RUNBOOK.md) for exact step-by-step commands:
1. **Prepare (Before Merging to `main`):** Back up all 3 DynamoDB tables, enable PITR on `popcorn-maths-subscribers`, export both Route 53 zones, deploy Stack `01` via Change Set (verifying zero replacements/removals), deploy Stack `02` (`us-east-2`) and Stack `03a` (`us-east-1`), set GitHub variable `AWS_DEPLOY_ROLE_ARN` and GitHub secret `OPS_ALERT_EMAIL`, and populate `tutortime/production/anthropic-api-key` out-of-band in Secrets Manager.
2. **Deploy (`ManageLiveDnsRecords=false`):** Merge `feature/local-completion` into `main` via PR, watch CI/CD deploy production, and verify all pages, forms, email, portal, chatbot, and redirects through CloudFront using the real hostnames.
3. **Go Live:** Atomically update only the approved web Route 53 records (never touching `mail.tutortime.ai`, `MX`, `TXT`, `DKIM`, `DMARC`), verify live traffic end-to-end, and prove auto-deploy with one small push to `main`.
