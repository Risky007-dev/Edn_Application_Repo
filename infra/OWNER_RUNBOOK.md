# Tutor Time & Popcorn Math — Zero-VM Production Deployment & Operations Runbook

> **DOCUMENT STATUS:** PRODUCTION-DIRECT RUNBOOK (Matches [`DEPLOYMENT_PLAN.md`](../DEPLOYMENT_PLAN.md))  
> **ARCHITECTURE:** Zero-VM **AWS Lambda (Container + AWS Lambda Web Adapter 0.8.4) + Amazon CloudFront** (`us-east-2` compute/data + `us-east-1` edge ACM TLS cert)  
> **DEPLOY MODEL:** Every push to `main` automatically runs tests → builds immutable image → verifies Stack `01` Change Set has zero replacements/removals → deploys production → invalidates CloudFront (`/*`) → runs live smoke tests → rolls back automatically to the last good image on failure (first deploy stops and reports). **No staging, no manual approval, one deploy at a time, pull requests never deploy.**  
> **HARD SAFETY RULES:** Never touch `MX`, `TXT`, `DKIM`, `DMARC`, or mail Lambdas. Delete no AWS resources or data *(sole owner-approved exception: delete only the stale `A` record on `mail.tutortime.ai` at go-live after verifying zero MX/CNAME/SES dependency)*. No old-server cleanup.

---

## Phase 0 — Pre-Flight Verification, Backups & DNS Export

### 0.1 Confirm AWS Account & Identity
```bash
aws sts get-caller-identity
```
Verify the AWS Account ID ends in `2392` and you are authenticated as an IAM user (not root).

### 0.2 On-Demand DynamoDB Backups & Enable PITR on `popcorn-maths-subscribers`
```bash
STAMP=$(date -u +"%Y%m%d-%H%M%S")

for TABLE in tutortime-submissions tutortime-portal popcorn-maths-subscribers; do
  echo "Creating on-demand backup for ${TABLE}..."
  aws dynamodb create-backup \
    --region us-east-2 \
    --table-name "$TABLE" \
    --backup-name "${TABLE}-pre-deploy-${STAMP}"
done

aws dynamodb update-continuous-backups \
  --region us-east-2 \
  --table-name popcorn-maths-subscribers \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

### 0.3 Export Both Route 53 Hosted Zones (Outside Repo)
```bash
mkdir -p "$HOME/tutortime-dns-backups"
STAMP=$(date -u +"%Y%m%d-%H%M%S")

aws route53 list-resource-record-sets \
  --hosted-zone-id Z04729501Z8GNOKNPRCKY \
  > "$HOME/tutortime-dns-backups/tutortime.ai-${STAMP}.json"

aws route53 list-resource-record-sets \
  --hosted-zone-id Z06398441PSCZ7Z00DXBZ \
  > "$HOME/tutortime-dns-backups/popcornmaths.com-${STAMP}.json"
```

### 0.4 Audit Portal Usernames (Read-Only, Zero Passwords Shown)
```bash
aws dynamodb scan \
  --region us-east-2 \
  --table-name tutortime-portal \
  --filter-expression "entityType = :u" \
  --expression-attribute-values '{":u":{"S":"USER"}}' \
  --projection-expression "PK, username, mustChangePassword, updatedAt" \
  --output table
```
Flag any developer or demo-password accounts for owner review before go-live (do not display password hashes or delete records).

---

## Phase 1 — Bootstrap Core AWS Stacks BEFORE Merging to `main`

> **CRITICAL:** Complete Phases 1 and 2 **BEFORE** merging `feature/local-completion` into `main`, because pushing to `main` automatically deploys to production.

Helper to turn `infra/params/production.json` into `--parameter-overrides`:
```bash
to_overrides() {
  node -e "const p=require('./infra/params/production.json')[\"$1\"].parameters; console.log(Object.entries(p).map(([k,v])=>k+'='+v).join(' '));"
}
```

### 1.1 Stack `01` (`tutortime-production-infra`) — Mandatory Change-Set Inspection
```bash
CS_NAME="tutortime-data-bootstrap-$(date -u +%Y%m%d%H%M%S)"

aws cloudformation create-change-set \
  --region us-east-2 \
  --stack-name tutortime-production-infra \
  --change-set-name "$CS_NAME" \
  --change-set-type UPDATE \
  --template-body file://infra/01-data-stack.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameters "$(node -e "const p=require('./infra/params/production.json').dataStack.parameters; console.log(JSON.stringify(Object.entries(p).map(([k,v])=>({ParameterKey:k,ParameterValue:String(v)}))));")"

aws cloudformation wait change-set-create-complete \
  --region us-east-2 \
  --stack-name tutortime-production-infra \
  --change-set-name "$CS_NAME"

# STOP IMMEDIATELY IF ANY RESOURCE SHOWS Action=Remove OR Replacement=True/Conditional!
aws cloudformation describe-change-set \
  --region us-east-2 \
  --stack-name tutortime-production-infra \
  --change-set-name "$CS_NAME" \
  --query "Changes[].ResourceChange.{Action:Action,LogicalId:LogicalResourceId,Type:ResourceType,Replacement:Replacement}" \
  --output table
```

Only if zero replacements and zero removals are shown:
```bash
aws cloudformation execute-change-set \
  --region us-east-2 \
  --stack-name tutortime-production-infra \
  --change-set-name "$CS_NAME"

aws cloudformation wait stack-update-complete \
  --region us-east-2 \
  --stack-name tutortime-production-infra
```

### 1.2 Stack `02` (`tutortime-production-security`, `us-east-2`)
Provisions immutable ECR repo `tutortime-app`, 4 Secrets Manager secrets, `LambdaExecutionRole`, GitHub OIDC Provider, and `GitHubDeployRole`:
```bash
aws cloudformation deploy \
  --region us-east-2 \
  --stack-name tutortime-production-security \
  --template-file infra/02-security-cicd-stack.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset \
  --parameter-overrides $(to_overrides securityStack)

aws cloudformation describe-stacks \
  --region us-east-2 \
  --stack-name tutortime-production-security \
  --query "Stacks[0].Outputs" \
  --output table
```

### 1.3 Stack `03a` (`tutortime-production-edge-cert`, `us-east-1`)
Auto-validates via Route 53 CNAMEs for all 5 SANs (`tutortime.ai`, `www.tutortime.ai`, `checkin.tutortime.ai`, `popcornmaths.com`, `www.popcornmaths.com`) without touching any web `A` or mail DNS records:
```bash
aws cloudformation deploy \
  --region us-east-1 \
  --stack-name tutortime-production-edge-cert \
  --template-file infra/03a-edge-cert-stack.yaml \
  --no-fail-on-empty-changeset \
  --parameter-overrides $(to_overrides edgeCertStack)
```

---

## Phase 2 — Configure GitHub `production` Environment, Variables & Anthropic Secret

1. **Create GitHub `production` Environment (`main` branch only, no required reviewers):**
   - Repo **Settings → Environments → New environment → `production`**.
   - Deployment branches: **Selected branches** → `main`.
   - Required reviewers: **none** (push to `main` deploys straight to production).
2. **Set Repository Variables** (**Settings → Secrets and variables → Actions → Variables**):
   - `AWS_DEPLOY_ROLE_ARN` = `GitHubDeployRoleArn` output from Stack `02`.
   - `OPS_ALERT_EMAIL` = Owner email for CloudWatch/SNS/Budget alerts.
3. **Populate Anthropic API Key Out-of-Band in Secrets Manager (Owner Action):**
   After setting a hard spend cap in the Anthropic Console:
   ```bash
   aws secretsmanager put-secret-value \
     --region us-east-2 \
     --secret-id tutortime/production/anthropic-api-key \
     --secret-string '{"value":"YOUR_CAPPED_ANTHROPIC_API_KEY"}'
   ```
   Because Lambda reads `ANTHROPIC_API_KEY_SECRET_ARN` lazily at runtime with a 30s empty-secret cache TTL (5 min positive TTL), updating this secret takes effect automatically without redeploying CloudFormation. If left empty or unreachable, **only the chatbot goes offline** (HTTP `503`) while all other pages, forms, email, and portal features continue normally.

---

## Phase 3 — Merge via Pull Request & Pre-Cutover CloudFront Testing

1. Confirm [`infra/params/production.json`](params/production.json) has `ManageNewSubdomainDnsRecords="false"`, `ManageLiveDnsRecords="false"`, and `LambdaReservedConcurrency="0"`.
2. Open a Pull Request `feature/local-completion` → `main`:
   - `validate-and-test` runs automatically (tests, `cfn-lint`, Docker container smoke test, Trivy scan). **Pull requests never deploy.**
3. Merge the PR into `main` → GitHub Actions automatically runs:
   - `validate-and-test` → `build-and-push` (`tutortime-app:git-<sha>`) → `deploy-production` (Stack 01 Change-Set guard → Stack 03b + Stack 04 → CloudFront `/*` invalidation → live smoke test).
4. **Verify Everything Through CloudFront Using Real Hostnames (Pre-Cutover):**
   ```bash
   CF_DOMAIN=$(aws cloudformation describe-stacks --region us-east-2 \
     --stack-name tutortime-production-app \
     --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomainName'].OutputValue" --output text)
   CF_IP=$(dig +short "$CF_DOMAIN" | head -n 1)

   # Confirm raw Lambda Function URL bypass is blocked (403)
   FN_URL=$(aws cloudformation describe-stacks --region us-east-2 \
     --stack-name tutortime-production-app \
     --query "Stacks[0].Outputs[?OutputKey=='AppFunctionUrlEndpoint'].OutputValue" --output text)
   curl -sS -o /dev/null -w "Direct Function URL (expect 403): %{http_code}\n" "$FN_URL"

   # Test real hostnames directly against CloudFront IP before DNS cutover
   curl -sSI --resolve "tutortime.ai:443:${CF_IP}" "https://tutortime.ai/health"
   curl -sSI --resolve "www.tutortime.ai:443:${CF_IP}" "https://www.tutortime.ai/"
   curl -sSI --resolve "checkin.tutortime.ai:443:${CF_IP}" "https://checkin.tutortime.ai/login"
   curl -sSI --resolve "popcornmaths.com:443:${CF_IP}" "https://popcornmaths.com/"
   curl -sSI --resolve "www.popcornmaths.com:443:${CF_IP}" "https://www.popcornmaths.com/"
   ```
   Verify pages, `/privacy`, `/readiness-check`, forms + SES email delivery, `/office` portal login, `/api/chat`, and `302`/`301` edge redirects.

---

## Phase 4 — Minimal-Downtime Atomic Route 53 Cutover

*(Note: Legacy ALB `web-elb` is already deleted, so `popcornmaths.com` / `www.popcornmaths.com` currently have dangling Alias records, and `tutortime.ai` / `checkin.tutortime.ai` / `mail.tutortime.ai` point to the retired crashed legacy server.)*

Using Route 53 `UPSERT` switches web traffic atomically (~0s DNS gap) while keeping `ManageNewSubdomainDnsRecords="false"` and `ManageLiveDnsRecords="false"` in `infra/params/production.json` so **future pushes to `main` and rollbacks can never conflict with or undo live DNS**.

**NEVER touch `MX`, `TXT`, `DMARC`, `_domainkey` DKIM `CNAME`s, `bounce.tutortime.ai`, or `inbound-test.tutortime.ai`.** *(One owner-approved go-live exception: delete ONLY the stale `A` record on `mail.tutortime.ai` once confirmed that zero MX/CNAME/SES rules depend on it.)*

```bash
CF_DOMAIN=$(aws cloudformation describe-stacks --region us-east-2 \
  --stack-name tutortime-production-app \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomainName'].OutputValue" --output text)

# Zone 1: tutortime.ai (tutortime.ai, www.tutortime.ai, checkin.tutortime.ai -> CloudFront A + AAAA)
cat << EOF > /tmp/cutover-tutortime.json
{
  "Comment": "Atomic web-only cutover to CloudFront (mail records untouched)",
  "Changes": [
    { "Action": "UPSERT", "ResourceRecordSet": { "Name": "tutortime.ai.",         "Type": "A",    "AliasTarget": { "HostedZoneId": "Z2FDTNDATAQYW2", "DNSName": "${CF_DOMAIN}.", "EvaluateTargetHealth": false } } },
    { "Action": "UPSERT", "ResourceRecordSet": { "Name": "tutortime.ai.",         "Type": "AAAA", "AliasTarget": { "HostedZoneId": "Z2FDTNDATAQYW2", "DNSName": "${CF_DOMAIN}.", "EvaluateTargetHealth": false } } },
    { "Action": "UPSERT", "ResourceRecordSet": { "Name": "www.tutortime.ai.",     "Type": "A",    "AliasTarget": { "HostedZoneId": "Z2FDTNDATAQYW2", "DNSName": "${CF_DOMAIN}.", "EvaluateTargetHealth": false } } },
    { "Action": "UPSERT", "ResourceRecordSet": { "Name": "www.tutortime.ai.",     "Type": "AAAA", "AliasTarget": { "HostedZoneId": "Z2FDTNDATAQYW2", "DNSName": "${CF_DOMAIN}.", "EvaluateTargetHealth": false } } },
    { "Action": "UPSERT", "ResourceRecordSet": { "Name": "checkin.tutortime.ai.", "Type": "A",    "AliasTarget": { "HostedZoneId": "Z2FDTNDATAQYW2", "DNSName": "${CF_DOMAIN}.", "EvaluateTargetHealth": false } } },
    { "Action": "UPSERT", "ResourceRecordSet": { "Name": "checkin.tutortime.ai.", "Type": "AAAA", "AliasTarget": { "HostedZoneId": "Z2FDTNDATAQYW2", "DNSName": "${CF_DOMAIN}.", "EvaluateTargetHealth": false } } }
  ]
}
EOF
aws route53 change-resource-record-sets \
  --hosted-zone-id Z04729501Z8GNOKNPRCKY \
  --change-batch file:///tmp/cutover-tutortime.json

# Zone 2: popcornmaths.com (popcornmaths.com, www.popcornmaths.com -> CloudFront A + AAAA; edge 302 forward)
cat << EOF > /tmp/cutover-popcorn.json
{
  "Comment": "Atomic web-only cutover of popcornmaths.com to CloudFront edge 302 redirect (DKIM untouched)",
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

### Post-Cutover Verification & `302 -> 301` Flip
```bash
node scripts/smoke-test.js \
  --base-url=https://tutortime.ai \
  --portal-url=https://checkin.tutortime.ai \
  --redirect-url=https://popcornmaths.com \
  --expect-redirect-status=302 \
  --expect-noindex=false \
  --expect-preview-banner=false
```
Once verified and approved, flip `"PopcornRedirectStatusCode": "302"` → `"301"` in [`infra/params/production.json`](params/production.json) and push to `main`.

---

## Phase 5 — Rollback Procedures (Zero Data Loss)

All stateful stores (`SubmissionsTable`, `UploadsBucket`, `AppEcrRepository`) enforce `DeletionPolicy: Retain` and `UpdateReplacePolicy: Retain`, and all 3 DynamoDB tables have PITR + on-demand pre-deploy backups.

### 5.1 Automatic CI Rollback
If any subsequent push to `main` fails during Stack `03b` deploy, CloudFront invalidation, or live smoke testing, `.github/workflows/ci-deploy.yml` automatically redeploys `tutortime-production-app` to the last known-good `DeployedImageTag`, invalidates CloudFront (`/*`), and verifies health. *(On a first deploy with no prior image, CI stops and reports failure without touching anything.)*

### 5.2 Manual Instant Rollback (No Rebuild — ~60 Seconds)
1. **GitHub → Actions → `CI & Zero-VM Production Deploy (Lambda + CloudFront)` → Run workflow**.
2. Enter the previous known-good immutable ECR tag in `rollback_image_tag` (e.g. `git-abc123456789` — ECR retains the last 15 images).
3. Or run `git revert <bad-commit>` and push to `main`.

### 5.3 Emergency Kill-Switches
- **Chatbot offline without touching the rest of the site:** Set `FeaturesChatbotEnabled="false"` in `production.json` (or clear `tutortime/production/anthropic-api-key` to `{"value":""}` in Secrets Manager — takes effect within 5 min cache TTL).
- **Pause SES emails while keeping DynamoDB saves:** Set `EmailDriver="mock"` in `production.json`.

### 5.4 DNS Rollback
Restore prior `A` records verbatim from `$HOME/tutortime-dns-backups/tutortime.ai-*.json` and `popcornmaths.com-*.json` using `aws route53 change-resource-record-sets` (`Action: UPSERT`).

> **Legacy Resources Policy:** Per owner directive, **no AWS resources or old servers are deleted** as part of this deployment.
