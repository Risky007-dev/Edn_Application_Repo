/**
 * Front-End AI Chatbot Widget Generator
 * Generates semantic, accessible, keyboard-friendly widget markup.
 */

const { renderGuideMascot } = require('../components/mascotGuide');

function renderChatWidget() {
  const guideIcon = renderGuideMascot({ expression: 'happy', size: 36 });
  const guideHeaderAvatar = renderGuideMascot({ expression: 'neutral', size: 38 });

  return `
    <div id="chatbot-root" class="chatbot-root">
      <!-- Floating Launch Bubble -->
      <button type="button" id="chatbot-toggle-btn" class="chatbot-toggle-btn" aria-expanded="false" aria-controls="chatbot-panel" aria-label="Open Tutor Time Helper AI Chat">
        <span class="chatbot-toggle-avatar" aria-hidden="true">${guideIcon}</span>
        <span class="chatbot-toggle-badge" aria-hidden="true">💬 Chat</span>
      </button>

      <!-- Chat Drawer Panel -->
      <section id="chatbot-panel" class="chatbot-panel" role="dialog" aria-modal="false" aria-label="Tutor Time Helper AI Chat" hidden>
        <header class="chatbot-header">
          <div class="chatbot-header-info">
            <span class="chatbot-header-avatar" aria-hidden="true">${guideHeaderAvatar}</span>
            <div>
              <h2 class="chatbot-title">Tutor Time Helper</h2>
              <span class="chatbot-subtitle">AI Learning Assistant</span>
            </div>
          </div>
          <button type="button" id="chatbot-close-btn" class="chatbot-close-btn" aria-label="Close chat">&times;</button>
        </header>

        <!-- Visible Privacy Notice & Guardrail Link -->
        <div class="chatbot-notice" role="note">
          <span class="notice-icon" aria-hidden="true">🔒</span>
          <span>AI assistant &bull; Please don't share personal details. <a href="/privacy" class="chatbot-privacy-link" target="_blank" rel="noopener">Privacy Policy</a></span>
        </div>

        <!-- Chat Conversation Messages Log -->
        <div id="chatbot-messages" class="chatbot-messages" role="log" aria-live="polite" aria-atomic="false">
          <div class="chatbot-msg chatbot-msg-assistant">
            <div class="chatbot-bubble">
              Hi there! I&#39;m the <strong>Tutor Time Helper</strong>, your AI study assistant. Ask me anything about our tutoring programmes, Popcorn Math, or general study tips!
            </div>
          </div>
        </div>

        <!-- Quick Suggestions Chips -->
        <div class="chatbot-chips" id="chatbot-chips" aria-label="Suggested questions">
          <button type="button" class="chatbot-chip" data-question="What is Popcorn Math?">What is Popcorn Math?</button>
          <button type="button" class="chatbot-chip" data-question="How do I book a consultation?">How do I book?</button>
          <button type="button" class="chatbot-chip" data-question="What is the Readiness Check?">Readiness Check?</button>
        </div>

        <!-- Chat Input Form -->
        <form id="chatbot-form" class="chatbot-form">
          <div class="chatbot-input-row">
            <input type="text" id="chatbot-input" class="chatbot-input" placeholder="Ask a question..." maxlength="500" required autocomplete="off" aria-label="Ask a question">
            <button type="submit" id="chatbot-send-btn" class="chatbot-send-btn" aria-label="Send message">Send</button>
          </div>
          <div class="chatbot-footer-meta">
            <span id="chatbot-char-count" class="chatbot-char-count">0/500</span>
          </div>
        </form>
      </section>
    </div>
  `;
}

module.exports = {
  renderChatWidget
};
