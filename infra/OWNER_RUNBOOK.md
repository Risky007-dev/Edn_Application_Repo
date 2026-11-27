# Tutor Time & Popcorn Math: AWS Infrastructure & Migration Runbook

> **DOCUMENT STATUS:** DRAFT / PENDING OWNER REVIEW  
> **SCOPE:** Operational runbook for deploying CloudFormation stacks (`infra/01-data-stack.yaml`..`04-ops-budget-stack.yaml` or single-stack `infra/tutortime-stack.yaml`), running a side-by-side **staging ("practice")** environment, transitioning from `STORAGE_DRIVER=local` to `STORAGE_DRIVER=aws`, verifying the stack, and rolling back safely without data loss.

---

## 1. Prerequisites & Decisions Owner Must Make First

Before creating any cloud resources, the business owner must confirm and decide the following:

1. **Custom Domain & SES Verification (REQUIRED parameter: `SesIdentityArn`)**:
   - Confirm whether `CASSIE_NOTIFICATION_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`, and `SENDER_EMAIL` / `PORTAL_SENDER_EMAIL` are on verified identities in Amazon SES (`us-east-2`).
   - Note down the primary SES Identity ARN (`arn:aws:ses:us-east-2:<AWS_ACCOUNT_ID>:identity/mail.tutortime.ai`) and any additional identity ARNs (`AdditionalSesIdentityArns`, e.g., `tutortime.ai`, `popcornmaths.com`).
   - Confirm SES Production Access status (`ses:GetAccount` / `ses:GetEmailIdentity` are granted in `AppManagedPolicy` so the portal's sandbox guard can verify recipients safely).
2. **Data Retention Policy (`TODO(legal)`)**:
   - Applicant CV PDFs in S3 expire automatically after `CVRetentionDays` (default **`180` days** / 6 months per `docs/legal/DATA_RETENTION_SCHEDULE.md`).
   - DynamoDB `SubmissionsTable` enables native TTL on `expireAt` (`180` days for `PRESENTER_APPLICATION`, `730` days for `SCHOOL_ENQUIRY`, `365` days for other enquiries).
3. **S3 Bucket Naming**:
   - S3 bucket names are globally unique. Leave `UploadsBucketName` blank to let CloudFormation generate one automatically, or choose an explicit unique name.
4. **Target Site Origins (REQUIRED: `SiteOrigin`, optional `AdditionalCorsOrigin`)**:
   - Configure the allowed HTTPS origins for direct browser S3 presigned POST CV uploads (e.g., `SiteOrigin=https://tutortime.ai`, `AdditionalCorsOrigin=https://www.tutortime.ai`, or `https://staging.tutortime.ai` on staging). Must match `^https://[a-zA-Z0-9.-]+$`.
5. **Runtime Execution Role**:
   - Attach `AppManagedPolicyArn` (or use `LambdaExecutionRole` exported from `infra/02-security-cicd-stack.yaml`) to your runtime execution role (Lambda, App Runner, ECS Task Role, or EC2 Role).

---

## 2. Step-by-Step Deployment Procedure

### Step 1: Review & Validate CloudFormation Templates
Inspect `infra/tutortime-stack.yaml` (and `infra/01-data-stack.yaml`..`04-ops-budget-stack.yaml` for the full serverless stack). Validate syntax using the AWS CLI in `us-east-2`:
```bash
aws cloudformation validate-template \
  --region us-east-2 \
  --template-body file://infra/tutortime-stack.yaml
```

### Step 2A: Deploy Production Single-Stack Data Layer (`tutortime-stack.yaml`)
```bash
aws cloudformation deploy \
  --stack-name tutortime-production-infra \
  --region us-east-2 \
  --template-file infra/tutortime-stack.yaml \
  --parameter-overrides \
      EnvironmentName=production \
      DynamoDBTableName=tutortime-submissions \
      PortalTableName=tutortime-portal \
      SubscribersTableName=popcorn-maths-subscribers \
      SiteOrigin=https://tutortime.ai \
      AdditionalCorsOrigin=https://www.tutortime.ai \
      CVRetentionDays=180 \
      SesIdentityArn=arn:aws:ses:us-east-2:<ACCOUNT_ID>:identity/mail.tutortime.ai \
  --capabilities CAPABILITY_NAMED_IAM
```

### Step 2B: Deploy an Isolated Staging ("Practice") Copy (`EnvironmentName=staging`)
Because `DynamoDBTableName`, `PortalTableName`, and `SubscribersTableName` parameterize per environment cleanly, a separate staging stack can run in `us-east-2` alongside production with **zero table-name collisions** and `EMAIL_DRIVER=mock`:
```bash
aws cloudformation deploy \
  --stack-name tutortime-staging-infra \
  --region us-east-2 \
  --template-file infra/tutortime-stack.yaml \
  --parameter-overrides \
      EnvironmentName=staging \
      DynamoDBTableName=tutortime-staging-submissions \
      PortalTableName=tutortime-portal-staging \
      SubscribersTableName=tutortime-staging-subscribers \
      SiteOrigin=https://staging.tutortime.ai \
      CVRetentionDays=180 \
      SesIdentityArn=arn:aws:ses:us-east-2:<ACCOUNT_ID>:identity/mail.tutortime.ai \
  --capabilities CAPABILITY_NAMED_IAM
```
> For the full modular serverless deployment (`01-data-stack.yaml` -> `02-security-cicd-stack.yaml` -> `03a-edge-cert-stack.yaml` -> `03b-app-stack.yaml` -> `04-ops-budget-stack.yaml`), see [`DEPLOYMENT_PLAN.md`](../DEPLOYMENT_PLAN.md) and parameter sets in `infra/params/staging.json` and `infra/params/production.json`.

### Step 3: Query Stack Outputs & Verify Resources
```bash
aws cloudformation describe-stacks \
  --stack-name tutortime-production-infra \
  --region us-east-2 \
  --query "Stacks[0].Outputs" \
  --output table
```
Verify that `SubmissionsTableName`, `PortalTableName`, `SubscribersTableName`, `UploadsBucketName`, and `AppManagedPolicyArn` are exported cleanly.

### Step 4: Configure Runtime Environment Variables
Configure these runtime environment variables (never bake `.env` into Docker images; store secret keys like `ANTHROPIC_API_KEY` and `ADMIN_API_KEY` in AWS Secrets Manager / SSM Parameter Store):
```env
# Storage & Persistence
STORAGE_DRIVER=aws
AWS_REGION=us-east-2
DYNAMODB_TABLE_NAME=<SubmissionsTableName output>
PORTAL_TABLE_NAME=<PortalTableName output>
SUBSCRIBERS_TABLE_NAME=<SubscribersTableName output>
UPLOADS_BUCKET_NAME=<UploadsBucketName output>

# Email Notifications (independent from STORAGE_DRIVER; use 'mock' on staging)
EMAIL_DRIVER=ses
SES_REGION=us-east-2
CASSIE_NOTIFICATION_EMAIL=Cassie@tutortime.ai
ADMIN_NOTIFICATION_EMAIL=notifications@mail.tutortime.ai
SENDER_EMAIL=noreply@mail.tutortime.ai
SEND_CONFIRMATIONS=false

# Private Portal Host & Addresses
PORTAL_HOST=checkin.tutortime.ai          # checkin-staging.tutortime.ai on staging
PORTAL_BASE_URL=https://checkin.tutortime.ai
PORTAL_SENDER_EMAIL=noreply@mail.tutortime.ai
CASSIE_REPLY_TO_EMAIL=Cassie@tutortime.ai
```

### Step 5: Test Live Health & Submissions
1. Check `GET /health` -> `200 { "status": "ok" }` and `GET /privacy` -> `200` (confirms `docs/` is packaged inside container).
2. Submit a test enquiry via `/contact` or `/book` and confirm the DynamoDB item has top-level fields, `PENDING_REVIEW` status, and an integer `expireAt` epoch timestamp.
3. Submit a test presenter CV PDF on `/popcorn-math/presenters` and confirm browser CSP allows the direct presigned POST to S3.

---

## 3. Stack Rollback Procedure (No Deletion of Retained Resources)

Because `SubmissionsTable`, `PortalTable`, `SubscribersTable`, and `UploadsBucket` all enforce `DeletionPolicy: Retain` and `UpdateReplacePolicy: Retain` (with Point-in-Time Recovery enabled), deleting an application stack never deletes stored submissions, portal records, subscribers, or CV PDFs.

> [!NOTE]
> **Stack Re-creation Note (Retained Resource Names):**  
> Because DynamoDB tables and the S3 bucket are retained after stack deletion, re-creating a stack with the same resource names will fail with an "already exists" error unless you either pass new resource names (`DynamoDBTableName`, `PortalTableName`, `SubscribersTableName`, `UploadsBucketName`) or use CloudFormation Resource Import.

### Rollback Checklist
1. **Pause notifications without data loss:** Switch `EMAIL_DRIVER=mock` (keeps saving bookings to DynamoDB without sending emails).
2. **Revert to local driver if needed:** Set `STORAGE_DRIVER=local`.
3. **If tearing down an IAM policy/stack cleanly:**
   ```bash
   aws iam detach-role-policy \
     --role-name <EXISTING_ROLE_NAME> \
     --policy-arn <APP_MANAGED_POLICY_ARN>

   aws cloudformation delete-stack \
     --stack-name <STACK_NAME> \
     --region us-east-2

   aws cloudformation wait stack-delete-complete \
     --stack-name <STACK_NAME> \
     --region us-east-2
   ```
4. **Confirm retained stores remain intact:**
   ```bash
   aws dynamodb describe-table --table-name tutortime-submissions --region us-east-2 --query "Table.TableStatus" --output text
   aws dynamodb describe-table --table-name tutortime-portal --region us-east-2 --query "Table.TableStatus" --output text
   aws dynamodb describe-table --table-name popcorn-maths-subscribers --region us-east-2 --query "Table.TableStatus" --output text
   aws s3api head-bucket --bucket <UPLOADS_BUCKET_NAME>
   ```
