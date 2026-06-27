import { navigateToModule } from './module-nav.js';

const QP_MAP = {
  qpDualLToggle: 'dualLToggle',
  qpDualRToggle: 'dualRToggle',
  qpDualBothToggle: 'dualBothToggle',
  qpSponsorToggle: 'sponsorToggle',
  qpToggle: 'tkrToggle',
  qpLivebugToggle: 'livebugToggle',
};

const ALL_TAB_TOGGLES = [
  'dualLToggle',
  'dualRToggle',
  'dualBothToggle',
  'sponsorToggle',
  'tkrToggle',
  'livebugToggle',
];

export function qpSyncToggles() {
  for (const [qpId, tabId] of Object.entries(QP_MAP)) {
    const qp = document.getElementById(qpId);
    const tab = document.getElementById(tabId);
    if (qp && tab) qp.checked = tab.checked;
  }
  const qpL = document.getElementById('qpDualLToggle');
  const qpR = document.getElementById('qpDualRToggle');
  const qpBoth = document.getElementById('qpDualBothToggle');
  if (qpL && qpR && qpBoth) {
    qpBoth.checked = qpL.checked && qpR.checked;
  }
}

export function initQuickPanel() {
  for (const [qpId, tabId] of Object.entries(QP_MAP)) {
    document.getElementById(qpId)?.addEventListener('change', function () {
      const tab = document.getElementById(tabId);
      if (tab && tab.checked !== this.checked) {
        tab.checked = this.checked;
        tab.dispatchEvent(new Event('change'));
      }
    });
  }

  for (const tabId of Object.values(QP_MAP)) {
    const tab = document.getElementById(tabId);
    if (!tab) continue;
    const row = tab.closest('.qc-toggle');
    if (!row) continue;
    row.style.cursor = 'pointer';
    row.addEventListener('click', (e) => {
      if (e.target.closest('input,label,button')) return;
      navigateToModule(tabId);
    });
  }

  const qpL = document.getElementById('qpDualLToggle');
  const qpR = document.getElementById('qpDualRToggle');
  const qpBoth = document.getElementById('qpDualBothToggle');
  if (qpL && qpBoth) {
    qpL.addEventListener('change', () => {
      qpBoth.checked = qpL.checked && (qpR?.checked || false);
    });
  }
  if (qpR && qpBoth) {
    qpR.addEventListener('change', () => {
      qpBoth.checked = (qpL?.checked || false) && qpR.checked;
    });
  }
  if (qpBoth && qpL && qpR) {
    qpBoth.addEventListener('change', () => {
      if (!qpBoth.checked) {
        if (qpL.checked) {
          qpL.checked = false;
          qpL.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (qpR.checked) {
          qpR.checked = false;
          qpR.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } else {
        if (!qpL.checked) {
          qpL.checked = true;
          qpL.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (!qpR.checked) {
          qpR.checked = true;
          qpR.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
  }

  document.addEventListener('change', (e) => {
    if (e.target && e.target.type === 'checkbox' && ALL_TAB_TOGGLES.includes(e.target.id)) {
      qpSyncToggles();
    }
  });

  setTimeout(qpSyncToggles, 300);
}
