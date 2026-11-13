/**
 * Legal Pages Renderer (/privacy and /terms)
 * Renders existing draft documents from docs/legal/ through the site layout
 * without modifying legal wording, with a visible "Draft, pending review" banner
 * and data-todo="legal" markers where owner/client sign-off is still needed.
 */

const fs = require('fs');
const path = require('path');
const { escapeHtml, renderLayout } = require('./layout');

const LEGAL_DIR = path.join(__dirname, '..', '..', '..', 'docs', 'legal');

function readLegalDoc(filename) {
  const fullPath = path.join(LEGAL_DIR, filename);
  return fs.readFileSync(fullPath, 'utf8');
}

function formatInlineMarkdown(escapedText) {
  return escapedText
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((\/[^)]+)\)/g, '<a href="$2">$1</a>');
}

/**
 * Minimal, safe markdown-to-HTML converter for docs/legal/*.md.
 * Escapes all raw HTML first so no unescaped markup is injected.
 */
function markdownToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let inList = false;
  let inTable = false;
  let tableHeaderDone = false;
  let inCodeFence = false;

  function closeList() {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  }

  function closeTable() {
    if (inTable) {
      out.push('</tbody></table></div>');
      inTable = false;
      tableHeaderDone = false;
    }
  }

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    // Skip markdown code fence delimiters (e.g. ```markdown ... ```)
    if (trimmed.startsWith('```')) {
      inCodeFence = !inCodeFence;
      continue;
    }

    if (!trimmed) {
      closeList();
      closeTable();
      continue;
    }

    if (trimmed === '---') {
      closeList();
      closeTable();
      out.push('<hr>');
      continue;
    }

    // Markdown table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      closeList();
      const cells = trimmed.slice(1, -1).split('|').map(c => c.trim());
      const isSeparator = cells.every(c => /^:?-{2,}:?$/.test(c));
      if (isSeparator) {
        tableHeaderDone = true;
        continue;
      }
      if (!inTable) {
        out.push('<div class="table-responsive"><table class="legal-table"><thead><tr>');
        for (const c of cells) {
          out.push(`<th>${formatInlineMarkdown(escapeHtml(c))}</th>`);
        }
        out.push('</tr></thead><tbody>');
        inTable = true;
        tableHeaderDone = false;
      } else {
        out.push('<tr>');
        for (const c of cells) {
          out.push(`<td>${formatInlineMarkdown(escapeHtml(c))}</td>`);
        }
        out.push('</tr>');
      }
      continue;
    } else {
      closeTable();
    }

    // Headings
    const hMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (hMatch) {
      closeList();
      const level = Math.min(hMatch[1].length + 1, 5);
      out.push(`<h${level}>${formatInlineMarkdown(escapeHtml(hMatch[2]))}</h${level}>`);
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      closeList();
      const quoteText = trimmed.replace(/^>\s*/, '');
      out.push(`<blockquote class="legal-callout">${formatInlineMarkdown(escapeHtml(quoteText))}</blockquote>`);
      continue;
    }

    // Unordered list
    if (trimmed.startsWith('- ')) {
      if (!inList) {
        out.push('<ul class="legal-list">');
        inList = true;
      }
      out.push(`<li>${formatInlineMarkdown(escapeHtml(trimmed.slice(2)))}</li>`);
      continue;
    } else {
      closeList();
    }

    out.push(`<p>${formatInlineMarkdown(escapeHtml(trimmed))}</p>`);
  }

  closeList();
  closeTable();
  return out.join('\n');
}

function renderDraftBanner() {
  return `
    <div class="service-notice legal-draft-banner" role="note" data-todo="legal">
      <strong>Draft, pending review</strong> &mdash; This legal document is an unapproved draft from the project legal pack and is awaiting owner (Abiodun), founder (Cassie), and legal counsel sign-off.
    </div>
  `;
}

function extractVisitorPrivacySection(md) {
  const match = md.match(/```markdown\s*\n([\s\S]*?)\n```/);
  return match ? match[1] : '';
}

function renderPrivacyPage() {
  const chatbotPrivacyMd = readLegalDoc('CHATBOT_PRIVACY_WORDING.md');
  const visitorChatbotMd = extractVisitorPrivacySection(chatbotPrivacyMd);

  const bodyHtml = `
    <section class="page-hero">
      <div class="container">
        <h1>Privacy Policy</h1>
        <p class="lead">How Tutor Time with Teacher Cassie &amp; Popcorn Math handles parent and visitor information.</p>
      </div>
    </section>

    <section class="page-section">
      <div class="container legal-document-container">
        ${renderDraftBanner()}

        <div class="service-notice mb-4" data-todo="legal">
          <p><strong>Full Privacy Policy coming soon.</strong> The complete Privacy Policy is awaiting owner and legal counsel review prior to public launch.</p>
        </div>

        <div class="legal-section" data-todo="legal" id="chatbot">
          ${markdownToHtml(visitorChatbotMd)}
        </div>
      </div>
    </section>
  `;

  return renderLayout({
    title: 'Privacy Policy (Draft)',
    description: 'Draft Privacy Policy and AI Assistant Disclosure for Tutor Time and Popcorn Math.',
    bodyHtml,
    currentPath: '/privacy'
  });
}

function renderTermsPage() {
  const bodyHtml = `
    <section class="page-hero">
      <div class="container">
        <h1>Terms of Service</h1>
        <p class="lead">Terms governing public access to Tutor Time with Teacher Cassie &amp; Popcorn Math.</p>
      </div>
    </section>

    <section class="page-section">
      <div class="container legal-document-container">
        ${renderDraftBanner()}

        <div class="service-notice mb-4" data-todo="legal">
          <h2>Terms of Use coming soon</h2>
          <p>The Terms of Service for Tutor Time with Teacher Cassie and Popcorn Math are currently being finalised and are awaiting owner and legal counsel review.</p>
        </div>
      </div>
    </section>
  `;

  return renderLayout({
    title: 'Terms of Service (Draft)',
    description: 'Draft Terms of Service for Tutor Time and Popcorn Math.',
    bodyHtml,
    currentPath: '/terms'
  });
}

module.exports = {
  renderPrivacyPage,
  renderTermsPage
};
