# Tutor Time & Popcorn Math: AWS Infrastructure & Migration Runbook

> **DOCUMENT STATUS:** DRAFT / PENDING OWNER REVIEW  
> **SCOPE:** Operational runbook for deploying `infra/tutortime-stack.yaml`, transitioning from `STORAGE_DRIVER=local` to `STORAGE_DRIVER=aws`, stack verification, and emergency rollback procedures without data loss.

---

## 1. Prerequisites & Decisions Owner Must Make First

Before creating any cloud resources, the business owner must confirm and decide the following:

1. **Custom Domain & SES Verification (REQUIRED parameter: `SesIdentityArn`)**:
   - Confirm whether the notification email address (`ADMIN_NOTIFICATION_EMAIL`) and sender address (`SENDER_EMAIL`) are on your verified domain in Amazon SES.
   - Note down the SES Identity ARN: `arn:aws:ses:us-east-2:<AWS_ACCOUNT_ID>:identity/<YOUR_DOMAIN_OR_EMAIL>`. This parameter is REQUIRED (no default); CloudFormation deployment will fail if omitted.
   - Confirm SES Production Access status (in SES sandbox, emails can only be sent to pre-verified addresses).
2. **Data Retention Policy (`TODO(legal)`)**:
   - Determine how long applicant CV PDFs should be stored in S3 before automatic deletion.
   - The default parameter in CloudFormation is set to `90` days. If you prefer `180` or `365` days, adjust `CVRetentionDays` accordingly.
3. **S3 Bucket Naming**:
   - S3 bucket names are globally unique. Choose a name such as `tutortime-cv-uploads-<random-suffix>` or leave blank to let CloudFormation generate one automatically.
4. **Target Site Origin (REQUIRED parameter: `SiteOrigin`)**:
   - Determine the allowed web origin for CORS direct browser uploads (e.g., `https://popcornmaths.com` or `https://www.popcornmaths.com`). Must match pattern `^https://[a-zA-Z0-9.-]+$`. This parameter is REQUIRED (no default); CloudFormation deployment will fail if omitted.
5. **Existing EC2 IAM Role**:
   - Identify the existing IAM role currently attached to your server instance (`<EXISTING_ROLE_NAME>`). Note: you attach the policy to the **role**, not to an instance profile.

---

## 2. Step-by-Step Deployment Procedure

### Step 1: Review CloudFormation Template
Inspect `infra/tutortime-stack.yaml` to ensure resource definitions, parameter defaults, and retention policies align with your requirements.

### Step 2: Validate the Template
Run template validation using the AWS CLI in `us-east-2`:
```bash
aws cloudformation validate-template \
  --region us-east-2 \
  --template-body file://infra/tutortime-stack.yaml
```

### Step 3: Deploy the CloudFormation Stack
Create the stack with the chosen parameter values (replace placeholders). Note that `SiteOrigin` and `SesIdentityArn` are **REQUIRED** parameters with no default values (omitting them will cause stack creation to fail validation). Note also the `--capabilities CAPABILITY_IAM` flag:
```bash
# popcornmaths.com is assumed; the owner must confirm the domain first.
aws cloudformation create-stack \
  --stack-name tutortime-production-infra \
  --region us-east-2 \
  --template-body file://infra/tutortime-stack.yaml \
  --parameters \
      ParameterKey=EnvironmentName,ParameterValue=production \
      ParameterKey=DynamoDBTableName,ParameterValue=tutortime-submissions \
      ParameterKey=SiteOrigin,ParameterValue=https://popcornmaths.com \
      ParameterKey=CVRetentionDays,ParameterValue=90 \
      ParameterKey=SesIdentityArn,ParameterValue=arn:aws:ses:us-east-2:<ACCOUNT_ID>:identity/popcornmaths.com \
  --capabilities CAPABILITY_IAM
```

Wait for stack creation to complete:
```bash
aws cloudformation wait stack-create-complete \
  --stack-name tutortime-production-infra \
  --region us-east-2
```

Query the stack outputs to get the generated Bucket Name and IAM Policy ARN:
```bash
aws cloudformation describe-stacks \
  --stack-name tutortime-production-infra \
  --region us-east-2 \
  --query "Stacks[0].Outputs" \
  --output table
```

### Step 4: Verify the CloudFormation Stack
Confirm that all stack resources were created cleanly:
```bash
# 1. Check overall stack status (should return CREATE_COMPLETE)
aws cloudformation describe-stacks \
  --stack-name tutortime-production-infra \
  --region us-east-2 \
  --query "Stacks[0].StackStatus" \
  --output text

# 2. List all created resources
aws cloudformation list-stack-resources \
  --stack-name tutortime-production-infra \
  --region us-east-2 \
  --output table
```

### Step 5: Attach the Scoped Policy to the Existing Role
Attach the generated managed policy to your existing IAM role (attach to the **role**, not the instance profile):
```bash
aws iam attach-role-policy \
  --role-name <EXISTING_ROLE_NAME> \
  --policy-arn <APP_MANAGED_POLICY_ARN>
```

### Step 6: Update Server Environment Variables
On the application server, edit `<ENV_FILE_PATH>` (located in `<APP_DIR>`) and configure:
```env
# Storage Configuration
STORAGE_DRIVER=aws
AWS_REGION=us-east-2
DYNAMODB_TABLE_NAME=tutortime-submissions
UPLOADS_BUCKET_NAME=<UPLOADS_BUCKET_NAME_FROM_STACK_OUTPUTS>

# Email Notifications
ADMIN_NOTIFICATION_EMAIL=cassie@tutortime.example
# popcornmaths.com is assumed; the owner must confirm the domain first.
SENDER_EMAIL=notifications@popcornmaths.com
SEND_CONFIRMATIONS=false
```

### Step 7: Restart Application & Verify Live Health
Restart the application process using your production process manager:
```bash
<RESTART_COMMAND>
```

Confirm that the server logs indicate initialization of the AWS driver.

### Step 8: Test with a Single Live Submission
1. Open the website in your browser.
2. Submit a test enquiry via `/contact` or `/book`.
3. Check the DynamoDB table to verify the record was written:
```bash
aws dynamodb query \
  --region us-east-2 \
  --table-name tutortime-submissions \
  --key-condition-expression "formType = :ft" \
  --expression-attribute-values '{":ft": {"S": "CONTACT"}}' \
  --limit 1
```
4. Verify that the record contains top-level form fields, a timestamped sort key, and `PENDING_REVIEW` status.

---

## 3. Stack Rollback Procedure (No Deletion of Retained Resources)

If you need to tear down or roll back the CloudFormation infrastructure, follow these steps.
Because `SubmissionsTable` and `UploadsBucket` have `DeletionPolicy: Retain` explicitly configured in `infra/tutortime-stack.yaml`, deleting the stack deletes **only** the managed IAM policy; your DynamoDB table and S3 bucket with all customer submissions and CV uploads are **retained and protected from deletion**.

> [!NOTE]
> **Stack Re-creation Note (Retained Fixed Resource Names):**  
> Because the DynamoDB table and S3 bucket are retained after stack deletion and use fixed names, attempting to re-create the stack later with the same parameters will fail with an "already exists" error.
> The owner must decide between two options:
> 1. **Use different resource names:** Provide new unique names via `DynamoDBTableName` and `UploadsBucketName` parameters when creating the new stack.
> 2. **Import existing resources:** Use CloudFormation's resource import feature to attach the existing retained table and bucket to the new stack.
> The owner decides which approach to take.

### Step 1: Revert Application to Local Storage
Switch the application back to flat-file storage before removing cloud policies:
```bash
# Revert STORAGE_DRIVER on the server
sed -i 's/STORAGE_DRIVER=aws/STORAGE_DRIVER=local/' <ENV_FILE_PATH>
<RESTART_COMMAND>
```

### Step 2: Detach the Managed Policy from the Existing Role
Detach the policy from your existing IAM role prior to stack deletion:
```bash
aws iam detach-role-policy \
  --role-name <EXISTING_ROLE_NAME> \
  --policy-arn <APP_MANAGED_POLICY_ARN>
```

### Step 3: Delete the CloudFormation Stack
Delete the stack:
```bash
aws cloudformation delete-stack \
  --stack-name tutortime-production-infra \
  --region us-east-2
```

Wait for stack deletion to complete:
```bash
aws cloudformation wait stack-delete-complete \
  --stack-name tutortime-production-infra \
  --region us-east-2
```

### Step 4: Verify Retained Resources Were NOT Deleted
Confirm that the DynamoDB table and S3 bucket remain safely intact:
```bash
# 1. Verify DynamoDB table still exists with all data intact
aws dynamodb describe-table \
  --table-name tutortime-submissions \
  --region us-east-2 \
  --query "Table.TableStatus" \
  --output text

# 2. Verify S3 bucket still exists with all uploaded files intact
aws s3api head-bucket \
  --bucket <UPLOADS_BUCKET_NAME>
```
