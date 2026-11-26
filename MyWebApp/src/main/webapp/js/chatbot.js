/**
 * Tutor Time Helper - Front-End Chatbot Client
 * Accessible, zero-dependency, keyboard-friendly assistant widget.
 */

(function () {
  'use strict';

  function initChatbot() {
    var root = document.getElementById('chatbot-root');
    var toggleBtn = document.getElementById('chatbot-toggle-btn');
    var panel = document.getElementById('chatbot-panel');
    var closeBtn = document.getElementById('chatbot-close-btn');
    var form = document.getElementById('chatbot-form');
    var input = document.getElementById('chatbot-input');
    var messages = document.getElementById('chatbot-messages');
    var charCount = document.getElementById('chatbot-char-count');
    var chips = document.getElementById('chatbot-chips');

    if (!toggleBtn || !panel || !form || !input || !messages) return;

    var conversationHistory = [];
    // Strictly in-memory readiness context ({ subject, score, band } only; zero browser persistence)
    var activeReadinessResult = null;
    var isOpen = false;
    var isSending = false;

    function isChatUnavailable() {
      return Boolean(root && root.getAttribute('data-chatbot-unavailable') === 'true');
    }

    function openChat() {
      isOpen = true;
      panel.removeAttribute('hidden');
      toggleBtn.setAttribute('aria-expanded', 'true');
      if (!isChatUnavailable()) {
        input.focus();
      } else {
        closeBtn.focus();
      }
      scrollMessagesBottom();
    }

    function closeChat() {
      isOpen = false;
      panel.setAttribute('hidden', '');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.focus();
    }

    toggleBtn.addEventListener('click', function () {
      if (isOpen) {
        closeChat();
      } else {
        openChat();
      }
    });

    closeBtn.addEventListener('click', closeChat);

    // Close on Escape key
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        closeChat();
      }
    });

    // Character counter
    input.addEventListener('input', function () {
      var len = input.value.length;
      if (charCount) {
        charCount.textContent = len + '/500';
      }
    });

    // Suggestion chips
    if (chips) {
      chips.addEventListener('click', function (e) {
        var target = e.target;
        if (target && target.classList.contains('chatbot-chip')) {
          var question = target.getAttribute('data-question');
          if (question && !isSending) {
            input.value = question;
            submitMessage(question);
          }
        }
      });
    }

    function scrollMessagesBottom() {
      messages.scrollTop = messages.scrollHeight;
    }

    function appendMessage(role, text, sources) {
      var msgDiv = document.createElement('div');
      msgDiv.className = 'chatbot-msg chatbot-msg-' + role;

      var bubbleDiv = document.createElement('div');
      bubbleDiv.className = 'chatbot-bubble';
      bubbleDiv.textContent = text;

      // Append source links if provided
      if (Array.isArray(sources) && sources.length > 0) {
        var sourcesDiv = document.createElement('div');
        sourcesDiv.className = 'chatbot-sources';
        var sourceLabel = document.createElement('span');
        sourceLabel.className = 'chatbot-sources-label';
        sourceLabel.textContent = 'Sources: ';
        sourcesDiv.appendChild(sourceLabel);

        sources.forEach(function (src) {
          if (src && src.url) {
            var a = document.createElement('a');
            a.href = src.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'chatbot-source-link';
            a.textContent = src.title || src.url;
            sourcesDiv.appendChild(a);
          }
        });
        bubbleDiv.appendChild(sourcesDiv);
      }

      msgDiv.appendChild(bubbleDiv);
      messages.appendChild(msgDiv);
      scrollMessagesBottom();
    }

    function appendTypingIndicator() {
      var typingDiv = document.createElement('div');
      typingDiv.className = 'chatbot-msg chatbot-msg-assistant chatbot-typing';
      typingDiv.id = 'chatbot-typing-indicator';
      typingDiv.innerHTML = '<div class="chatbot-bubble"><span></span><span></span><span></span></div>';
      messages.appendChild(typingDiv);
      scrollMessagesBottom();
    }

    function removeTypingIndicator() {
      var indicator = document.getElementById('chatbot-typing-indicator');
      if (indicator && indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }

    async function submitMessage(userText) {
      if (!userText || !userText.trim() || isSending) return;

      var text = userText.trim();
      input.value = '';
      if (charCount) charCount.textContent = '0/500';

      appendMessage('user', text);
      appendTypingIndicator();
      isSending = true;

      try {
        var reqBody = {
          message: text,
          history: conversationHistory
        };
        if (activeReadinessResult) {
          reqBody.readinessResult = {
            subject: activeReadinessResult.subject,
            score: activeReadinessResult.score,
            band: activeReadinessResult.band
          };
        }

        var response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reqBody)
        });

        var data = await response.json();
        removeTypingIndicator();

        if (response.ok && data.success) {
          appendMessage('assistant', data.reply, data.sources);
          conversationHistory.push({ role: 'user', content: text });
          conversationHistory.push({ role: 'assistant', content: data.reply });
        } else {
          var errorMsg = (data && data.error) ? data.error : 'Sorry, I was unable to answer right now. Please try again.';
          appendMessage('assistant', errorMsg);
        }
      } catch (err) {
        removeTypingIndicator();
        appendMessage('assistant', 'Network issue. Please check your connection or reach out to Teacher Cassie on WhatsApp!');
      } finally {
        isSending = false;
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (isChatUnavailable()) return;
      submitMessage(input.value);
    });

    // Listen for in-memory "Talk about my results" handoff from readiness.js
    document.addEventListener('tt:open-chat-with-results', function (e) {
      var detail = (e && e.detail) || {};
      var res = detail.readinessResult;
      if (res && typeof res.subject === 'string' && typeof res.score === 'number' && typeof res.band === 'string') {
        activeReadinessResult = {
          subject: res.subject,
          score: res.score,
          band: res.band
        };
      }

      openChat();

      if (isChatUnavailable()) {
        if (detail.offlineSummary) {
          appendMessage('assistant', detail.offlineSummary);
        }
        return;
      }

      if (activeReadinessResult && !isSending) {
        var starterPrompt = 'I just finished the ' + activeReadinessResult.subject +
          ' sample readiness check (' + activeReadinessResult.score + '/10, ' +
          activeReadinessResult.band + '). Which Tutor Time programme do you recommend?';
        submitMessage(starterPrompt);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }
})();
