# Tutor Time / Popcorn Maths — System Architecture & Onboarding Audit

**Document:** System Architecture & Repository Audit  
**Author:** Nathaniel Handan  
**Reviewer:** Oyeneyin Abiodun  
**Date:** 2026-10-17  
**Branch:** `feature/onboarding-audit`  
**Repository:** `Edn_Application_Repo`  

> [!NOTE]  
> This document describes what the repository does, not what is currently deployed; deployed AWS state is unverified until access is granted.

---

## 1. Executive Summary & Application Overview

### Purpose
The repository hosts the initial public-facing landing and interest-capture platform for **Popcorn Maths** (an educational initiative under the **Tutor Time** umbrella). The application currently operates as a coming-soon launch countdown page designed to capture prospective student and parent email subscriptions prior to full service rollout.

### Target Vision (per TRD v0.1)
The long-term objective is a **modular monolith** running four core service modules:
1. **Traditional Tutoring** (1-on-1 tutoring sessions)
2. **Concierge (Premium)** (AI-driven tutoring & performance assessment)
3. **Popcorn Maths** (Community-based peer tutoring by under-18 tutors for 8–13 year-olds across designated school hubs in Anguilla and Nigeria)
4. **Specialist Learning Support** (ADHD and neurodivergent learning assistance)

### Current Tech Stack
- **Frontend:** Static HTML5, CSS3 (custom CSS custom properties, glassmorphism card UI, responsive design), Vanilla JavaScript countdown timer & AJAX form submission (`fetch`).
- **Active Backend:** Node.js (Node 24 Alpine) with Express.js (`^5.2.1`), `body-parser` (`^2.2.2`), and `dotenv` (`^17.4.2`).
- **Legacy / Secondary Backend:** Python 3 (`Flask==2.3.3`, `Flask-SQLAlchemy==3.0.5`, `SQLAlchemy==2.0.21`, `python-dotenv==1.0.0`).
- **Data Storage (Active):** Local flat file (`subscribers.json`) — **DynamoDB is not yet connected in the code**.
- **Data Storage (Legacy Flask):** Local SQLite file (`sqlite:///subscribers.db`).
- **Observability:** OpenTelemetry Collector image definition configured for AWS X-Ray and Amazon Managed Prometheus (AMP) remote write in `us-east-2`.
- **Packaging & Containerization:** Docker (`Dockerfile`, `Dockerfile.otel-collector`, `docker-compose.yml`), ECS Fargate Task Definitions.
- **Hosting / Cloud:** AWS ECS Fargate / EC2 (historical references to `us-east-1` and `us-east-2`).

---

## 2. Repository Structure & Component Responsibilities

```
Edn_Application_Repo/
├── .env.example                          # Sample environment configuration (Flask/SMTP format)
├── .gitignore                             # Git ignore rules (node_modules, logs, .env, subscribers.json, SECURITY_FINDINGS_PRIVATE.md)
├── ARCHITECTURE.md                       # This document (Architecture & repository audit)
├── AWS_ECS_DEPLOYMENT.md                 # Deployment runbook for ECS Fargate
├── AWS_ECS_QUICK_START.md                # Fast deployment guide for AWS ECS
├── AWS_TROUBLESHOOTING_CHECKLIST.md      # Manual EC2/VPC network troubleshooting guide
├── COMPLETION_SUMMARY.md                 # Documentation from previous backend implementation
├── Dockerfile                            # Production container image for Node.js Express server
├── Dockerfile.otel-collector             # Container image packaging OpenTelemetry Collector
├── IMPLEMENTATION_SUMMARY.md             # Implementation notes for Python/Flask email system
├── INDEX.md                              # Consolidated documentation index
├── NODEJS_SETUP.md                       # Node.js local development instructions
├── PYTHON_INSTALLATION.md                # Python environment setup guide
├── QUICK_START.md                        # Quick reference guide for local execution
├── README.md                             # Repository title stub
├── SECURITY_FINDINGS_PRIVATE.md          # [GITIGNORED] Segregated private security & privacy audit findings
├── SETUP_GUIDE.md                        # Setup and verification manual
├── deploy-to-ecs.ps1                     # PowerShell automation script for AWS ECS deployment
├── deploy-to-ecs.sh                      # Bash automation script for AWS ECR/ECS deployment
├── docker-compose.yml                    # Local multi-container Docker Compose configuration
├── ecs-task-definition.json              # ECS Task Definition template (popcorn-maths-email-service)
├── ecs-task-definition-with-otel.json    # ECS Task Definition with OpenTelemetry Collector sidecar
├── export-subscribers.ps1                # PowerShell script to export subscribers to Excel
├── export-subscribers.py                 # Empty Python script stub (0 bytes)
├── otel-collector-config.yaml            # Pipeline config for OTel Collector (X-Ray + AMP)
├── package.json                          # Node.js project manifest and dependencies
├── requirements.txt                      # Python dependencies (Flask, SQLAlchemy)
├── run.bat                               # Windows launcher for legacy Python Flask server
├── server.js                             # Active Express.js server, API routes & static routing
├── start-server.bat                      # Windows launcher for active Node.js server
├── subscribers_20260606_202810.xlsx      # Committed Excel spreadsheet containing subscriber exports
├── subscribers_20260606_202852.xlsx      # Committed Excel spreadsheet containing subscriber exports
└── MyWebApp/                             # Web application frontend assets & static pages
    ├── pom.xml                           # Java Maven project descriptor (legacy artifact)
    └── src/main/webapp/
        ├── assets/
        │   └── logos/
        │       └── README.md             # Expected brand assets, dimensions, and naming guide
        ├── css/
        │   ├── tokens.css                # Centralized CSS design tokens (brand colors, typography, spacing)
        │   └── components.css            # Reusable UI component styles (.service-card, .btn, grid, banner)
        ├── js/
        │   └── services-data.js          # Shared service descriptors array & dynamic card renderer
        ├── services/                     # Dedicated individual service landing pages
        │   ├── concierge.html            # Concierge (premium AI tutoring) service page
        │   ├── popcorn-maths.html        # Popcorn Maths service page + school program CTA placeholder
        │   ├── specialist-support.html   # Specialist Learning Support service page
        │   └── traditional-tutoring.html # Traditional Tutoring service page
        ├── finalnewmathapo-01.png        # Popcorn Maths brand logo image
        ├── flasktest.py                  # Standalone Python/Flask subscription backend
        ├── index.html                    # Responsive main overview page (banners, service cards, countdown)
        └── WEB-INF/
            └── web.xml                   # Java Servlet deployment descriptor (legacy artifact)
```

---

## 3. Request & Data Flow

### Ideal / Architectural Intent
```
Client Browser
      │
      ▼
Route 53 (DNS)
      │
      ▼
Application Load Balancer (ALB) [HTTPS / Port 443]
      │
      ▼ (Target Group / Port 5001)
AWS ECS Fargate Task / EC2 Instance (`edn-app`)
      │
      ▼ (AWS SDK v3 / IAM Task Role)
Amazon DynamoDB (`tutortime-subscribers` table)
```

### Actual Code Implementation Reality
Tracing the code in `server.js` and `MyWebApp/src/main/webapp/`:

```
1. Main Overview Landing Page:
   User visits http://<host>:5001/
         │
         ▼
   Express static middleware / route serves `MyWebApp/src/main/webapp/index.html`
   - Dynamically renders 4 reusable service cards via `js/services-data.js`
   - Displays promotional banners, active countdown timer, and email subscription form
   - Contains structural placeholder for future conversational AI chatbot

2. Service Detail Exploration:
   User clicks "Explore Service" on any card or visits http://<host>:5001/services/<slug>
         │
         ▼
   Express route `GET /services/:slug` serves `MyWebApp/src/main/webapp/services/<slug>.html`
   - Displays service hero, neutral logo placeholder box, and `TODO(content)` descriptions
   - Includes synchronized countdown timer and prominent back-link to main overview page
   - Popcorn Maths includes non-functional "Request a School Program" button placeholder

3. Email Subscription Submission:
   User inputs email into form & clicks "Notify Me"
         │
         ▼
   Browser JavaScript sends `POST /subscribe` with `{ "email": "user@example.com" }`
         │
         ▼
   Express `app.post('/subscribe')` in `server.js`:
     1. Regex validation (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
     2. Reads `subscribers.json` from the local container disk via `fs.readFileSync`
     3. Checks for duplicates in memory
     4. Appends `{ email, subscribedAt, confirmed: false }`
     5. Writes back to local disk via `fs.writeFileSync` (`subscribers.json`)
     6. Logs fake confirmation email to stdout (actual SMTP commented out)
     7. Returns HTTP 201 `{ success: true, message: "Successfully subscribed!..." }`
```

> [!WARNING]
> **No DynamoDB in Code:** Despite the TRD specifying DynamoDB on-demand, `server.js` does not import `@aws-sdk/client-dynamodb` or `aws-sdk`. All writes are made to local file `subscribers.json`. In a containerized environment (Docker/ECS), disk state is ephemeral; tasks rescheduling or redeploying will drop all subscriber data.

---

## 4. DynamoDB Tables & Data Model (As-Is vs. To-Be)

### Current Code Usage
- **DynamoDB Tables Used in Code:** **None**.
- **Active Data Model (`subscribers.json`):**
  ```json
  {
    "subscribers": [
      {
        "email": "string (lowercase, unique)",
        "subscribedAt": "ISO 8601 string (e.g. 2026-10-17T11:00:00.000Z)",
        "confirmed": false
      }
    ]
  }
  ```
- **Legacy Python Model (`flasktest.py` via SQLite):**
  - Table: `subscribers`
  - Columns: `id` (INTEGER PK), `email` (VARCHAR(255) UNIQUE), `subscribed_at` (DATETIME), `confirmed` (BOOLEAN).

### Target DynamoDB Design (Sprint 1 Recommendation)
To align the application with the TRD requirements:
- **Table Name:** `tutortime-subscribers` (or `popcorn-maths-subscribers`)
- **Billing Mode:** PAY_PER_REQUEST (On-Demand capacity to maintain zero idle cost)
- **Primary Key:**
  - **Partition Key (`PK`):** `email` (String)
- **Attributes:**
  - `subscribed_at` (String, ISO 8601)
  - `confirmed` (Boolean)
  - `source` (String, e.g., `"popcorn-maths-landing"`)
  - `status` (String, e.g., `"active"`)

---

## 5. Configuration & Environment Variables (Names Only)

### Active Node.js Application (`server.js`)
| Variable Name | Purpose | Default in Code |
|---|---|---|
| `PORT` | Listening HTTP port | `5001` |
| `SENDER_EMAIL` | Outbound email address (commented nodemailer code) | None |
| `SENDER_PASSWORD` | Outbound SMTP password (commented nodemailer code) | None |

### ECS Task Definitions (`ecs-task-definition*.json`)
| Variable Name | Scope | Defined In |
|---|---|---|
| `PORT` | Container environment | `5001` |
| `NODE_ENV` | Runtime environment | `production` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTel Collector gRPC endpoint | `http://localhost:4317` |
| `OTEL_SERVICE_NAME` | Service identity for tracing | `edn-app` |
| `OTEL_TRACES_EXPORTER` | Trace export protocol | `otlp` |
| `OTEL_METRICS_EXPORTER` | Metrics export protocol | `otlp` |
| `GOGC` | Go Garbage Collector threshold for OTel collector | `80` |
| `SENDER_EMAIL` | Injected via AWS Secrets Manager | `popcorn-maths/sender-email` |
| `SENDER_PASSWORD` | Injected via AWS Secrets Manager | `popcorn-maths/sender-password` |

### Legacy Python Application (`flasktest.py` / `.env.example`)
| Variable Name | Purpose |
|---|---|
| `DATABASE_URL` | SQLAlchemy connection string |
| `SMTP_SERVER` | SMTP server hostname |
| `SMTP_PORT` | SMTP port |
| `SENDER_EMAIL` | Sender email address |
| `SENDER_PASSWORD` | SMTP password / app password |
| `FLASK_ENV` | Flask environment |
| `FLASK_DEBUG` | Flask debug flag |

---

## 6. Infrastructure-as-Code & Container Artifacts

| File | Type | What It Defines |
|---|---|---|
| `Dockerfile` | Container Definition | Alpine Node 24 runtime; installs production packages; copies `server.js` and `MyWebApp`; exposes port 5001; defines 30s HTTP health check. |
| `Dockerfile.otel-collector` | Container Definition | Packages `otel/opentelemetry-collector:latest` with custom `otel-collector-config.yaml`. |
| `docker-compose.yml` | Local Orchestration | Single service `popcorn-maths` building root Dockerfile; maps port 5001; mounts `./subscribers.json`. |
| `ecs-task-definition.json` | AWS ECS Spec | Fargate task definition `popcorn-maths-email-service` (256 CPU / 512 MB RAM) pulling from ECR with CloudWatch logs `/ecs/popcorn-maths`. |
| `ecs-task-definition-with-otel.json` | AWS ECS Spec | Dual-container Fargate task `edn-app-with-otel` (512 CPU / 1024 MB RAM) featuring `edn-app` and `otel-collector` sidecar. |
| `otel-collector-config.yaml` | Telemetry Spec | OpenTelemetry Collector pipeline accepting OTLP on 4317/4318; exporting traces to AWS X-Ray (`us-east-2`) and metrics to AMP (Prometheus Remote Write). |
| `deploy-to-ecs.sh` | Deployment Automation | Interactive Bash script: creates ECR repository, builds/tags/pushes Docker image, registers ECS task definition, creates CloudWatch log group, updates ECS service. |
| `deploy-to-ecs.ps1` | Deployment Automation | PowerShell equivalent of `deploy-to-ecs.sh`. |

> [!NOTE]
> **No Declarative Cloud IaC:** There are no Terraform, AWS CDK, or CloudFormation templates in the repository for VPC, Subnets, Routing, ALBs, Security Groups, or DynamoDB tables. Infrastructure setup appears to have been performed manually or via CLI.

---

## 7. Audit Findings: Unused, Duplicated, or Suspicious Items

> [!NOTE]
> **Security & Privacy Findings Segregated:** Critical security and privacy audit findings (including PII handling, endpoint access controls, and infrastructure permissions) have been segregated into `SECURITY_FINDINGS_PRIVATE.md` (which is excluded from version control via `.gitignore`) to protect operational security.

### ⚠️ Functional & Architectural Inconsistencies
1. **Missing DynamoDB Implementation:**
   - The primary functional gap: the architecture assumes Route 53 → ALB → App → DynamoDB, but `server.js` only writes to local disk `subscribers.json`.
2. **Ephemeral Storage Data Loss Risk:**
   - `Dockerfile` does not define a volume for `/app/subscribers.json`. On ECS Fargate, every task restart or deployment creates a fresh container filesystem, resulting in the permanent loss of all captured emails.
3. **Dual / Redundant Backends:**
   - Node.js Express (`server.js`) and Python Flask (`MyWebApp/src/main/webapp/flasktest.py`) both exist in the repository to accomplish the exact same task.
   - `Dockerfile` runs Node.js, while `run.bat` and several README docs instruct the user to run Python.
4. **Leftover Maven / Java EE Scaffolding:**
   - `MyWebApp/pom.xml` and `MyWebApp/src/main/webapp/WEB-INF/web.xml` are lingering artifacts from an empty Java archetype.
5. **Phantom / Empty Python Script:**
   - `export-subscribers.py` is an empty 0-byte file, yet `export-subscribers.ps1` explicitly checks for and executes it.
6. **Package.json Inconsistency:**
   - `package.json` specifies `"main": "index.js"`, but no `index.js` exists (`server.js` is the entry point).
7. **Unconnected OpenTelemetry Instrumentation:**
   - `ecs-task-definition-with-otel.json` launches an OTel collector sidecar and sets `OTEL_*` environment variables on `edn-app`, but `server.js` does not load `@opentelemetry/sdk-node` or any tracing SDK. The collector runs idle.

---

## 8. Open Questions for the Project Owner (Oyeneyin Abiodun)

1. **Production AWS Environment & Region:**
   - Which AWS Account ID and region is designated as canonical production (`us-east-1` vs `us-east-2`)?
2. **DynamoDB Migration:**
   - May we proceed with wiring `@aws-sdk/client-dynamodb` into `server.js` and creating the on-demand table (e.g. `tutortime-subscribers`) to eliminate the ephemeral file storage?
3. **Backend Consolidation:**
   - Can we formally deprecate and remove the Python Flask prototype (`flasktest.py`, `requirements.txt`, `run.bat`) and the Java Maven files (`pom.xml`, `web.xml`) to establish Node.js as the sole backend?
4. **Subscriber Data Cleansing:**
   - How would you like to handle the committed Excel files (`subscribers_*.xlsx`)? Should they be removed and added to `.gitignore`?
5. **Admin Endpoint Security:**
   - Should `GET /subscribers` be removed, restricted to local development, or protected by an admin API key / basic authentication?
6. **OpenTelemetry Strategy:**
   - For the AIOps research paper, do you want auto-instrumentation via `@opentelemetry/auto-instrumentations-node` in the container startup, or manual span creation in `server.js`?
7. **Modular Monolith Transition:**
   - What directory structure do you prefer for scaffolding the four upcoming modules (Traditional Tutoring, Concierge, Popcorn Maths, Specialist Support) — e.g., `src/modules/<module-name>/`?
