import { loadJSON, saveJSON, onStorageSave } from './storage.js';

const QP_MAP = {
  qpDualLToggle: 'dualLToggle',
  qpDualRToggle: 'dualRToggle',
  qpDualBothToggle: 'dualBothToggle',
  qpSponsorToggle: 'sponsorToggle',
  qpToggle: 'tkrToggle',
  qpComboToggle: 'comboToggle',
};

const ALL_TAB_TOGGLES = [
  'scoreToggle',
  'lowerToggle',
  'dualLToggle',
  'dualRToggle',
  'dualBothToggle',
  'sponsorToggle',
  'tkrToggle',
  'weatherToggle',
  'countdownToggle',
  'nowplayingToggle',
  'comboToggle',
  'resultadosToggle',
  'livebugToggle',
];

const LONG_PRESS_MS = 2000;

export function qpSyncToggles() {
  for (const [qpId, tabId] of Object.entries(QP_MAP)) {
    const qp = document.getElementById(qpId);
    const tab = document.getElementById(tabId);
    if (qp && tab) qp.checked = tab.checked;
  }
}

function updatePreview(previewId, data, formatFn) {
  const preview = document.getElementById(previewId);
  if (!preview) return;
  if (!data) {
    preview.textContent = '';
    return;
  }
  preview.textContent = formatFn(data);
}

function addLongPressDelete(btn, slotNum, invitados, storageKey) {
  let pressTimer = null;
  let progressInterval = null;
  const originalText = String(slotNum);

  function startLongPress() {
    let elapsed = 0;
    const step = 100;
    btn.style.opacity = '1';
    progressInterval = setInterval(() => {
      elapsed += step;
      const progress = elapsed / LONG_PRESS_MS;
      btn.style.opacity = String(1 - progress * 0.7);
      btn.textContent = Math.ceil((LONG_PRESS_MS - elapsed) / 1000) + 's';
      if (elapsed >= LONG_PRESS_MS) {
        clearInterval(progressInterval);
        delete invitados[slotNum];
        saveJSON(storageKey, invitados);
        btn.style.opacity = '1';
        btn.textContent = originalText;
      }
    }, step);
  }

  function cancelLongPress() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    btn.style.opacity = '1';
    btn.textContent = originalText;
  }

  btn.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      pressTimer = setTimeout(() => {
        startLongPress();
      }, 200);
    }
  });

  btn.addEventListener('mouseup', cancelLongPress);
  btn.addEventListener('mouseleave', cancelLongPress);
  btn.addEventListener('contextmenu', cancelLongPress);
}

function initDualSlots(gridId, side, previewId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  let invitados = loadJSON('dual_guests', {});
  const fieldPrefix = side === 'L' ? 'dualL' : 'dualR';

  function formatDual(d) {
    if (!d) return '';
    const lines = [];
    if (d.nombre) lines.push(d.nombre);
    if (d.apellido) lines.push(d.apellido);
    if (d.cargo) lines.push(d.cargo);
    return lines.join('\n') || 'Slot vacío';
  }

  function refresh() {
    invitados = loadJSON('dual_guests', {});
    grid.querySelectorAll('.guest-btn').forEach((btn) => {
      const i = Number(btn.dataset.slot);
      const filled = !!invitados[i];
      btn.classList.toggle('filled', filled);
      btn.title = filled ? formatDual(invitados[i]) : 'Slot vacío — clic der. para guardar';
    });
  }

  onStorageSave('dual_guests', refresh);

  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.className = 'guest-btn' + (invitados[i] ? ' filled' : '');
    btn.dataset.slot = String(i);
    btn.textContent = String(i);
    btn.title = invitados[i] ? formatDual(invitados[i]) : 'Slot vacío — clic der. para guardar';

    addLongPressDelete(btn, i, invitados, 'dual_guests');

    btn.addEventListener('click', () => {
      invitados = loadJSON('dual_guests', {});
      const data = invitados[i];
      if (!data) return;
      document.getElementById(fieldPrefix + 'Nombre').value = data.nombre || '';
      document.getElementById(fieldPrefix + 'Apellido').value = data.apellido || '';
      document.getElementById(fieldPrefix + 'Cargo').value = data.cargo || '';
      const ev = new Event('input', { bubbles: true });
      document.getElementById(fieldPrefix + 'Nombre')?.dispatchEvent(ev);
      grid.querySelectorAll('.guest-btn').forEach((b) => b.classList.remove('active-slot'));
      btn.classList.add('active-slot');
      updatePreview(previewId, data, formatDual);
    });

    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const nombre = document.getElementById(fieldPrefix + 'Nombre').value.trim();
      const apellido = document.getElementById(fieldPrefix + 'Apellido').value.trim();
      const cargo = document.getElementById(fieldPrefix + 'Cargo').value.trim();
      if (!nombre && !apellido && !cargo) return;
      const data = { nombre, apellido, cargo };
      invitados[i] = data;
      saveJSON('dual_guests', invitados);
      btn.classList.add('filled');
      btn.title = formatDual(data);
      grid.querySelectorAll('.guest-btn').forEach((b) => b.classList.remove('active-slot'));
      btn.classList.add('active-slot');
      updatePreview(previewId, data, formatDual);
    });

    grid.appendChild(btn);
  }

  if (invitados[1]) {
    document.getElementById(fieldPrefix + 'Nombre').value = invitados[1].nombre || '';
    document.getElementById(fieldPrefix + 'Apellido').value = invitados[1].apellido || '';
    document.getElementById(fieldPrefix + 'Cargo').value = invitados[1].cargo || '';
    const first = grid.querySelector('.guest-btn[data-slot="1"]');
    if (first) {
      first.classList.add('active-slot');
      updatePreview(previewId, invitados[1], formatDual);
    }
  }
}

function initTickerSlots() {
  const grid = document.getElementById('qp-ticker-grid');
  if (!grid) return;
  let invitados = loadJSON('ticker_guests', {});

  function formatTicker(d) {
    if (!d) return '';
    const lines = [];
    if (d.title) lines.push('[' + d.title + ']');
    if (d.message) lines.push(d.message);
    return lines.join('\n') || 'Slot vacío';
  }

  function refresh() {
    invitados = loadJSON('ticker_guests', {});
    grid.querySelectorAll('.guest-btn').forEach((btn) => {
      const i = Number(btn.dataset.slot);
      const filled = !!invitados[i];
      btn.classList.toggle('filled', filled);
      btn.title = filled ? formatTicker(invitados[i]) : 'Slot vacío — clic der. para guardar';
    });
  }

  onStorageSave('ticker_guests', refresh);

  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.className = 'guest-btn' + (invitados[i] ? ' filled' : '');
    btn.dataset.slot = String(i);
    btn.textContent = String(i);
    btn.title = invitados[i] ? formatTicker(invitados[i]) : 'Slot vacío — clic der. para guardar';

    addLongPressDelete(btn, i, invitados, 'ticker_guests');

    btn.addEventListener('click', () => {
      invitados = loadJSON('ticker_guests', {});
      const data = invitados[i];
      if (!data) return;
      const tkrTitle = document.getElementById('tkrTitle');
      const tkrMsg = document.getElementById('tkrMessage');
      if (tkrTitle && data.title !== undefined) tkrTitle.value = data.title;
      if (tkrMsg && data.message !== undefined) {
        tkrMsg.value = data.message;
        tkrMsg.dispatchEvent(new Event('input', { bubbles: true }));
      }
      grid.querySelectorAll('.guest-btn').forEach((b) => b.classList.remove('active-slot'));
      btn.classList.add('active-slot');
      updatePreview('qp-ticker-preview', data, formatTicker);
    });

    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const title = document.getElementById('tkrTitle')?.value.trim() || '';
      const message = document.getElementById('tkrMessage')?.value.trim() || '';
      if (!title && !message) return;
      const data = { title, message };
      invitados[i] = data;
      saveJSON('ticker_guests', invitados);
      btn.classList.add('filled');
      btn.title = formatTicker(data);
      grid.querySelectorAll('.guest-btn').forEach((b) => b.classList.remove('active-slot'));
      btn.classList.add('active-slot');
      updatePreview('qp-ticker-preview', data, formatTicker);
    });

    grid.appendChild(btn);
  }

  if (invitados[1]) {
    const tkrTitle = document.getElementById('tkrTitle');
    const tkrMsg = document.getElementById('tkrMessage');
    if (tkrTitle && invitados[1].title !== undefined) tkrTitle.value = invitados[1].title;
    if (tkrMsg && invitados[1].message !== undefined) {
      tkrMsg.value = invitados[1].message;
    }
    const first = grid.querySelector('.guest-btn[data-slot="1"]');
    if (first) {
      first.classList.add('active-slot');
      updatePreview('qp-ticker-preview', invitados[1], formatTicker);
    }
  }
}

function initSidebarToggle() {
  const toggleBtn = document.getElementById('sidebar-toggle');
  const collapseBtn = document.getElementById('qp-collapse-btn');
  const panel = document.getElementById('quick-panel');
  if (!toggleBtn || !panel) return;

  const savedState = localStorage.getItem('sidebar_hidden');
  if (savedState === 'true') {
    document.body.classList.add('sidebar-hidden');
  }

  const savedCollapsed = localStorage.getItem('sidebar_collapsed');
  if (savedCollapsed === 'true' && panel) {
    panel.classList.add('collapsed');
  }

  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('sidebar-hidden');
    const isHidden = document.body.classList.contains('sidebar-hidden');
    localStorage.setItem('sidebar_hidden', String(isHidden));
  });

  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      panel.classList.toggle('collapsed');
      const isCollapsed = panel.classList.contains('collapsed');
      localStorage.setItem('sidebar_collapsed', String(isCollapsed));
    });
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
  document.addEventListener('change', (e) => {
    if (
      e.target &&
      e.target.type === 'checkbox' &&
      ALL_TAB_TOGGLES.includes(e.target.id)
    ) {
      qpSyncToggles();
    }
  });
  initDualSlots('qp-dualL-grid', 'L', 'qp-dualL-preview');
  initDualSlots('qp-dualR-grid', 'R', 'qp-dualR-preview');
  initTickerSlots();
  initSidebarToggle();
  setTimeout(qpSyncToggles, 300);
}
