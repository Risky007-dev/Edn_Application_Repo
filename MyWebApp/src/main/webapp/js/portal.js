/**
 * Client-side progressive enhancement for Tutor Time Private Portal
 * Strictly CSP-compliant (external script, zero inline handlers).
 */
document.addEventListener('DOMContentLoaded', () => {
  // Print invoice button
  document.querySelectorAll('[data-action="print"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.print();
    });
  });

  // Copy parent link button
  document.querySelectorAll('[data-copy-text]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy-text') || '';
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.textContent = orig;
        }, 1600);
      } catch {
        // Fallback: prompt user if clipboard blocked
        window.prompt('Copy private parent link:', text);
      }
    });
  });

  // Confirmations for destructive actions
  document.querySelectorAll('[data-confirm]').forEach((el) => {
    el.addEventListener('submit', (e) => {
      const msg = el.getAttribute('data-confirm');
      if (msg && !window.confirm(msg)) {
        e.preventDefault();
      }
    });
  });
});
