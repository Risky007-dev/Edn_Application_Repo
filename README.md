# Tutor Time with Teacher Cassie & Popcorn Math

Production web application for **Tutor Time with Teacher Cassie** and the **Popcorn Math** interactive educational programme.

---

## 1. Quick Start: Local Development

### Prerequisites
- Node.js (v20.x or higher)
- npm (v10.x or higher)

### Setup & Execution
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Risky007-dev/Edn_Application_Repo.git
   cd Edn_Application_Repo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure local environment:**
   Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```
   *(By default, `STORAGE_DRIVER=local` is active, requiring zero cloud credentials or AWS access).*

4. **Start the local server:**
   ```bash
   npm start
   ```
   The application will start on `http://localhost:5001`.

---

## 2. Running Automated Tests & Quality Checks

Run the full verification suite across all stages:
```bash
# Execute all automated test suites (Stages 1 through 4)
npm test

# Check for rendered visible vs hidden TODO markers across all HTTP pages
npm run check:todos

# Audit proposed copy items awaiting owner approval
npm run check:copy

# Validate JavaScript syntax across all project files
node scripts/check-syntax.js
```

---

## 3. Environment Variable Reference

The application reads the following environment variables (defined in `.env.example`).
**NOTE:** Do not commit actual credential values to version control.

| Variable Name | Description |
|---|---|
| `PORT` | Local HTTP port for the Express application server |
| `NODE_ENV` | Runtime environment mode (`development`, `production`, `test`) |
| `STORAGE_DRIVER` | Persistence adapter (`local` for flat-file JSON, `aws` for DynamoDB/S3) |
| `DATA_DIR` | Directory path for local flat-file submission storage |
| `SUBSCRIBERS_DB_FILE` | File path for email subscriber persistence |
| `AWS_REGION` | AWS Region for DynamoDB, S3, and SES |
| `DYNAMODB_TABLE_NAME` | Name of the DynamoDB table for form submissions |
| `UPLOADS_BUCKET_NAME` | Name of private Amazon S3 bucket for CV uploads |
| `ADMIN_NOTIFICATION_EMAIL`| Recipient email address for new submission notifications |
| `SENDER_EMAIL` | Verified SES sender email address for outgoing notifications |
| `ADMIN_API_KEY` | Secret bearer header key required for `/api/metrics` access |
| `SEND_CONFIRMATIONS` | Flag to enable applicant confirmation emails (`false` recommended in SES sandbox) |
| `WHATSAPP_PHONE_NUMBER` | Contact phone number for WhatsApp parent chat links |
| `FORM_RATE_LIMIT_MAX` | Maximum allowed form submissions per IP per 15-minute window |
| `TRUST_PROXY` | Express trust proxy setting for reverse proxies / load balancers |

---

## 4. Safe Cloud Deployment Order

To deploy this application to AWS production safely and with zero downtime:

1. **Step 1: Owner Review of Infrastructure**
   Review `infra/tutortime-stack.yaml` and verify all parameter defaults, retention rules, and least-privilege IAM policies.
2. **Step 2: Deploy CloudFormation Stack**
   Deploy `tutortime-stack.yaml` in AWS Region `us-east-2` to create the DynamoDB table, private S3 uploads bucket, and IAM managed policy.
3. **Step 3: Attach IAM Policy to EC2 Instance Role**
   Attach the policy output from CloudFormation to the existing EC2 instance profile. Do not create new long-lived IAM access keys.
4. **Step 4: Update Production Server Configuration**
   Update the production `.env` file with `STORAGE_DRIVER=aws`, `DYNAMODB_TABLE_NAME`, and `UPLOADS_BUCKET_NAME`.
5. **Step 5: Process Restart & Smoke Testing**
   Restart the Node.js application process (via PM2 or systemd). Submit one test enquiry on `/contact` and verify that the item is written to DynamoDB with status `PENDING_REVIEW`.
6. **Step 6: Verified Rollback Readiness**
   In the event of cloud errors, immediately revert `.env` to `STORAGE_DRIVER=local` and restart the process; submissions will continue saving locally to disk without service disruption.
