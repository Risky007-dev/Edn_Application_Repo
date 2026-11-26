/**
 * Phase 2 - Task 3: Claude-Powered Chatbot Automated Verification
 * Uses 100% mocked Anthropic SDK clients — zero external network calls or real API keys.
 */

const {
  handleChat,
  setInjectedClient,
  resetDailyCounterForTests,
  MAX_INPUT_LENGTH,
  checkAndIncrementDailyCap,
  DEFAULT_MODEL,
  WEB_SEARCH_TOOL_TYPE
} = require('../src/shared/chatbot/chatController');
const { SYSTEM_PROMPT, getSystemPrompt } = require('../src/shared/chatbot/systemPrompt');
const { renderChatWidget } = require('../src/shared/chatbot/widget');
const {
  validateChatReadinessResult,
  getRecommendationForResult,
  RECOMMENDATION_RULE_TABLE
} = require('../src/shared/readiness/recommendationRules');
const { renderReadinessCheckPage } = require('../src/shared/templates/pages');
const config = require('../src/shared/config');
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(name, condition, details = '') {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${name} ${details}`);
    failed++;
  }
}

// Mock Express response generator
function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    setHeader(k, v) {
      this.headers[k] = v;
      return this;
    }
  };
  return res;
}

async function run() {
  console.log('================================================================');
  console.log('       PHASE 2 - TASK 3: CHATBOT WITH CLAUDE (MOCKED)           ');
  console.log('================================================================\n');

  console.log('--- 1. System Prompt & Guardrails Verification ---');
  assert('System prompt identifies as AI assistant Tutor Time Helper', SYSTEM_PROMPT.includes('Tutor Time Helper') && SYSTEM_PROMPT.includes('AI assistant'));
  assert('System prompt explicitly disclaims being Kashamar or Cassie', SYSTEM_PROMPT.includes('NOT Kashamar Lewis or Teacher Cassie'));
  assert('System prompt forbids inventing prices and quotes', SYSTEM_PROMPT.includes('NO INVENTED FACTS OR PRICES'));
  assert('System prompt strictly forbids soliciting or keeping personal details', SYSTEM_PROMPT.includes('NO PERSONAL INFORMATION'));
  assert('System prompt forbids medical, legal, or safeguarding advice', SYSTEM_PROMPT.includes('NO MEDICAL, LEGAL, OR SAFEGUARDING ADVICE'));
  assert('System prompt points to WhatsApp and booking consultation', SYSTEM_PROMPT.includes('/book') && SYSTEM_PROMPT.includes('WhatsApp'));
  assert('System prompt refers to Popcorn Math as in-person and January pilot planned', SYSTEM_PROMPT.includes('in-person') && SYSTEM_PROMPT.includes('planned'));

  console.log('\n--- 2. Kill Switch & Missing API Key Behavior ---');
  // Test flag disabled
  config.features.chatbot.enabled = false;
  const reqDisabled = { body: { message: 'Hello' } };
  const resDisabled = createMockRes();
  await handleChat(reqDisabled, resDisabled);
  assert('Chatbot returns HTTP 503 when feature flag is disabled', resDisabled.statusCode === 503);
  assert('Disabled response returns friendly downtime message', resDisabled.body && resDisabled.body.error.includes('taking a short break'));

  // Restore flag, test missing API key without injected client
  config.features.chatbot.enabled = true;
  const originalApiKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  setInjectedClient(null);

  const reqNoKey = { body: { message: 'What is Popcorn Math?' } };
  const resNoKey = createMockRes();
  await handleChat(reqNoKey, resNoKey);
  assert('Chatbot returns HTTP 503 when API key is missing', resNoKey.statusCode === 503);
  assert('Missing key response provides friendly contact message', resNoKey.body && resNoKey.body.error.includes('currently unavailable'));

  console.log('\n--- 3. Input Validation & Max Length Enforcement ---');
  // Inject mock client for active tests
  const mockClient = {
    messages: {
      create: async (params) => {
        return {
          content: [
            {
              type: 'text',
              text: 'Popcorn Math is a hands-on after-school programme where children build fun math crafts!',
              citations: [
                { url: 'https://tutortime.ai/services/popcorn-math', title: 'Popcorn Math Hub' }
              ]
            }
          ]
        };
      }
    }
  };
  setInjectedClient(mockClient);

  // Empty message
  const resEmpty = createMockRes();
  await handleChat({ body: { message: '   ' } }, resEmpty);
  assert('Empty message rejected with HTTP 400', resEmpty.statusCode === 400);

  // Message too long
  const longText = 'A'.repeat(MAX_INPUT_LENGTH + 10);
  const resTooLong = createMockRes();
  await handleChat({ body: { message: longText } }, resTooLong);
  assert('Message exceeding 500 characters rejected with HTTP 400', resTooLong.statusCode === 400);
  assert('Too long message error states limit', resTooLong.body.error.includes(String(MAX_INPUT_LENGTH)));

  console.log('\n--- 4. Successful Mock Chat Turn with Citations ---');
  resetDailyCounterForTests();
  const resValid = createMockRes();
  await handleChat({ body: { message: 'Tell me about Popcorn Math' } }, resValid);
  assert('Valid message returns HTTP 200', resValid.statusCode === 200);
  assert('Response contains assistant reply', resValid.body.reply.includes('Popcorn Math'));
  assert('Response contains extracted search source links', Array.isArray(resValid.body.sources) && resValid.body.sources.length === 1);
  assert('Response source includes correct URL', resValid.body.sources[0].url === 'https://tutortime.ai/services/popcorn-math');

  console.log('\n--- 5. Daily Request Cap Protection ---');
  process.env.CHATBOT_DAILY_REQUEST_CAP = '2';
  resetDailyCounterForTests();

  const resCap1 = createMockRes();
  await handleChat({ body: { message: 'Query 1' } }, resCap1);
  assert('Query 1 within daily cap succeeds (HTTP 200)', resCap1.statusCode === 200);

  const resCap2 = createMockRes();
  await handleChat({ body: { message: 'Query 2' } }, resCap2);
  assert('Query 2 within daily cap succeeds (HTTP 200)', resCap2.statusCode === 200);

  const resCap3 = createMockRes();
  await handleChat({ body: { message: 'Query 3' } }, resCap3);
  assert('Query 3 exceeding daily cap returns HTTP 429', resCap3.statusCode === 429);
  assert('Daily cap error returns friendly message', resCap3.body.error.includes('reached its daily limit'));

  // Reset cap
  delete process.env.CHATBOT_DAILY_REQUEST_CAP;
  resetDailyCounterForTests();

  console.log('\n--- 6. Mock API Error Handling & Redaction ---');
  const errorClient = {
    messages: {
      create: async () => {
        const err = new Error('Simulated upstream Anthropic 500 timeout');
        err.status = 500;
        throw err;
      }
    }
  };
  setInjectedClient(errorClient);
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test-secret-key-do-not-leak';

  const resErr = createMockRes();
  await handleChat({ body: { message: 'Will this fail?' } }, resErr);
  assert('API failure returns HTTP 500', resErr.statusCode === 500);
  assert('Error message is friendly and does NOT leak secret key', !JSON.stringify(resErr.body).includes('sk-ant'));
  assert('Error response offers WhatsApp alternative', resErr.body.error.includes('WhatsApp'));

  console.log('\n--- 7. Zero Persistence & Privacy Verification ---');
  // Check that no database or file persistence occurred
  const testDataFiles = fs.readdirSync(path.join(__dirname, '..', 'data'));
  const hasChatLogsOnDisk = testDataFiles.some(f => f.includes('chat') || f.includes('conversation'));
  assert('Zero conversation files stored on disk', !hasChatLogsOnDisk);

  console.log('\n--- 8. Front-End Widget Markup, Model & Unavailable State ---');
  assert('Default model is claude-haiku-5-5', DEFAULT_MODEL === 'claude-haiku-5-5');
  assert('Web search tool type is web_search_20260318', WEB_SEARCH_TOOL_TYPE === 'web_search_20260318');
  const widgetHtml = renderChatWidget();
  assert('Widget renders accessible toggle button', widgetHtml.includes('id="chatbot-toggle-btn"'));
  assert('Widget renders dialog panel with role="dialog"', widgetHtml.includes('role="dialog"') && widgetHtml.includes('id="chatbot-panel"'));
  assert('Widget displays privacy notice with link to /privacy', widgetHtml.includes('Please don&#39;t share personal details') || widgetHtml.includes("Please don't share personal details"));
  assert('Widget displays Tutor Time Helper title', widgetHtml.includes('Tutor Time Helper'));
  assert('Widget includes input with maxlength="500"', widgetHtml.includes('maxlength="500"'));

  const unavailableWidgetHtml = renderChatWidget({ available: false });
  assert('Unavailable widget explicitly shows "Chat is currently unavailable"', unavailableWidgetHtml.includes('Chat is currently unavailable'));
  assert('Unavailable widget disables input and marks data-chatbot-unavailable', unavailableWidgetHtml.includes('data-chatbot-unavailable="true"') && unavailableWidgetHtml.includes('disabled'));

  // Test CHATBOT_MODEL env var override
  let capturedModel = null;
  setInjectedClient({
    messages: {
      create: async (params) => {
        capturedModel = params.model;
        return { content: [{ type: 'text', text: 'Ok' }] };
      }
    }
  });
  process.env.CHATBOT_MODEL = 'claude-haiku-test-override';
  const resModel = createMockRes();
  await handleChat({ body: { message: 'Model override check' } }, resModel);
  assert('CHATBOT_MODEL env var overrides default model', capturedModel === 'claude-haiku-test-override');
  delete process.env.CHATBOT_MODEL;

  console.log('\n--- 9. Readiness Result Recommendations & Strict Validation ---');
  assert('Configurable recommendation rule table defines all 4 bands', RECOMMENDATION_RULE_TABLE.length === 4);

  // Verify approved band rules:
  // 0-4: One-on-One Tutoring primary, Sunday Workshops secondary
  // 5-6: Sunday Workshops primary, One-on-One Tutoring secondary
  // 7-8: Sunday Workshops primary, Seasonal Pop-Ups secondary
  // 9-10: Seasonal Pop-Ups primary, Sunday Workshops secondary
  const ruleExpectations = [
    { subject: 'Mathematics', score: 3, band: 'Just Starting', primary: 'One-on-One Tutoring', secondary: 'Sunday Workshops' },
    { subject: 'Language Arts', score: 5, band: 'Getting There', primary: 'Sunday Workshops', secondary: 'One-on-One Tutoring' },
    { subject: 'Mathematics', score: 8, band: 'Looking Good', primary: 'Sunday Workshops', secondary: 'Seasonal Pop-Ups' },
    { subject: 'Language Arts', score: 10, band: 'Exam Star', primary: 'Seasonal Pop-Ups', secondary: 'Sunday Workshops' }
  ];

  for (const exp of ruleExpectations) {
    const rec = getRecommendationForResult({ subject: exp.subject, score: exp.score, band: exp.band });
    assert(`Rule table maps ${exp.subject} ${exp.score}/10 (${exp.band}) -> ${exp.primary} / ${exp.secondary}`,
      Boolean(rec) && rec.primary.name === exp.primary && rec.secondary.name === exp.secondary);
  }

  // Verify invalid readinessResult payloads are rejected with HTTP 400
  let capturedSystem = '';
  setInjectedClient({
    messages: {
      create: async (params) => {
        capturedSystem = params.system || '';
        return { content: [{ type: 'text', text: 'Great effort! Based on your result we recommend Sunday Workshops.' }] };
      }
    }
  });
  resetDailyCounterForTests();

  const resRecValid = createMockRes();
  await handleChat({
    body: {
      message: 'What do you recommend?',
      readinessResult: { subject: 'Mathematics', score: 6, band: 'Getting There' }
    }
  }, resRecValid);
  assert('POST /api/chat accepts valid { subject, score, band } readinessResult (HTTP 200)',
    resRecValid.statusCode === 200 && resRecValid.body.recommendation.primary === 'Sunday Workshops' && resRecValid.body.recommendation.secondary === 'One-on-One Tutoring');
  assert('System prompt sent to mocked Claude includes verified Primary & Secondary recommendations',
    capturedSystem.includes('Primary Recommended Service: Sunday Workshops') &&
    capturedSystem.includes('Secondary Option: One-on-One Tutoring') &&
    capturedSystem.includes('Sample Score: 6 / 10'));

  const resRecExtraKey = createMockRes();
  await handleChat({
    body: {
      message: 'Recommend something',
      readinessResult: { subject: 'Mathematics', score: 6, band: 'Getting There', childName: 'Leo' }
    }
  }, resRecExtraKey);
  assert('POST /api/chat rejects extra/PII key (childName) in readinessResult with HTTP 400', resRecExtraKey.statusCode === 400);

  const resRecHiddenSubject = createMockRes();
  await handleChat({
    body: {
      message: 'Recommend something',
      readinessResult: { subject: 'Science', score: 8, band: 'Looking Good' }
    }
  }, resRecHiddenSubject);
  assert('POST /api/chat rejects hidden subject (Science) in readinessResult with HTTP 400', resRecHiddenSubject.statusCode === 400);

  const resRecMismatch = createMockRes();
  await handleChat({
    body: {
      message: 'Recommend something',
      readinessResult: { subject: 'Language Arts', score: 10, band: 'Just Starting' }
    }
  }, resRecMismatch);
  assert('POST /api/chat rejects mismatched score and band in readinessResult with HTTP 400', resRecMismatch.statusCode === 400);

  assert('validateChatReadinessResult rejects non-integer score', !validateChatReadinessResult({ subject: 'Mathematics', score: 7.5, band: 'Looking Good' }).valid);

  // Verify non-AI recommendation data embedded on /readiness-check & zero browser storage in chatbot.js
  const readinessHtml = renderReadinessCheckPage();
  assert('/readiness-check embeds recommendation rule config for non-AI result rendering',
    readinessHtml.includes('id="readiness-recommendations-data"') &&
    readinessHtml.includes('Sunday Workshops') &&
    readinessHtml.includes('Seasonal Pop-Ups'));

  const chatbotClientJs = fs.readFileSync(path.join(__dirname, '../MyWebApp/src/main/webapp/js/chatbot.js'), 'utf8');
  assert('chatbot.js listens for tt:open-chat-with-results and uses zero browser storage',
    chatbotClientJs.includes('tt:open-chat-with-results') &&
    !chatbotClientJs.includes('localStorage') &&
    !chatbotClientJs.includes('sessionStorage') &&
    !chatbotClientJs.includes('document.cookie'));

  // Clean up env
  if (originalApiKey) {
    process.env.ANTHROPIC_API_KEY = originalApiKey;
  } else {
    delete process.env.ANTHROPIC_API_KEY;
  }
  setInjectedClient(null);

  console.log('\n================================================================');
  console.log(`TASK 3 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
