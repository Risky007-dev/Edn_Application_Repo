# Data Retention Schedule & Disposal Policy

> **CONFIDENTIAL & GOVERNANCE DOCUMENTATION**  
> **Platform:** Tutor Time with Teacher Cassie & Popcorn Math  
> **Target Review Date:** November 20, 2026 (Sprint 3)  
> **Status:** Draft / Awaiting Owner Approval  

---

## 1. Overview & Objectives

This Data Retention Schedule defines the standard retention periods, storage locations, access authorizations, and disposal mechanisms for all categories of personal and operational data processed across **Tutor Time with Teacher Cassie** and **Popcorn Math**.

Our data governance operates on the strict principle of **Data Minimisation**: data is held only as long as strictly necessary to fulfill the intended educational, administrative, or legal purpose, after which it is securely and irreversibly purged.

---

## 2. Comprehensive Data Inventory & Storage Architecture

| Data Category | Specific Data Elements | Intake Channel / Route | Primary Storage Location | Access Authorisation | Current Retention | Proposed Retention |
|---|---|---|---|---|---|---|
| **Consultation Bookings** | Parent full name, contact email, phone number, child grade level, focus area, optional notes. *Zero child names collected.* | `POST /api/forms/book-consultation` | Local: `data/tutortime-submissions.json`<br>AWS: DynamoDB `TutorTimeSubmissions` | Teacher Cassie, Administrative Staff | **Indefinite** (No automated purge) | **12 Months** following initial consultation date or school term conclusion. |
| **Parent Registrations (Popcorn Math)** | Parent full name, contact email, phone number, child grade (Grades 1–5), preferred school cohort, optional message. *Zero child names.* | `POST /api/forms/popcorn-parent-interest` | Local: `data/tutortime-submissions.json`<br>AWS: DynamoDB `TutorTimeSubmissions` | Teacher Cassie, Administrative Staff | **Indefinite** (No automated purge) | **12 Months** from term registration enquiry. |
| **School Partnership Enquiries** | Contact person name, official title, school/institution name, official email, phone, estimated student cohort (10–500), program format. | `POST /api/forms/school-enquiry` | Local: `data/tutortime-submissions.json`<br>AWS: DynamoDB `TutorTimeSubmissions` | Teacher Cassie, Platform Owner | **Indefinite** (No automated purge) | **24 Months** to maintain institutional relationship continuity, or upon school request. |
| **Individualised Learning Support** | Parent name, email, phone, general learning strengths, study habits/executive functioning focus. *Zero medical/clinical data.* | `POST /api/forms/learning-needs` | Local: `data/tutortime-submissions.json`<br>AWS: DynamoDB `TutorTimeSubmissions` | Teacher Cassie (strictly restricted) | **Indefinite** (No automated purge) | **12 Months** following consultation or duration of active tutoring relationship. |
| **Concierge Academic Coaching** | Parent name, email, phone, grade level, academic goals, executive scheduling preferences. | `POST /api/forms/concierge-application` | Local: `data/tutortime-submissions.json`<br>AWS: DynamoDB `TutorTimeSubmissions` | Teacher Cassie, Administrative Staff | **Indefinite** (No automated purge) | **12 Months** following intake. |
| **Presenter Applications (Candidate Data)** | Candidate name (18+ only), email, phone, educational background, personal statement, CV S3 key reference. | `POST /api/forms/presenter-application` | Local: `data/tutortime-submissions.json`<br>AWS: DynamoDB `TutorTimeSubmissions` | Teacher Cassie, Platform Administrator | **Indefinite** (No automated purge) | **180 Days (6 Months)** from date of application submission. |
| **Presenter CV Uploads (PDF Files)** | Unencrypted curriculum vitae PDF documents submitted via presigned S3 POST. Max 5 MB. | `POST /api/uploads/presign`<br>& S3 bucket upload | AWS S3 Bucket: `cv-uploads/{timestamp}_{uuid}.pdf`<br>Local: `data/mock-uploads/` | Platform Administrator, Teacher Cassie | **180 Days (6 Months)** confirmed via S3 Lifecycle rule. | **180 Days (6 Months)** strictly maintained via automated S3 bucket lifecycle rule. |
| **Newsletter Subscribers** | Email address, subscription timestamp, confirmation status flag. | `POST /subscribe` | Local: `data/subscribers.json`<br>Production DynamoDB | Platform Administrator | **Indefinite** until user requests unsubscription. | **Active until Unsubscribe** + annual reconfirmation prompt. |
| **AI Chatbot Interactions ("Tutor Time Helper")** | User questions, message turns, generated responses, citations. | `POST /api/chat` | **ZERO PERSISTENCE**<br>Stateless RAM only; zero database storage; zero transcript logging. | None (No human access possible) | **0 Seconds** (Transitory stream only; purged upon response transmission). | **0 Seconds (Zero Retention)** strictly maintained. |
| **Server & Operational Logs** | HTTP method, route path, status code, response duration, synthetic trace UUID, client IP hash. *Zero PII, zero emails, zero phone numbers.* | Stderr / Stdout container logs; CloudWatch Log Streams | Container process stdout;<br>AWS CloudWatch Log Groups | Platform Administrator | Transient container lifetime;<br>CloudWatch default. | **30 Days** rolling retention window in CloudWatch. |
| **Aggregate Security Telemetry** | Monotonic counters of form submission counts, rate limit trips, chatbot daily request count. *Zero personal data.* | In-memory counters (`submissionMetrics`, `dailyRequests`) | Node.js process heap memory; reset upon process restart | Platform Administrator | Transient process lifecycle | Reset daily / process lifetime. |

---

## 3. Compliance Gaps & Required Remediations

An audit of current storage mechanisms identifies three key compliance gaps requiring owner action prior to full production launch:

### ⚠️ Gap 1: DynamoDB Submissions Lack Automated TTL
- **Current State:** Submissions written to DynamoDB via `awsDriver.js` do not include a Unix epoch timestamp attribute for DynamoDB Time to Live (TTL). As a result, database records remain indefinitely unless manually deleted.
- **Remediation Plan:**
  1. Add an `expireAt` attribute (Unix epoch in seconds) calculated at submission time based on form type (e.g., `now + 180 days` for presenters; `now + 365 days` for parent inquiries).
  2. Enable native DynamoDB TTL on the `TutorTimeSubmissions` table targeting the `expireAt` attribute.
  3. Cost impact: DynamoDB TTL purges expired items automatically at zero additional AWS read/write cost.

### ⚠️ Gap 2: Local File Storage Mode Lacks Automated Purge
- **Current State:** In local development and offline preview environments, `tutortime-submissions.json` appends records continuously without an expiration mechanism.
- **Remediation Plan:**
  1. Implement a scheduled maintenance script (`npm run purge:expired`) that reads records and prunes entries older than their retention window.
  2. Ensure testing suites continue to operate with isolated ephemeral directories.

### ⚠️ Gap 3: Formal Owner Ratification of Retention Windows
- **Current State:** The 180-day retention window for candidate CVs was formally confirmed on Nov 2, 2026. However, general inquiry retention (proposed at 12 months) and school partnership retention (proposed at 24 months) require formal owner approval.
- **Action Required:** Abiodun Oyeneyin must review and approve these proposed windows in Sprint 3 Task 7.

---

## 4. Secure Disposal & Deletion Procedures

When data reaches its retention expiration or when a verified parental deletion request is received:
1. **DynamoDB Records:** Purged automatically by DynamoDB TTL daemon within 48 hours of expiration, or immediately via administrative `DeleteCommand`.
2. **S3 CV Uploads:** Purged automatically by Amazon S3 Lifecycle rule `expire-after-180-days` at 00:00 UTC following the 180th day.
3. **Local Files:** Removed via atomic rewrite of `tutortime-submissions.json` omitting the target record ID.
4. **Third-Party AI Processors:** Anthropic Claude API interactions are stateless; requests are not stored or used to train models per Anthropic commercial terms.
