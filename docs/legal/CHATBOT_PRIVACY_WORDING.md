# Chatbot Privacy Policy & Widget Disclosures

> **LEGAL REVIEW NOTICE:**  
> The wording in this document is proposed for public deployment across `tutortime.ai` and within the "Tutor Time Helper" interactive widget.  
> **STATUS:** `TO CONFIRM WITH COUNSEL` prior to final production release.  

---

## 1. Public Privacy Policy Section: "Interactive AI Assistant (Tutor Time Helper)"

*Proposed text for insertion into `/privacy` and the project `PRIVACY_POLICY.md`:*

```markdown
### 7. Interactive AI Assistant ("Tutor Time Helper")

#### 7.1 Overview & Identification
Our website provides an interactive conversational assistant named **Tutor Time Helper** to assist parents, educators, and students with general questions about Tutor Time's educational programmes, the Popcorn Math enrichment schedule, Caribbean primary examination readiness (CPEA style), and study strategies. 

**Tutor Time Helper is an artificial intelligence (AI) assistant powered by Anthropic's Claude API.** It is not a real person, and it is not Teacher Cassie (Kashamar Lewis) or a human tutor.

#### 7.2 Zero Personal Data Collection & No Conversation Storage
We adhere to strict data minimisation and child privacy standards:
- **No Conversation Storage:** We do not record, store, log, or maintain conversation transcripts on our servers or databases. Once a chat session ends or your browser window is closed, your messages are permanently discarded from server memory.
- **Do Not Share Personal Information:** Users must not input personal identifiable information (PII)—including your child's full name, date of birth, age, residential address, telephone number, email, or school name—into the chat window. The assistant is programmed to decline requests containing sensitive personal details.
- **Zero Profiling & Zero Tracking:** Chatbot interactions are not linked to your IP address, cookies, user profiles, or intake form submissions. We do not track or profile children across visits.

#### 7.3 Readiness Check Result Sharing & Voluntary Booking Attachment (PROPOSED-COPY)
- **Zero Automatic Storage:** Sample Readiness Check sessions (Mathematics and Language Arts) run solely in your browser's temporary memory. Scores are never saved in `localStorage`, `sessionStorage`, cookies, or Tutor Time databases automatically.
- **Voluntary Chatbot Result Sharing:** If you choose to click **"Talk about my results"** after completing a sample check, only three non-identifying fields—**subject, score out of 10, and readiness band** (with no child name, age, or contact details)—are sent transiently with your message to the Anthropic Claude API so Tutor Time Helper can explain suggested programmes. That summary is discarded when you leave or close the page.
- **Voluntary Consultation Booking Attachment:** If a parent chooses to tick the opt-in checkbox on our [Book a Consultation](/book) page (unchecked by default), that same non-identifying summary (subject, score, and band) is stored with the parent's consultation request and emailed to Teacher Cassie solely to help prepare for the consultation.

#### 7.4 Third-Party AI Processing (Anthropic PBC)
When you submit a message through the Tutor Time Helper:
- Your query (and, only if you choose "Talk about my results", your non-identifying subject, score, and band summary) is transmitted securely via TLS 1.3 encryption directly to the Anthropic Claude API (`api.anthropic.com`) for the sole purpose of generating an immediate conversational response.
- In accordance with Anthropic’s commercial data protection and privacy terms, customer inputs and completions submitted via the commercial API are **not used to train or fine-tune foundation models**, and are discarded after transient generation.

#### 7.5 Real-Time Web Search Retrieval
To provide accurate, up-to-date educational context, the assistant may perform targeted web searches via Anthropic’s search retrieval tool. When web search is utilized to formulate a reply, the specific source citations and reference links are displayed directly inside the chat window for complete transparency.

#### 7.6 Scope & Disclaimers
The Tutor Time Helper is an informational guide only. It cannot schedule appointments, process payments, submit applications, or alter student records. 
- **No Official Advice:** The assistant does not provide medical, psychological, diagnostic, safeguarding, or formal legal advice.
- **Pricing & Policies:** Specific program fees, official school rosters, and formal admissions decisions are not quoted by the assistant. For confirmed details or consultation bookings, parents should visit our [Book a Consultation](/book) page or contact Teacher Cassie directly via WhatsApp.
```

---

## 2. On-Widget Privacy Notice (In-App Disclosure)

*Exact concise wording embedded directly in the frontend chat widget modal above the input box:*

```html
<div class="chatbot-privacy-notice" role="note">
  <p>🤖 <strong>Tutor Time Helper is an AI assistant.</strong> Please don't share personal details (such as your or your child's full name, phone, or school). We do not save or record chat conversations. See our <a href="/privacy#chatbot" target="_blank" rel="noopener">Privacy Policy</a>.</p>
</div>
```

---

## 3. Counsel Verification Checklist

Counsel should specifically verify:
- [ ] Compliance with Anguilla Data Protection legislation and Caribbean regional privacy benchmarks.
- [ ] Conformance with Anthropic Commercial API Terms of Service regarding third-party subprocessors.
- [ ] Adequacy of child safeguarding disclaimers under UK/Commonwealth educational standards.
- [ ] Alignment with our zero-cookie / zero-telemetry technical implementation.
