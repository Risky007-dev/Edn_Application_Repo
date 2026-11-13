# Tutor Time Helper — AI Assistant Architecture & Operations Runbook

## 1. Overview & Purpose
**Tutor Time Helper** is an AI-powered conversational study assistant on the Tutor Time platform. It answers questions from parents, learners, and educators about Tutor Time programmes (Personalised Tutoring, Concierge Academic Coaching, Popcorn Math, Individualised Support, and the CPEA Readiness Check) as well as general homework, study, and math practice questions.

### Strict Scope Limits
- **Conversational Q&A Only**: The assistant is strictly informative; it cannot navigate the browser, fill out forms, process bookings, or alter application state.
- **AI Identity**: The assistant introduces itself as an AI helper and never poses as Teacher Cassie or Kashamar Lewis.
- **Safe Tone**: Warm, child-friendly, encouraging, and clear for ages 6–12 and parents.

---

## 2. Environment Variables & Configuration

| Variable | Type | Default | Description |
|---|---|---|---|
| `FEATURES_CHATBOT_ENABLED` | Boolean | `true` | Master kill-switch. When `false`, the widget is hidden and `/api/chat` returns 503. |
| `ANTHROPIC_API_KEY` | String | *(None)* | Secret Anthropic API key. When omitted, the widget renders an explicit "Chat is currently unavailable" state (disabled input, contact/booking links) and startup logs a warning. Never exposed to front-end. |
| `CHATBOT_MODEL` | String | `claude-haiku-5-5` | Anthropic Claude model version (`CLAUDE_MODEL` also supported as fallback). |
| `CHATBOT_DAILY_REQUEST_CAP` | Number | `200` | Process-level hard cap on queries per calendar day across all users. |
| `CHATBOT_RATE_LIMIT_MAX` | Number | `10` | Maximum requests per IP address within the rate-limit window. |
| `CHATBOT_RATE_LIMIT_WINDOW_MINUTES` | Number | `10` | IP rate-limit time window in minutes. |
| `CHATBOT_MAX_INPUT_LENGTH` | Number | `500` | Maximum character length allowed for user input. |

---

## 3. How It Works (Backend & Frontend Architecture)

```
[ User in Browser ] 
        │ (POST /api/chat with user message & history)
        ▼
[ Express Router ] ───► [ chatRateLimiter: 10 req / 10 min per IP ]
        │
        ├──► [ Daily Request Cap Check (CHATBOT_DAILY_REQUEST_CAP) ]
        ├──► [ Input Sanitization & 500-char Length Validation ]
        ├──► [ History Truncation (Max 10 turns) ]
        │
        ▼
[ Anthropic Messages API ]
        │  Model: CHATBOT_MODEL || CLAUDE_MODEL (default claude-haiku-5-5)
        │  System Prompt: src/shared/chatbot/systemPrompt.js
        │  Grounded Facts: src/shared/chatbot/knowledge.json
        │  Server Tool: web_search_20260318 (max_uses: 3)
        ▼
[ Response Formatter ] ───► Extracts text & search source URLs
        │
        ▼ (Audit Log: Counts & Latency ONLY, zero message content or PII)
[ HTTP 200 JSON ] ───► Rendered in Accessible Front-end Widget
```

---

## 4. Guardrails & Cost-Control Protections

1. **Daily Request Cap (`CHATBOT_DAILY_REQUEST_CAP`)**:
   - Caps total queries across all visitors at 200/day by default. When exhausted, the system returns a friendly message pointing to WhatsApp, stopping unexpected API spend.
2. **IP Rate Limiting (`express-rate-limit`)**:
   - Reusable middleware restricts each visitor IP to 10 queries per 10 minutes.
3. **Input Length Cap**:
   - Questions exceeding 500 characters are rejected before dispatch.
4. **Conversation Turn Cap**:
   - Context is capped at the last 10 turns, preventing large token payloads.
5. **Fast Timeout**:
   - Server enforces a 15-second timeout on Anthropic API calls.
6. **Zero Data Retention**:
   - Conversations are processed in-memory for the duration of the request only. No messages, prompts, or personal data are stored in databases, flat files, or server logs.
7. **Privacy Audit Logging**:
   - Structured logs record status, token counts, and latency only. User question text is **never** logged.

---

## 5. Instant Kill-Switch (How to Turn It Off)

If you need to instantly disable the chatbot:
1. In your `.env` file or hosting environment variables, set:
   ```env
   FEATURES_CHATBOT_ENABLED=false
   ```
2. Restart or reload the server.
3. **Result**: The floating chat bubble disappears completely from all pages, and any direct POST calls to `/api/chat` return an immediate HTTP 503 response.

Alternatively, removing `ANTHROPIC_API_KEY` causes the widget to remain dormant while logging a single startup notice.

---

## 6. Open Owner Items (Action Required by Abiodun / Owner)

1. **Anthropic Console Monthly Spend Cap**:
   - Set a hard monthly spend cap (e.g. $15.00/month or $25.00/month) inside the Anthropic Console (`Settings -> Limits -> Spend Limits`).
   - This prevents unforeseen billing spikes regardless of traffic volume.
2. **Review & Confirm Privacy Wording**:
   - Review the draft wording in `docs/legal/CHATBOT_PRIVACY_WORDING.md` and confirm counsel approval before launch on Dec 4.
