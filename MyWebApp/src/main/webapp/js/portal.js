/**
 * Client-side progressive enhancement for Tutor Time Private Portal (QuickSchools-style SIS)
 * Strictly CSP-compliant (external script, zero inline handlers).
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile sidebar drawer toggle
  const shell = document.querySelector('.qs-shell');
  const toggleBtn = document.querySelector('[data-sidebar-toggle]');
  const backdrop = document.querySelector('[data-sidebar-backdrop]');

  function closeSidebar() {
    if (shell) shell.classList.remove('sidebar-open');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
  }

  if (toggleBtn && shell) {
    toggleBtn.addEventListener('click', () => {
      const open = shell.classList.toggle('sidebar-open');
      toggleBtn.setAttribute('aria-expanded', String(open));
    });
  }
  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });

  // 2. Live search filter for Student Roster & Billing tables
  document.querySelectorAll('[data-table-filter]').forEach((input) => {
    const targetSelector = input.getAttribute('data-table-filter');
    const rows = Array.from(document.querySelectorAll(targetSelector));
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      rows.forEach((row) => {
        const text = (row.getAttribute('data-search') || row.textContent || '').toLowerCase();
        row.style.display = !q || text.includes(q) ? '' : 'none';
      });
    });
  });

  // 3. Quick "Mark All Present" helper in Roll-Call Grid
  document.querySelectorAll('[data-mark-all]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetStatus = btn.getAttribute('data-mark-all') || 'present';
      document.querySelectorAll(`.qs-rollcall-table input[type="radio"][value="${targetStatus}"]`).forEach((radio) => {
        radio.checked = true;
      });
    });
  });

  // 4. Print invoice button
  document.querySelectorAll('[data-action="print"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.print();
    });
  });

  // 5. Copy parent link button
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
        window.prompt('Copy private parent link:', text);
      }
    });
  });

  // 6. Confirmations for destructive actions
  document.querySelectorAll('[data-confirm]').forEach((el) => {
    el.addEventListener('submit', (e) => {
      const msg = el.getAttribute('data-confirm');
      if (msg && !window.confirm(msg)) {
        e.preventDefault();
      }
    });
  });
});
