import { loadJSON, saveJSON } from './storage.js';

// Map sidebar toggle IDs → tab toggle IDs
const QP_MAP = {
  qpScoreToggle: 'scoreToggle',
  qpLowerToggle: 'lowerToggle',
  qpDualLToggle: 'dualLToggle',
  qpDualRToggle: 'dualRToggle',
  qpSponsorToggle: 'sponsorToggle',
  qpToggle: 'tkrToggle',
  qpWeatherToggle: 'weatherToggle',
  qpCountdownToggle: 'countdownToggle',
  qpNowPlayingToggle: 'nowplayingToggle',
  qpComboToggle: 'comboToggle',
  qpResultadosToggle: 'resultadosToggle',
};

const ALL_TAB_TOGGLES = [
  'scoreToggle',
  'lowerToggle',
  'dualLToggle',
  'dualRToggle',
  'sponsorToggle',
  'tkrToggle',
  'weatherToggle',
  'countdownToggle',
  'nowplayingToggle',
  'comboToggle',
  'resultadosToggle',
];

export function qpSyncToggles() {
  for (const [qpId, tabId] of Object.entries(QP_MAP)) {
    const qp = document.getElementById(qpId);
    const tab = document.getElementById(tabId);
    if (qp && tab) qp.checked = tab.checked;
  }
}

function syncDualField(field) {
  document.getElementById('qpDual' + field)?.addEventListener('input', function () {
    const left = document.getElementById('dualL' + field);
    const right = document.getElementById('dualR' + field);
    if (left) left.value = this.value;
    if (right) right.value = this.value;
    const event = new Event('input', { bubbles: true });
    left?.dispatchEvent(event);
  });
}

function initQpGuestSlots() {
  const grid = document.getElementById('qp-guest-grid');
  if (!grid) return;
  const invitados = loadJSON('dual_guests', {});
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.className = 'guest-btn' + (invitados[i] ? ' filled' : '');
    btn.dataset.slot = String(i);
    btn.textContent = String(i);
    btn.title = invitados[i]
      ? `${invitados[i].nombre || ''} ${invitados[i].apellido || ''}`
      : 'Slot vacío — clic der. para guardar';
    btn.addEventListener('click', () => {
      const data = invitados[i];
      if (!data) return;
      document.getElementById('qpDualNombre').value = data.nombre || '';
      document.getElementById('qpDualApellido').value = data.apellido || '';
      document.getElementById('qpDualCargo').value = data.cargo || '';
      ['Nombre', 'Apellido', 'Cargo'].forEach((f) => {
        const el = document.getElementById('dualL' + f);
        if (el) el.value = data[f.toLowerCase()] || '';
        const el2 = document.getElementById('dualR' + f);
        if (el2) el2.value = data[f.toLowerCase()] || '';
      });
      grid.querySelectorAll('.guest-btn').forEach((b) => b.classList.remove('active-slot'));
      btn.classList.add('active-slot');
    });
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const nombre = document.getElementById('qpDualNombre').value.trim();
      const apellido = document.getElementById('qpDualApellido').value.trim();
      const cargo = document.getElementById('qpDualCargo').value.trim();
      if (!nombre && !apellido && !cargo) return;
      const data = { nombre, apellido, cargo };
      const existing = loadJSON('dual_guests', {});
      existing[i] = data;
      saveJSON('dual_guests', existing);
      invitados[i] = data;
      btn.classList.add('filled');
      btn.title = `${nombre} ${apellido}`;
      grid.querySelectorAll('.guest-btn').forEach((b) => b.classList.remove('active-slot'));
      btn.classList.add('active-slot');
    });
    grid.appendChild(btn);
  }
  if (invitados[1]) {
    document.getElementById('qpDualNombre').value = invitados[1].nombre || '';
    document.getElementById('qpDualApellido').value = invitados[1].apellido || '';
    document.getElementById('qpDualCargo').value = invitados[1].cargo || '';
    ['Nombre', 'Apellido', 'Cargo'].forEach((f) => {
      const el = document.getElementById('dualL' + f);
      if (el) el.value = invitados[1][f.toLowerCase()] || '';
      const el2 = document.getElementById('dualR' + f);
      if (el2) el2.value = invitados[1][f.toLowerCase()] || '';
    });
    const first = grid.querySelector('.guest-btn[data-slot="1"]');
    if (first) first.classList.add('active-slot');
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
  ['Nombre', 'Apellido', 'Cargo'].forEach(syncDualField);
  document.getElementById('qpMensaje')?.addEventListener('input', function () {
    const tkrMsg = document.getElementById('tkrMessage');
    if (tkrMsg) {
      tkrMsg.value = this.value;
      tkrMsg.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  initQpGuestSlots();
  setTimeout(qpSyncToggles, 300);
}
