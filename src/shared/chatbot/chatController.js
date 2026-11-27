/**
 * Chatbot Controller & Claude API Orchestrator
 * Integrates official Anthropic Claude SDK with server-side web search,
 * strict safety guardrails, daily usage caps (in-memory locally, atomic DynamoDB
 * counter in AWS Lambda/multi-instance mode), rate limiting, and zero-PII logging.
 */

const { Anthropic } = require('@anthropic-ai/sdk');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const { getSystemPrompt } = require('./systemPrompt');
const siteKnowledge = require('./knowledge.json');
const {
  validateChatReadinessResult,
  getRecommendationForResult
} = require('../readiness/recommendationRules');

// Configuration constants
const DEFAULT_MODEL = 'claude-haiku-5-5';
const WEB_SEARCH_TOOL_TYPE = 'web_search_20260318';
const MAX_INPUT_LENGTH = Number(process.env.CHATBOT_MAX_INPUT_LENGTH || 500);
const MAX_CONVERSATION_TURNS = 10;
const TIMEOUT_MS = 15000;
const DAILY_COUNTER_TTL_SECONDS = 7 * 24 * 60 * 60;

// Daily Request Cap Management (In-Memory fallback for local mode & tests)
let dailyCounter = {
  dateStr: new Date().toISOString().slice(0, 10),
  count: 0
};

let cachedCounterDocClient = null;
let injectedCounterDocClient = null;

function setDailyCounterDocClientForTests(docClient) {
  injectedCounterDocClient = docClient || null;
}

function getDailyCap() {
  return Number(process.env.CHATBOT_DAILY_REQUEST_CAP || 200);
}

function checkAndIncrementDailyCap() {
  const today = new Date().toISOString().slice(0, 10);
  if (dailyCounter.dateStr !== today) {
    dailyCounter = { dateStr: today, count: 0 };
  }
  if (dailyCounter.count >= getDailyCap()) {
    return false;
  }
  dailyCounter.count++;
  return true;
}

function getDailyCount() {
  const today = new Date().toISOString().slice(0, 10);
  if (dailyCounter.dateStr !== today) {
    dailyCounter = { dateStr: today, count: 0 };
  }
  return dailyCounter.count;
}

function resetDailyCounterForTests() {
  dailyCounter = { dateStr: new Date().toISOString().slice(0, 10), count: 0 };
}

function shouldUseDynamoDailyCounter() {
  if (injectedCounterDocClient) return true;
  if (injectedClient) return false;
  return (process.env.STORAGE_DRIVER || 'local').toLowerCase().trim() === 'aws';
}

function getCounterDocClient() {
  if (injectedCounterDocClient) return injectedCounterDocClient;
  if (!cachedCounterDocClient) {
    const region = process.env.AWS_REGION || 'us-east-2';
    cachedCounterDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
  }
  return cachedCounterDocClient;
}

/**
 * Enforces the daily chatbot request cap.
 * In AWS Lambda / multi-replica deployments (STORAGE_DRIVER=aws), uses a single
 * atomic conditional UpdateItem counter in DynamoDB (zero PII, 7-day TTL) so
 * cold starts and concurrent containers cannot bypass CHATBOT_DAILY_REQUEST_CAP.
 * Falls back gracefully to the in-memory counter on local mode or transient errors.
 */
async function checkAndIncrementDailyCapAsync() {
  if (!shouldUseDynamoDailyCounter()) {
    return { allowed: checkAndIncrementDailyCap(), count: getDailyCount() };
  }

  const today = new Date().toISOString().slice(0, 10);
  const cap = getDailyCap();
  const tableName = process.env.DYNAMODB_TABLE_NAME || 'tutortime-submissions';
  const expireAt = Math.floor(Date.now() / 1000) + DAILY_COUNTER_TTL_SECONDS;

  try {
    const docClient = getCounterDocClient();
    const res = await docClient.send(new UpdateCommand({
      TableName: tableName,
      Key: {
        formType: 'SYSTEM_COUNTER',
        'createdAt#id': `CHATBOT_DAILY#${today}`
      },
      UpdateExpression: 'SET requestCount = if_not_exists(requestCount, :zero) + :one, expireAt = :ttl, updatedAt = :now',
      ConditionExpression: 'attribute_not_exists(requestCount) OR requestCount < :cap',
      ExpressionAttributeValues: {
        ':zero': 0,
        ':one': 1,
        ':cap': cap,
        ':ttl': expireAt,
        ':now': new Date().toISOString()
      },
      ReturnValues: 'UPDATED_NEW'
    }));

    const updatedCount = (res && res.Attributes && typeof res.Attributes.requestCount === 'number')
      ? res.Attributes.requestCount
      : getDailyCount();
    return { allowed: true, count: updatedCount };
  } catch (err) {
    if (err && (err.name === 'ConditionalCheckFailedException' || err.__type === 'com.amazonaws.dynamodb.v20120810#ConditionalCheckFailedException')) {
      return { allowed: false, count: cap };
    }
    // Transient DynamoDB issue: fail-safe to in-memory counter rather than dropping visitor
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'warn',
      event: 'chatbot_daily_counter_fallback',
      message: err && err.message ? String(err.message).slice(0, 140) : 'DynamoDB counter error'
    }));
    return { allowed: checkAndIncrementDailyCap(), count: getDailyCount() };
  }
}

// Injected client for unit testing
let injectedClient = null;
function setInjectedClient(client) {
  injectedClient = client;
}

// One-time startup warning for missing API key
let hasWarnedMissingKey = false;
function checkStartupKey() {
  const isEnabled = config.features?.chatbot?.enabled ?? true;
  if (isEnabled && !process.env.ANTHROPIC_API_KEY && !injectedClient && !hasWarnedMissingKey) {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'warn',
      event: 'chatbot_startup_key_missing',
      message: '[Chatbot] Notice: ANTHROPIC_API_KEY is not configured. Chatbot widget is dormant and /api/chat will return unavailable.'
    }));
    hasWarnedMissingKey = true;
  }
}
checkStartupKey();

// Rate limiter for chat endpoint
const chatRateLimiter = rateLimit({
  windowMs: Number(process.env.CHATBOT_RATE_LIMIT_WINDOW_MINUTES || 10) * 60 * 1000,
  max: Number(process.env.CHATBOT_RATE_LIMIT_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many questions in a short period. Please take a quick breath and try again in a few minutes!'
  }
});

// Grounded Knowledge Text for System Prompt
const knowledgeText = JSON.stringify(siteKnowledge, null, 2);
const systemPromptFull = getSystemPrompt(knowledgeText);

/**
 * Express handler for POST /api/chat
 */
async function handleChat(req, res) {
  const startTime = Date.now();
  const isEnabled = config.features?.chatbot?.enabled ?? true;

  // Kill switch check
  if (!isEnabled) {
    return res.status(503).json({
      success: false,
      error: 'The Tutor Time Helper is currently taking a short break. Please contact us via WhatsApp or book a consultation!'
    });
  }

  // API Key check
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey && !injectedClient) {
    return res.status(503).json({
      success: false,
      error: 'The Tutor Time Helper is currently unavailable. Please reach out to us via WhatsApp or book a consultation!'
    });
  }

  const { message, history = [], readinessResult = null } = req.body || {};

  // Input validation: empty or invalid message
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a question to ask the Tutor Time Helper.'
    });
  }

  const cleanMessage = message.trim();

  // Input validation: length cap
  if (cleanMessage.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({
      success: false,
      error: `Question is too long (maximum ${MAX_INPUT_LENGTH} characters). Please ask a shorter question.`
    });
  }

  // Strict server-side validation of optional readinessResult ({ subject, score, band } only)
  const readinessValidation = validateChatReadinessResult(readinessResult);
  if (!readinessValidation.valid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid readiness result context. Only subject, score (0–10), and band are permitted.'
    });
  }

  const verifiedRecommendation = readinessValidation.value
    ? getRecommendationForResult(readinessValidation.value)
    : null;

  // Conversation history cap
  const safeHistory = Array.isArray(history) ? history.slice(-MAX_CONVERSATION_TURNS) : [];

  // Daily request cap check (atomic DynamoDB in AWS mode, in-memory locally)
  const capCheck = await checkAndIncrementDailyCapAsync();
  if (!capCheck.allowed) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'chatbot_daily_cap_reached',
      dailyCount: capCheck.count,
      cap: getDailyCap()
    }));
    return res.status(429).json({
      success: false,
      error: 'The Tutor Time Helper has reached its daily limit of questions today. Please contact Teacher Cassie directly via WhatsApp!'
    });
  }

  try {
    const client = injectedClient || new Anthropic({ apiKey });
    const model = process.env.CHATBOT_MODEL || process.env.CLAUDE_MODEL || DEFAULT_MODEL;

    // Build messages payload
    const messages = [];
    for (const h of safeHistory) {
      if (h.role === 'user' || h.role === 'assistant') {
        const contentStr = typeof h.content === 'string' ? h.content.slice(0, MAX_INPUT_LENGTH) : '';
        if (contentStr) {
          messages.push({ role: h.role, content: contentStr });
        }
      }
    }
    messages.push({ role: 'user', content: cleanMessage });

    // Append server-verified recommendation context (strictly from allowlisted rule table, zero raw user strings)
    let effectiveSystemPrompt = systemPromptFull;
    if (verifiedRecommendation) {
      effectiveSystemPrompt += `\n\nVERIFIED READINESS CHECK CONTEXT (NON-IDENTIFYING, IN-MEMORY ONLY):\n` +
        `- Subject: ${verifiedRecommendation.subject}\n` +
        `- Sample Score: ${verifiedRecommendation.score} / 10\n` +
        `- Readiness Band: ${verifiedRecommendation.band}\n` +
        `- Primary Recommended Service: ${verifiedRecommendation.primary.name} (${verifiedRecommendation.primary.href})\n` +
        `- Secondary Option: ${verifiedRecommendation.secondary.name} (${verifiedRecommendation.secondary.href})\n` +
        `- Guidance Note: ${verifiedRecommendation.rationale}\n` +
        `- Important: Do NOT invent dates, schedules, availability, or prices. Point parents to /book or WhatsApp to confirm details.`;
    }

    // Call Anthropic Messages API with web search tool enabled
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: effectiveSystemPrompt,
      messages,
      tools: [
        {
          type: WEB_SEARCH_TOOL_TYPE,
          name: 'web_search',
          max_uses: 3
        }
      ]
    }, {
      timeout: TIMEOUT_MS
    });

    // Extract text reply and any web search citations / sources
    let replyText = '';
    const sources = [];

    if (Array.isArray(response.content)) {
      for (const block of response.content) {
        if (block.type === 'text') {
          replyText += block.text;
          // Check for inline citations if present in SDK structure
          if (Array.isArray(block.citations)) {
            for (const cit of block.citations) {
              if (cit.url) {
                sources.push({ url: cit.url, title: cit.title || cit.url });
              }
            }
          }
        } else if (block.type === 'tool_use' && block.name === 'web_search') {
          // Web search tool call observed
        }
      }
    } else if (typeof response.content === 'string') {
      replyText = response.content;
    }

    if (!replyText) {
      replyText = 'Hello! I am here to help you learn about Tutor Time with Teacher Cassie and Popcorn Math. How can I assist you today?';
    }

    // Structured audit logging: count and latency ONLY, NEVER message content or scores
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'chatbot_request_success',
      latencyMs: Date.now() - startTime,
      model,
      dailyCount: capCheck.count,
      inputLength: cleanMessage.length,
      replyLength: replyText.length,
      hasSources: sources.length > 0,
      hasReadinessResult: Boolean(verifiedRecommendation)
    }));

    return res.status(200).json({
      success: true,
      reply: replyText,
      sources: sources.slice(0, 5),
      ...(verifiedRecommendation ? {
        recommendation: {
          primary: verifiedRecommendation.primary.name,
          secondary: verifiedRecommendation.secondary.name
        }
      } : {})
    });

  } catch (err) {
    const latencyMs = Date.now() - startTime;
    // Log structured error without leaking key or message text
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'chatbot_request_error',
      latencyMs,
      errorCode: err.code || err.status || 'unknown',
      errorMessage: err.message ? err.message.slice(0, 150) : 'Internal error'
    }));

    return res.status(500).json({
      success: false,
      error: 'Sorry, I encountered a brief issue while formulating an answer. Please try again or reach out on WhatsApp!'
    });
  }
}

module.exports = {
  handleChat,
  chatRateLimiter,
  checkAndIncrementDailyCap,
  checkAndIncrementDailyCapAsync,
  getDailyCount,
  resetDailyCounterForTests,
  setInjectedClient,
  setDailyCounterDocClientForTests,
  checkStartupKey,
  MAX_INPUT_LENGTH,
  MAX_CONVERSATION_TURNS,
  DEFAULT_MODEL,
  WEB_SEARCH_TOOL_TYPE
};
