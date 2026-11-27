# Tutor Time & Popcorn Math — Zero-VM AWS Deployment & Operations Runbook

> **DOCUMENT STATUS:** READY FOR OWNER EXECUTION (Matches [`DEPLOYMENT_PLAN.md`](../DEPLOYMENT_PLAN.md))  
> **TARGET ARCHITECTURE:** Zero-VM **AWS Lambda (Container + AWS Lambda Web Adapter 0.8.4) + Amazon CloudFront** (`us-east-2` compute/data + `us-east-1` edge ACM TLS cert)  
> **SAFETY RULE:** Do **NOT** merge `feature/local-completion` into `main` until **Phase 0–Phase 2 (Backups, DNS Export, Pre-Merge Bootstrap & GitHub Approval Gate)** are complete, because pushing to `main` automatically triggers [`.github/workflows/ci-deploy.yml`](../.github/workflows/ci-deploy.yml).

---

## Table of Contents
1. [Phase 0 — Pre-Flight Backups, DNS Export & Prerequisites](#phase-0--pre-flight-backups-dns-export--prerequisites)
2. [Phase 1 — Bootstrap Core AWS Stacks BEFORE Merging to `main`](#phase-1--bootstrap-core-aws-stacks-before-merging-to-main)
3. [Phase 2 — Configure GitHub Environments (Approval Gate) & Variables](#phase-2--configure-github-environments-approval-gate--variables)
4. [Phase 3 — Merge to `main`, Staging Deploy & QA](#phase-3--merge-to-main-staging-deploy--qa)
5. [Phase 4 — Populate Secrets Out-of-Band & Pre-Cutover Production Deploy](#phase-4--populate-secrets-out-of-band--pre-cutover-production-deploy)
6. [Phase 5 — Minimal-Downtime Production DNS Cutover](#phase-5--minimal-downtime-production-dns-cutover)
7. [Phase 6 — Post-Cutover Verification & `302 -> 301` Redirect Flip](#phase-6--post-cutover-verification--302---301-redirect-flip)
8. [Phase 7 — Rollback Procedures (Zero Data Loss)](#phase-7--rollback-procedures-zero-data-loss)
9. [Phase 8 — Legacy Cleanup (ONLY After Owner Confirmation & Disk Snapshots)](#phase-8--legacy-cleanup-only-after-owner-confirmation--disk-snapshots)

---

## Phase 0 — Pre-Flight Backups, DNS Export & Prerequisites

Before modifying any AWS stack or DNS record, verify your shell identity, confirm pre-flight audit blockers are resolved, and capture full point-in-time backups and Route 53 zone exports.

### 0.1 Confirm AWS Identity & Required CLI Tools
```bash
aws sts get-caller-identity
aws --version
node -v
docker --version
```
Confirm you are authenticated to the target AWS account (`us-east-2` primary workload region, `us-east-1` edge ACM cert region) and **not** running as the root user.

### 0.2 Pre-Flight Checklist (Must All Be Green Before Deploying)
- [ ] **GitHub `production` Environment Protection:** Create the `production` environment with **Required reviewers** in GitHub Settings *before* merging to `main` (see Phase 2).
- [ ] **Lambda Account Concurrency Quota (`us-east-2`):** Verify `aws lambda get-account-settings --region us-east-2` has enough headroom above the 10-unreserved minimum for `LambdaReservedConcurrency` in `infra/params/*.json` (or set `LambdaReservedConcurrency=0` until AWS approves a concurrency quota increase so live mail Lambdas are never starved).
- [ ] **Function URL Dual Permissions (`03b-app-stack.yaml`):** Confirm both `lambda:InvokeFunctionUrl` (`FunctionUrlAuthType: NONE`) and `lambda:InvokeFunction` (`InvokedViaFunctionUrl: true`) permissions are present in `infra/03b-app-stack.yaml` before deploying Stack `03b`.
- [ ] **Anthropic Spend Cap:** Set a hard monthly spend limit in the Anthropic Console before generating any API key.
- [ ] **SES Production Access (`us-east-2`):** Confirm `ProductionAccessEnabled: true` and verified DKIM on `mail.tutortime.ai`, `tutortime.ai`, and `popcornmaths.com`:
  ```bash
  aws sesv2 get-account --region us-east-2 --query "{Prod:ProductionAccessEnabled,Sending:SendingEnabled,Status:EnforcementStatus,Quota:SendQuota}"
  aws sesv2 list-email-identities --region us-east-2
  ```
- [ ] **Confirm External Web Target (`184.73.129.137`):** Before Phase 5 cutover, confirm with the owner what currently runs on `184.73.129.137` (pointed to by `tutortime.ai`, `checkin.tutortime.ai`, and `mail.tutortime.ai`). **Never modify `mail.tutortime.ai` or any `MX`/`TXT`/`DKIM`/`DMARC` record.**

### 0.3 On-Demand DynamoDB Backups & PITR Verification
Take explicit on-demand backups of all three production DynamoDB tables and verify PITR status before touching Stack `01`:
```bash
STAMP=$(date -u +"%Y%m%d-%H%M%S")

for TABLE in tutortime-submissions tutortime-portal popcorn-maths-subscribers; do
  echo "Backing up ${TABLE}..."
  aws dynamodb create-backup \
    --region us-east-2 \
    --table-name "$TABLE" \
    --backup-name "${TABLE}-pre-deploy-${STAMP}"
done

# Enable PITR on popcorn-maths-subscribers if currently DISABLED (owner-approved one-time hardening)
aws dynamodb describe-continuous-backups \
  --region us-east-2 \
  --table-name popcorn-maths-subscribers \
  --query "ContinuousBackupsDescription.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus"
# If DISABLED:
# aws dynamodb update-continuous-backups \
#   --region us-east-2 \
#   --table-name popcorn-maths-subscribers \
#   --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

### 0.4 Export Full Route 53 DNS Zone Backups (Mandatory Before Any DNS Work)
Save complete JSON snapshots of both hosted zones locally (outside the Git repo, e.g., `~/tutortime-dns-backups/`) so every record can be restored verbatim if needed:
```bash
mkdir -p "$HOME/tutortime-dns-backups"
STAMP=$(date -u +"%Y%m%d-%H%M%S")

aws route53 list-resource-record-sets \
  --hosted-zone-id Z04729501Z8GNOKNPRCKY \
  > "$HOME/tutortime-dns-backups/tutortime.ai-${STAMP}.json"

aws route53 list-resource-record-sets \
  --hosted-zone-id Z06398441PSCZ7Z00DXBZ \
  > "$HOME/tutortime-dns-backups/popcornmaths.com-${STAMP}.json"

ls -lh "$HOME/tutortime-dns-backups/"
```

### 0.5 Validate All CloudFormation Templates Locally
```bash
for tpl in \
  infra/01-data-stack.yaml \
  infra/02-security-cicd-stack.yaml \
  infra/03a-edge-cert-stack.yaml \
  infra/03b-app-stack.yaml \
  infra/04-ops-budget-stack.yaml; do
  echo "Validating ${tpl}..."
  aws cloudformation validate-template --region us-east-2 --template-body "file://${tpl}" > /dev/null
done
echo "All 5 templates validated cleanly."
```

---

## Phase 1 — Bootstrap Core AWS Stacks BEFORE Merging to `main`

**Why bootstrap BEFORE merging to `main`?**
- `infra/params/staging.json` sets `CreateEcrRepository=false`, `CreateGitHubOidcProvider=false`, and `CreateGitHubDeployRole=false` because **Production Stack `02`** owns those shared account-level resources (`tutortime-app` ECR repo, GitHub OIDC provider, and `GitHubDeployRole`).
- Production Stack `02` imports DynamoDB/S3 exports from Production Stack `01` (`tutortime-production-infra`).
- Therefore, the mandatory first-time bootstrap order is:
  **Prod Stack `01` (Change Set!) → Prod Stack `02` → GitHub Environments & Variables (Phase 2) → Merge to `main` (Phase 3).**

Helper function to convert `infra/params/*.json` entries into CLI `--parameter-overrides`:
```bash
to_overrides() {
  local file="$1"
  local section="$2"
  node -e "const p=require('./${file}')['${section}'].parameters; console.log(Object.entries(p).map(([k,v])=>k+'='+v).join(' '));"
}
```

### 1.1 Production Stack `01` (`tutortime-production-infra`) — Mandatory Change-Set Inspection
Because `tutortime-production-infra` already exists in `us-east-2` and owns `SubmissionsTable`, `UploadsBucket`, `UploadsBucketPolicy`, and `AppManagedPolicy` — while `tutortime-portal` (3 items) and `popcorn-maths-subscribers` (10 items) live outside CloudFormation — **always create and inspect a Change Set first** and verify **`Replacement: False`** on every data resource:

```bash
CS_NAME="tutortime-data-in-place-$(date -u +%Y%m%d%H%M%S)"

aws cloudformation create-change-set \
  --region us-east-2 \
  --stack-name tutortime-production-infra \
  --change-set-name "$CS_NAME" \
  --change-set-type UPDATE \
  --template-body file://infra/01-data-stack.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameters $(node -e "const p=require('./infra/params/production.json').dataStack.parameters; console.log(JSON.stringify(Object.entries(p).map(([k,v])=>({ParameterKey:k,ParameterValue:String(v)}))));")

aws cloudformation wait change-set-create-complete \
  --region us-east-2 \
  --stack-name tutortime-production-infra \
  --change-set-name "$CS_NAME"

# INSPECT EVERY CHANGE — STOP IMMEDIATELY IF ANY ResourceChange SHOWS Replacement=True OR Action=Remove!
aws cloudformation describe-change-set \
  --region us-east-2 \
  --stack-name tutortime-production-infra \
  --change-set-name "$CS_NAME" \
  --query "Changes[].ResourceChange.{Action:Action,LogicalId:LogicalResourceId,Type:ResourceType,Replacement:Replacement,Scope:Scope}" \
  --output table
```

**Expected Change-Set Result:**
- `SubmissionsTable`: `Action: Modify`, **`Replacement: False`** (enables TTL on `expireAt`).
- `UploadsBucket`: `Action: Modify`, **`Replacement: False`** (updates CORS to `https://tutortime.ai` + `https://www.tutortime.ai`, keeps `CVRetentionDays=180`).
- `AppManagedPolicy`: `Action: Modify`, **`Replacement: False`** (adds scoped Portal, Subscribers, and SES read permissions).
- `PortalTable` & `SubscribersTable`: **Not created** (`CreatePortalTable=false`, `CreateSubscribersTable=false`), zero collision with live tables, while outputs/exports are added cleanly.

Only after verifying **`Replacement: False`** on every retained store, execute the Change Set:
```bash
aws cloudformation execute-change-set \
  --region us-east-2 \
  --stack-name tutortime-production-infra \
  --change-set-name "$CS_NAME"

aws cloudformation wait stack-update-complete \
  --region us-east-2 \
  --stack-name tutortime-production-infra

aws cloudformation describe-stacks \
  --region us-east-2 \
  --stack-name tutortime-production-infra \
  --query "Stacks[0].Outputs" \
  --output table
```

### 1.2 Production Stack `02` (`tutortime-production-security`) — Shared ECR, Secrets & GitHub OIDC
Deploys the shared immutable `tutortime-app` ECR repository, Production Secrets Manager shells (`anthropic-api-key` + auto-generated `admin-api-key`, `fault-injection-key`, `origin-verify-secret`), `LambdaExecutionRole`, GitHub OIDC provider, and `GitHubDeployRole`:

```bash
aws cloudformation deploy \
  --region us-east-2 \
  --stack-name tutortime-production-security \
  --template-file infra/02-security-cicd-stack.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset \
  --parameter-overrides $(to_overrides infra/params/production.json securityStack)

# Capture GitHubDeployRoleArn for Phase 2
aws cloudformation describe-stacks \
  --region us-east-2 \
  --stack-name tutortime-production-security \
  --query "Stacks[0].Outputs" \
  --output table
```

### 1.3 (Optional Pre-Merge) Pre-Provision Edge ACM Certificates (`us-east-1`)
Stack `03a` auto-validates via Route 53 CNAMEs and does not touch any `A`/`MX`/`TXT`/`DKIM`/`DMARC` records. Running it before merging speeds up the first CI deploy (DNS validation takes ~2–5 minutes):

```bash
# Staging ACM cert (us-east-1): staging.tutortime.ai + checkin-staging.tutortime.ai
aws cloudformation deploy \
  --region us-east-1 \
  --stack-name tutortime-staging-edge-cert \
  --template-file infra/03a-edge-cert-stack.yaml \
  --no-fail-on-empty-changeset \
  --parameter-overrides $(to_overrides infra/params/staging.json edgeCertStack)

# Production ACM cert (us-east-1): tutortime.ai, www.tutortime.ai, checkin.tutortime.ai, popcornmaths.com, www.popcornmaths.com
aws cloudformation deploy \
  --region us-east-1 \
  --stack-name tutortime-production-edge-cert \
  --template-file infra/03a-edge-cert-stack.yaml \
  --no-fail-on-empty-changeset \
  --parameter-overrides $(to_overrides infra/params/production.json edgeCertStack)
```

---

## Phase 2 — Configure GitHub Environments (Approval Gate) & Variables

Complete **all three** items in GitHub (`Risky007-dev/Edn_Application_Repo` → **Settings**) **BEFORE merging to `main`**:

1. **Create `staging` Environment** (**Settings → Environments → New environment → `staging`**):
   - Deployment branches: restrict to `main` (optional recommended guardrail).
2. **Create `production` Environment with Mandatory Approval Gate** (**Settings → Environments → New environment → `production`**):
   - Enable **Required reviewers** and add the repo/business owner (e.g., `Risky007-dev`).
   - Set **Deployment branches and tags** → **Selected branches** → `main` only.
   - *(Verify note: GitHub enforces required reviewers on public repositories on all plans and on private repositories only on Pro/Team/Enterprise. Confirm the environment shows `Required reviewers` active before merging!)*
3. **Set Repository Variables** (**Settings → Secrets and variables → Actions → Variables**):
   - `AWS_DEPLOY_ROLE_ARN` = `GitHubDeployRoleArn` output from `tutortime-production-security` (Phase 1.2).
   - `OPS_ALERT_EMAIL` = Owner email address for CloudWatch alarms, SNS ops alerts, and the $15/mo AWS Budget notifications.
   - *(Confirm zero static `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` exist in GitHub Secrets — deployment uses passwordless OIDC only.)*
4. **Enable Branch Protection on `main`** (**Settings → Branches / Rulesets**):
   - Require pull requests and passing `Test, CFN Lint & Container Smoke Check` status check before merging to `main`.

---

## Phase 3 — Merge to `main`, Staging Deploy & QA

1. Open a Pull Request from `feature/local-completion` → `main` and confirm the PR check (`validate-and-test`: syntax, 15 automated test suites, `check:copy`, `cfn-lint`, hardcoded-secret check, Docker container smoke test, Trivy scan) passes green.
2. Merge the PR into `main`.
3. Watch [`.github/workflows/ci-deploy.yml`](../.github/workflows/ci-deploy.yml) execute automatically:
   - `validate-and-test` → passes.
   - `build-and-push` → builds and pushes immutable `tutortime-app:git-<12-char-sha>` to ECR via OIDC.
   - `deploy-staging` → deploys Staging Stacks `01 → 02 → 03a → 03b → 04` (`staging.tutortime.ai` & `checkin-staging.tutortime.ai`, `EMAIL_DRIVER=mock`, `SITE_NOINDEX=true`, `X-Robots-Tag: noindex`, preview banner enabled) and runs `scripts/smoke-test.js`.
   - `deploy-production` → **pauses at the manual owner approval gate**! Do **not** approve until Staging QA passes and Phase 4 secrets are ready.
4. **Confirm SNS Alert Subscription:** Check `OPS_ALERT_EMAIL` inbox and click **Confirm subscription** on the AWS SNS confirmation email for Staging ops alerts.
5. **Run Owner / Teacher Cassie QA on Staging:**
   - Public site: `https://staging.tutortime.ai` (confirm preview banner shows, `robots.txt` has `Disallow: /`, `X-Robots-Tag: noindex` header present).
   - Forms (`/book`, `/contact`, `/popcorn-math/presenters` PDF CV presigned POST upload): confirm DynamoDB items land in `tutortime-staging-submissions` with integer `expireAt` TTL and `EMAIL_DRIVER=mock` sends zero external emails.
   - Newsletter (`/subscribe`): confirm items persist in `tutortime-staging-subscribers` and duplicate returns HTTP `409`.
   - Private portal (`https://checkin-staging.tutortime.ai`): seed test tutor if needed, verify login, roll-call, invoice print, and `/p/<token>` parent link (confirm CloudWatch logs redact `/p/[redacted]`).
   - Readiness Check (`/readiness-check`) & AI Helper: verify Mathematics & Language Arts tracks, non-AI recommendation card, and (if a capped staging Anthropic key is configured) `/api/chat`.

---

## Phase 4 — Populate Secrets Out-of-Band & Pre-Cutover Production Deploy

### 4.1 Populate Anthropic API Key Out-of-Band (Never in Git or CloudFormation Params)
1. In the **Anthropic Console**, set a hard monthly spend cap first, then generate a scoped API key.
2. Store the key directly in AWS Secrets Manager (`us-east-2`):
   ```bash
   # Production Anthropic key
   aws secretsmanager put-secret-value \
     --region us-east-2 \
     --secret-id tutortime/production/anthropic-api-key \
     --secret-string '{"value":"YOUR_CAPPED_ANTHROPIC_API_KEY"}'
   ```
   *(If you also want live chatbot QA on Staging, populate `tutortime/staging/anthropic-api-key` with a separate low-capped key and re-run `deploy-staging` so the Lambda picks up the updated value — or once runtime Secrets Manager loading is enabled, Lambda reads it dynamically without redeploying.)*

### 4.2 Approve Pre-Cutover Production Deploy (`ManageLiveDnsRecords=false`)
1. Verify in [`infra/params/production.json`](params/production.json) that `ManageLiveDnsRecords` is still **`"false"`** and `PopcornRedirectStatusCode` is **`"302"`**.
2. Approve the waiting `deploy-production` job in GitHub Actions.
   - Promotes the **exact same immutable `git-<sha>` image** verified on Staging across Production Stacks `01 → 02 → 03a → 03b → 04`.
   - Creates `www.tutortime.ai` (`ManageNewSubdomainDnsRecords=true`), which did not previously exist, while leaving all 4 existing live web `A` records and all mail DNS records untouched.
   - Runs automated smoke tests against the CloudFront distribution domain (`https://<cf-domain>.cloudfront.net`).
3. Confirm `OPS_ALERT_EMAIL` SNS subscription for Production ops alerts and verify the `$15/mo` AWS Budget (`TutorTime-Monthly-Spend-Cap`) exists in AWS Budgets.
4. **Pre-Cutover Verification via CloudFront Domain (Zero Live Impact):**
   ```bash
   CF_DOMAIN=$(aws cloudformation describe-stacks --region us-east-2 \
     --stack-name tutortime-production-app \
     --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomainName'].OutputValue" --output text)

   # 1. Verify direct Lambda Function URL bypass is blocked (HTTP 403)
   FN_URL=$(aws cloudformation describe-stacks --region us-east-2 \
     --stack-name tutortime-production-app \
     --query "Stacks[0].Outputs[?OutputKey=='AppFunctionUrlEndpoint'].OutputValue" --output text)
   curl -sS -o /dev/null -w "Direct Lambda URL (expect 403): %{http_code}\n" "${FN_URL}"

   # 2. Verify public site, portal routing, and popcornmaths.com 302 edge forward via CloudFront
   curl -sSI --resolve "tutortime.ai:443:$(dig +short ${CF_DOMAIN} | head -n1)" "https://tutortime.ai/health"
   curl -sSI --resolve "checkin.tutortime.ai:443:$(dig +short ${CF_DOMAIN} | head -n1)" "https://checkin.tutortime.ai/"
   curl -sSI --resolve "popcornmaths.com:443:$(dig +short ${CF_DOMAIN} | head -n1)" "https://popcornmaths.com/"
   # Expect: HTTP/2 302 + location: https://tutortime.ai/services/popcorn-math
   ```

---

## Phase 5 — Minimal-Downtime Production DNS Cutover

**Why not simply flip `ManageLiveDnsRecords=true` immediately?**
CloudFormation `AWS::Route53::RecordSetGroup` **fails with `AlreadyExists`** if an unmanaged Route 53 `A` record already exists with the same name (`tutortime.ai`, `checkin.tutortime.ai`, `popcornmaths.com`, `www.popcornmaths.com`). Conversely, manually deleting the records first and waiting for a full CloudFormation deploy creates an avoidable minutes-long DNS gap.

**Minimal-Downtime Cutover Procedure (~0 seconds DNS gap using atomic Route 53 `UPSERT` first, then optional CFN adoption):**

### 5.1 Pre-Cutover Confirmation
- Confirm Phase 0.4 DNS zone backups exist in `$HOME/tutortime-dns-backups/`.
- Confirm **only** the 4 web `A` records below are touched. **NEVER touch** `MX`, `TXT` (SPF/DMARC), `_domainkey` DKIM `CNAME`s, `bounce.tutortime.ai`, `inbound-test.tutortime.ai`, or `mail.tutortime.ai`!

### 5.2 Atomic Zero-Downtime `UPSERT` to CloudFront Alias (`tutortime.ai` & `popcornmaths.com`)
```bash
CF_DOMAIN=$(aws cloudformation describe-stacks --region us-east-2 \
  --stack-name tutortime-production-app \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomainName'].OutputValue" --output text)

# 1. Atomically UPSERT tutortime.ai & checkin.tutortime.ai (A + AAAA) -> CloudFront
#    Does NOT touch mail.tutortime.ai, MX, TXT, DMARC, or DKIM records!
cat << EOF > /tmp/cutover-tutortime.json
{
  "Comment": "Atomic zero-downtime cutover of tutortime.ai & checkin.tutortime.ai web A/AAAA to CloudFront",
  "Changes": [
    { "Action": "UPSERT", "ResourceRecordSet": { "Name": "tutortime.ai.", "Type": "A",    "AliasTarget": { "HostedZoneId": "Z2FDTNDATAQYW2", "DNSName": "${CF_DOMAIN}.", "EvaluateTargetHealth": false } } },
    { "Action": "UPSERT", "ResourceRecordSet": { "Name": "tutortime.ai.", "Type": "AAAA", "AliasTarget": { "HostedZoneId": "Z2FDTNDATAQYW2", "DNSName": "${CF_DOMAIN}.", "EvaluateTargetHealth": false } } },
    { "Action": "UPSERT", "ResourceRecordSet": { "Name": "checkin.tutortime.ai.", "Type": "A",    "AliasTarget": { "HostedZoneId": "Z2FDTNDATAQYW2", "DNSName": "${CF_DOMAIN}.", "EvaluateTargetHealth": false } } },
    { "Action": "UPSERT", "ResourceRecordSet": { "Name": "checkin.tutortime.ai.", "Type": "AAAA", "AliasTarget": { "HostedZoneId": "Z2FDTNDATAQYW2", "DNSName": "${CF_DOMAIN}.", "EvaluateTargetHealth": false } } }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id Z04729501Z8GNOKNPRCKY \
  --change-batch file:///tmp/cutover-tutortime.json

# 2. Atomically UPSERT popcornmaths.com & www.popcornmaths.com (A + AAAA) -> CloudFront (edge 302 forward)
#    Does NOT touch DKIM CNAMEs!
cat << EOF > /tmp/cutover-popcorn.json
{
  "Comment": "Atomic zero-downtime cutover of popcornmaths.com & www.popcornmaths.com web A/AAAA to CloudFront",
  "Changes": [
    { "Action": "UPSERT", "ResourceRecordSet": { "Name": "popcornmaths.com.",     "Type": "A",    "AliasTarget": { "HostedZoneId": "Z2FDTNDATAQYW2", "DNSName": "${CF_DOMAIN}.", "EvaluateTargetHealth": false } } },
    { "Action": "UPSERT", "ResourceRecordSet": { "Name": "popcornmaths.com.",     "Type": "AAAA", "AliasTarget": { "HostedZoneId": "Z2FDTNDATAQYW2", "DNSName": "${CF_DOMAIN}.", "EvaluateTargetHealth": false } } },
    { "Action": "UPSERT", "ResourceRecordSet": { "Name": "www.popcornmaths.com.", "Type": "A",    "AliasTarget": { "HostedZoneId": "Z2FDTNDATAQYW2", "DNSName": "${CF_DOMAIN}.", "EvaluateTargetHealth": false } } },
    { "Action": "UPSERT", "ResourceRecordSet": { "Name": "www.popcornmaths.com.", "Type": "AAAA", "AliasTarget": { "HostedZoneId": "Z2FDTNDATAQYW2", "DNSName": "${CF_DOMAIN}.", "EvaluateTargetHealth": false } } }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id Z06398441PSCZ7Z00DXBZ \
  --change-batch file:///tmp/cutover-popcorn.json
```

> **Note on `ManageLiveDnsRecords`:** After atomic `UPSERT`, keep `ManageLiveDnsRecords="false"` in `infra/params/production.json` (recommended so CloudFormation stack rollbacks can never delete live apex DNS records), **or** if you want CloudFormation to own them, only flip `ManageLiveDnsRecords="true"` after removing the unmanaged records in a scheduled maintenance window (not required once `UPSERT` points to the CloudFront Alias).

---

## Phase 6 — Post-Cutover Verification & `302 -> 301` Redirect Flip

### 6.1 Full Live Production Verification
```bash
node scripts/smoke-test.js \
  --base-url=https://tutortime.ai \
  --portal-url=https://checkin.tutortime.ai \
  --redirect-url=https://popcornmaths.com \
  --expect-redirect-status=302 \
  --expect-noindex=false \
  --expect-preview-banner=false

# Confirm mail DNS records are 100% untouched
aws route53 list-resource-record-sets --hosted-zone-id Z04729501Z8GNOKNPRCKY \
  --query "ResourceRecordSets[?Type=='MX' || Type=='TXT' || contains(Name,'_domainkey') || Name=='mail.tutortime.ai.'].{Name:Name,Type:Type}" \
  --output table
```
Also verify manually in a browser:
1. `https://tutortime.ai` loads fast over HTTPS with valid TLS, no preview banner, `/privacy` renders cleanly.
2. `https://www.tutortime.ai` redirects `301` → `https://tutortime.ai`.
3. `https://popcornmaths.com` and `https://www.popcornmaths.com` redirect `302` → `https://tutortime.ai/services/popcorn-math`.
4. `https://checkin.tutortime.ai` loads login screen, existing tutor accounts in `tutortime-portal` work cleanly.
5. Submit one real test booking on `/book` → confirm saved in `tutortime-submissions` with `expireAt` AND email arrives in `Cassie@tutortime.ai`.
6. Submit one test CV PDF on `/popcorn-math/presenters` → confirm CSP allows direct presigned POST to S3.
7. Send one test message in the AI Helper → confirm reply succeeds and `SYSTEM_COUNTER` increments in `tutortime-submissions`.

### 6.2 Flip `popcornmaths.com` Redirect from `302` to `301` (Once Satisfied)
Once the owner and Teacher Cassie confirm forwarding works cleanly (typically after 48–72 hours):
1. Edit [`infra/params/production.json`](params/production.json): change `"PopcornRedirectStatusCode": "302"` → `"301"`.
2. Merge via PR to `main` and approve `deploy-production`.
3. Verify:
   ```bash
   curl -sSI https://popcornmaths.com/ | grep -iE "^HTTP/|^location:|^cache-control:"
   # Expect: HTTP/2 301 + location: https://tutortime.ai/services/popcorn-math
   ```

---

## Phase 7 — Rollback Procedures (Zero Data Loss)

All stateful stores (`SubmissionsTable`, `PortalTable`, `SubscribersTable`, `UploadsBucket`, and `AppEcrRepository`) enforce `DeletionPolicy: Retain` and `UpdateReplacePolicy: Retain`.

### 7.1 Instant Application Rollback (No Rebuild — ~60 Seconds)
Because ECR retains the last 15 immutable `git-<sha>` images:
1. Open **GitHub → Actions → `CI & Zero-VM CloudFormation Deploy (Lambda + CloudFront)` → Run workflow**.
2. Choose `target_environment: production` and enter the previous known-good `rollback_image_tag` (e.g., `git-abc123456789`).
3. Approve the `production` gate; CloudFormation updates Lambda directly to the prior immutable image.

### 7.2 Emergency Feature Kill-Switches (Zero Code Change)
- **Disable AI Chatbot immediately:** Set `FeaturesChatbotEnabled="false"` in `production.json` (or update Lambda env var `FEATURES_CHATBOT_ENABLED=false` for immediate mitigation, then sync via CFN to prevent drift).
- **Pause outgoing emails without losing form submissions:** Set `EmailDriver="mock"` (bookings keep persisting to DynamoDB while SES sending pauses).

### 7.3 DNS Rollback
Restore the pre-cutover `A` records from `$HOME/tutortime-dns-backups/tutortime.ai-*.json` and `popcornmaths.com-*.json` using `aws route53 change-resource-record-sets --change-batch ...` with `Action: UPSERT`.

### 7.4 Confirm Retained Data Stores Remain Intact After Any Stack Rollback
```bash
for TABLE in tutortime-submissions tutortime-portal popcorn-maths-subscribers; do
  aws dynamodb describe-table --region us-east-2 --table-name "$TABLE" \
    --query "Table.{Name:TableName,Status:TableStatus,Items:ItemCount}" --output table
done
```

---

## Phase 8 — Legacy Cleanup (ONLY After Owner Confirmation & Disk Snapshots)

> [!CAUTION]
> **DO NOT EXECUTE PHASE 8** until:
> 1. Production has run cleanly on Lambda + CloudFront for **at least 48–72 hours** with zero unresolved alarms.
> 2. The **project owner gives explicit written approval** for each specific resource ID below.
> 3. **EBS snapshots** have been taken and verified `completed` for every EC2 volume prior to instance termination.

### 8.1 Verify Current Legacy Resource State First (Read-Only)
*(Read-only audit on 2026-11-27 confirmed legacy ALB `web-elb` is already deleted in `us-east-2`, leaving 4 stopped legacy EC2 instances and an orphan EKS CloudWatch log group.)*
```bash
aws ec2 describe-instances --region us-east-2 \
  --query "Reservations[].Instances[].{Id:InstanceId,Name:Tags[?Key=='Name']|[0].Value,State:State.Name,Volumes:BlockDeviceMappings[].Ebs.VolumeId}" \
  --output table

aws elbv2 describe-load-balancers --region us-east-2 --output table
```

### 8.2 Mandatory EBS Disk Snapshots BEFORE Any EC2 Termination
Create tagged archive snapshots of all 4 stopped `us-east-2` EC2 volumes (`WEB`, `JENKINS`, `Database_VM`, `Web_VM`) and wait until every snapshot reaches `completed`:
```bash
STAMP=$(date -u +"%Y%m%d")

for VOL_INFO in \
  "vol-0eed2add9663bfae6:WEB" \
  "vol-013b1327d9546f307:JENKINS" \
  "vol-055ca42fb2ae183d8:Database_VM" \
  "vol-057e396c299f2b9a6:Web_VM"; do
  VOL_ID="${VOL_INFO%%:*}"
  VM_NAME="${VOL_INFO##*:}"
  echo "Snapshotting ${VM_NAME} (${VOL_ID})..."
  aws ec2 create-snapshot \
    --region us-east-2 \
    --volume-id "$VOL_ID" \
    --description "Pre-decommission archive snapshot of legacy ${VM_NAME} (${STAMP})" \
    --tag-specifications "ResourceType=snapshot,Tags=[{Key=Name,Value=legacy-${VM_NAME}-${STAMP}},{Key=Purpose,Value=PreCleanupArchive}]"
done

# Verify all snapshots are 'completed' BEFORE proceeding!
aws ec2 describe-snapshots --region us-east-2 --owner-ids self \
  --filters "Name=tag:Purpose,Values=PreCleanupArchive" \
  --query "Snapshots[].{SnapshotId:SnapshotId,VolumeId:VolumeId,State:State,Progress:Progress,StartTime:StartTime}" \
  --output table
```

### 8.3 Owner-Confirmed Legacy Decommission & Hygiene Commands
Execute **only** the specific commands explicitly approved by the owner after confirming snapshots are `completed`:
```bash
# 1. Terminate stopped legacy EC2 instances (ONLY after snapshots above are 'completed' and owner approves)
# aws ec2 terminate-instances --region us-east-2 \
#   --instance-ids i-0f9589ac814df648b i-0c94ed619f733c8f6 i-048fdbcf5b3e2d38d i-00bf2d2a6fce7aeb8

# 2. Set 14-day retention on orphan deleted-EKS CloudWatch log group (~3.33 GB currently set to Never Expire)
# aws logs put-retention-policy --region us-east-2 \
#   --log-group-name "/aws/eks/curious-alternative-duck/cluster" \
#   --retention-in-days 14

# 3. Enable S3 Public Access Block on legacy non-CFN buckets (owner confirmation required)
# for BUCKET in popcorn-maths-emails emmanuel-app s3.index; do
#   aws s3api put-public-access-block --region us-east-2 --bucket "$BUCKET" \
#     --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
# done

# 4. Close public Port 22 (SSH 0.0.0.0/0) on legacy security groups (owner confirmation required)
# for SG in sg-0362cfdba21f046a4 sg-00cb6eab6bfcb9859 sg-0951c16f34eefd92c sg-04b0abe8b30c018c0; do
#   aws ec2 revoke-security-group-ingress --region us-east-2 \
#     --group-id "$SG" --protocol tcp --port 22 --cidr 0.0.0.0/0
# done
```

---

## Quick Reference: Runtime Environment Variables (Injected by Stack `03b`)
Stack `03b` configures all non-secret environment variables automatically from `infra/params/staging.json` or `infra/params/production.json` (never bake `.env` into Docker images):
- **Storage:** `STORAGE_DRIVER=aws`, `AWS_REGION=us-east-2`, `DYNAMODB_TABLE_NAME`, `PORTAL_TABLE_NAME`, `SUBSCRIBERS_TABLE_NAME`, `UPLOADS_BUCKET_NAME`
- **Email:** `EMAIL_DRIVER` (`mock` on staging / `ses` on prod), `SES_REGION=us-east-2`, `CASSIE_NOTIFICATION_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`, `SENDER_EMAIL`, `PORTAL_SENDER_EMAIL`, `CASSIE_REPLY_TO_EMAIL`, `SEND_CONFIRMATIONS`
- **Portal & Routing:** `TRUST_PROXY=1`, `SITE_URL`, `PORTAL_HOST`, `PORTAL_BASE_URL`, `SITE_NOINDEX`, `SHOW_LOCAL_PREVIEW_BANNER`
- **Secrets (Secrets Manager):** `ANTHROPIC_API_KEY`, `ADMIN_API_KEY`, `FAULT_INJECTION_KEY`, `ORIGIN_VERIFY_SECRET`
