# Launch-Blocker Open Decisions & Owner Sign-Off Checklist

> **PROJECT:** Tutor Time with Teacher Cassie & Popcorn Math  
> **TARGET RESOLUTION DATE:** November 20, 2026 (Sprint 3)  
> **OWNER / REVIEWER:** Abiodun Oyeneyin (`112614068`) & Kashamar Lewis (`112627225`)  
> **TRACKING TASK:** ClickUp Sprint 3 Legal Pack Task  

---

## 1. Overview

Before public domain cutover to `tutortime.ai` and live intake of parent inquiries, the project owner and founder must formalize five key operational, legal, and financial decisions. Each item below provides the recommended default, technical implications, and required action.

---

## 2. Open Decisions Checklist

### ☐ Decision 1: Data Retention Schedule & Automated DynamoDB TTL
- **Context:** Currently, candidate CVs in Amazon S3 expire after 180 days via automated lifecycle rules. However, intake form submissions in DynamoDB (`TutorTimeSubmissions`) lack an automated expiration mechanism.
- **Proposed Windows:**
  - Parent consultation requests & general inquiries: **12 months** from submission or school term conclusion.
  - School partnership inquiries: **24 months** to maintain multi-year institutional relationships.
  - Popcorn Math presenter candidate profiles: **180 days (6 months)**, matching the S3 CV lifecycle.
- **Recommended Action:** **Approve proposed retention schedule.** Authorize adding an `expireAt` Unix epoch attribute to DynamoDB items and enabling native DynamoDB TTL in CloudFormation at zero additional AWS cost.
- **Decision-Maker:** Abiodun Oyeneyin.

---

### ☐ Decision 2: Governing Legal Jurisdiction & Privacy Framework
- **Context:** The public privacy policy and terms of use must state the governing jurisdiction for dispute resolution and statutory data protection compliance.
- **Options:**
  - *Option A (Recommended):* **Anguilla, British West Indies** (Domestic primary jurisdiction where in-person Popcorn Math sessions operate).
  - *Option B:* Multi-jurisdictional hybrid covering Anguilla and international best practices (UK GDPR parity).
- **Recommended Action:** **Confirm Option A with counsel.** Designate Anguilla as primary governing law with international privacy standards for web visitors.
- **Decision-Maker:** Abiodun Oyeneyin / Legal Counsel.

---

### ☐ Decision 3: Legal Entity Name & Formal Data Controller
- **Context:** The privacy notice currently identifies the Data Controller as *"Tutor Time Educational Services / Teacher Cassie"*. A formal business entity or registered trade name must be designated.
- **Options:**
  - *Option A:* Registered business corporation (e.g. `Tutor Time Educational Services Ltd.` or similar Anguillian registered entity).
  - *Option B:* Sole proprietorship / trading name (e.g. `Kashamar Lewis trading as Tutor Time with Teacher Cassie`).
- **Recommended Action:** **Confirm official registration name with Kashamar Lewis.**
- **Decision-Maker:** Kashamar Lewis & Abiodun Oyeneyin.

---

### ☐ Decision 4: Designated Safeguarding & Child Protection Lead
- **Context:** Under our Safeguarding & Child Protection Policy and Presenter Code of Conduct, a specific individual must be named as the Designated Safeguarding Lead (DSL) with contact information for classroom incidents or child welfare escalation.
- **Recommendation:** **Designate Kashamar Lewis (Teacher Cassie) as Designated Safeguarding Lead**, with an escalation contact number provided to all host primary headteachers and presenters.
- **Decision-Maker:** Kashamar Lewis.

---

### ☐ Decision 5: Anthropic Monthly Spend Cap & Production API Key Provisioning
- **Context:** The "Tutor Time Helper" Claude-powered chatbot is implemented with in-application guardrails (daily cap of 200 requests, per-IP rate limits, 500-char input limit). However, the Anthropic Console account itself requires a hard monthly spend cap to guarantee cost control.
- **Action Required:**
  1. Set a hard monthly spend limit in the Anthropic Console (recommended: **$25.00 – $50.00 / month** for initial launch).
  2. Generate a dedicated production API key (`sk-ant-api03-...`) with restricted permissions.
  3. Store the key in production environment variables (`ANTHROPIC_API_KEY`) and never commit to Git.
- **Tracking Task:** ClickUp task `123u8tyqamb`.
- **Decision-Maker:** Abiodun Oyeneyin.

---

## 3. Sign-Off Log

| Decision | Approved By | Signature / Confirmation | Date |
|---|---|---|---|
| **1. Data Retention & TTL** | Abiodun Oyeneyin | Pending | `YYYY-MM-DD` |
| **2. Governing Jurisdiction** | Abiodun Oyeneyin / Counsel | Pending | `YYYY-MM-DD` |
| **3. Legal Entity Name** | Kashamar Lewis | Pending | `YYYY-MM-DD` |
| **4. Safeguarding Lead** | Kashamar Lewis | Pending | `YYYY-MM-DD` |
| **5. Spend Cap & Key** | Abiodun Oyeneyin | Pending | `YYYY-MM-DD` |
