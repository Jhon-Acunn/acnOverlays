import { io } from 'socket.io-client';

// Theme toggle
(function() {
  const stored = localStorage.getItem('theme');
  if (stored === 'light') document.documentElement.setAttribute('data-theme', 'light');
  const toggle = document.getElementById('themeSwitch');
  if (toggle) {
    toggle.checked = stored === 'light';
    toggle.addEventListener('change', () => {
      const theme = toggle.checked ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    });
  }
})();

const socket = io({
  reconnectionDelay: 1000,
  reconnectionAttempts: 10
});

socket.on('connect_error', (err) => {
  console.error('[SOCKET] Error de conexión:', err.message);
});

socket.on('disconnect', (reason) => {
  console.warn('[SOCKET] Desconectado:', reason);
});

function ajustarEscalas() {
  document.querySelectorAll('.preview-scene').forEach(scene => {
    const w = scene.clientWidth || scene.offsetWidth;
    if (w === 0) return;
    const stage = scene.querySelector('.preview-stage');
    if (!stage) return;
    stage.style.transform = `scale(${w / 1920})`;
  });
}

// ── Tab switching with scroll memory ──
const scrollPositions = {};

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const prevTab = document.querySelector('.tab-content.active');
    // Save scroll position of current tab
    if (prevTab) scrollPositions[prevTab.dataset.tabContent] = { top: window.scrollY, left: window.scrollX };

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');

    const target = document.querySelector(`[data-tab-content="${tab.dataset.tab}"]`);
    target.classList.add('active');

    // Restore scroll position of target tab
    const saved = scrollPositions[tab.dataset.tab];
    if (saved) {
      requestAnimationFrame(() => window.scrollTo(saved.left || 0, saved.top || 0));
    } else {
      requestAnimationFrame(() => window.scrollTo(0, 0));
    }

    requestAnimationFrame(ajustarEscalas);
    setTimeout(qpSyncToggles, 50); // sync sidebar toggles
  });
});

function cargarScore() {
  try {
    const saved = JSON.parse(localStorage.getItem('scoreboard'));
    if (saved && typeof saved.scoreA === 'number' && typeof saved.scoreB === 'number') {
      return saved;
    }
  } catch (_) { /* ignorar */ }
  return { scoreA: 0, scoreB: 0 };
}

function guardarScore() {
  localStorage.setItem('scoreboard', JSON.stringify({ scoreA, scoreB }));
}

let { scoreA, scoreB } = cargarScore();

document.getElementById('displayA').innerText = scoreA;
document.getElementById('displayB').innerText = scoreB;

/* ── Scoreboard helpers ── */

// Helper: Convierte color hex (#rrggbb o #rgb) o rgb/rgba a rgba con opacidad
function hexToRgba(hex, opacity) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0,0,0,${opacity})`;
  return `rgba(${r},${g},${b},${opacity})`;
}

function colorWithOpacity(color, opacity) {
  if (!color) return `rgba(0,0,0,${opacity})`;
  const trimmed = color.trim();
  // Already rgb or rgba
  if (trimmed.startsWith('rgba')) return trimmed.replace(/[\d.]+\)$/, opacity + ')');
  if (trimmed.startsWith('rgb')) return trimmed.replace('rgb', 'rgba').replace(')', ', ' + opacity + ')');
  // Hex or any other → convert
  return hexToRgba(trimmed, opacity);
}

function leerScoreEstilo() {
  const bgColor = document.getElementById('scBgColor').value || '#000000';
  const bgOpacity = parseInt(document.getElementById('scBgOpacity').value, 10) / 100 || 0.75;
  const teamABg = document.getElementById('scTeamABg').value || '#1e50c8';
  const teamAOpacity = parseInt(document.getElementById('scTeamAOpacity').value, 10) / 100 || 0.3;
  const teamBBg = document.getElementById('scTeamBBg').value || '#c83232';
  const teamBOpacity = parseInt(document.getElementById('scTeamBOpacity').value, 10) / 100 || 0.3;
  return {
    fontFamily: 'Inter, sans-serif',
    scoreSize: document.getElementById('scScoreSize').value + 'rem',
    teamSize: document.getElementById('scTeamSize').value + 'rem',
    scoreColor: document.getElementById('scScoreColor').value,
    teamColor: document.getElementById('scTeamColor').value,
    bgColor: colorWithOpacity(bgColor, bgOpacity),
    borderRadius: parseInt(document.getElementById('scRadius').value, 10) || 12,
    teamABg: colorWithOpacity(teamABg, teamAOpacity),
    teamBBg: colorWithOpacity(teamBBg, teamBOpacity),
    dividerColor: document.getElementById('scDividerColor').value,
    escala: 1.0,
    posY: parseInt(document.getElementById('scPosY').value, 10) || 40
  };
}

function leerScoreData(accion) {
  return {
    accion,
    txtEquipoA: document.getElementById('nameA').value || 'LOCAL',
    puntosA: scoreA,
    txtEquipoB: document.getElementById('nameB').value || 'VISITANTE',
    puntosB: scoreB,
    estilo: leerScoreEstilo()
  };
}

function enviarPreviewScore() {
  const iframe = document.querySelector('[data-tab-content="scoreboard"] .preview-iframe');
  if (!iframe || !iframe.contentWindow) return;
  iframe.contentWindow.postMessage({
    tipo: 'PREVIEW_SCOREBOARD',
    data: leerScoreData()
  }, '*');
}

function scoreEmit(accion) {
  socket.emit('update-graphic', {
    tipo: 'SCOREBOARD',
    data: leerScoreData(accion)
  });
}

function modificarScore(equipo, valor) {
  if (equipo === 'A') {
    scoreA = Math.max(0, scoreA + valor);
    document.getElementById('displayA').innerText = scoreA;
  }
  if (equipo === 'B') {
    scoreB = Math.max(0, scoreB + valor);
    document.getElementById('displayB').innerText = scoreB;
  }
  guardarScore();
  scoreEmit();
}

function resetearScore() {
  scoreA = 0;
  scoreB = 0;
  document.getElementById('displayA').innerText = '0';
  document.getElementById('displayB').innerText = '0';
  guardarScore();
  scoreEmit();
}

function enviarScore() {
  scoreEmit();
}

document.getElementById('nameA').addEventListener('input', enviarScore);
document.getElementById('nameB').addEventListener('input', enviarScore);

// Toggle show/hide
document.getElementById('scoreToggle').addEventListener('change', function() {
  this.checked ? scoreEmit('SHOW') : scoreEmit('HIDE');
  document.getElementById('scoreToggleLabel').textContent = this.checked ? 'Encendido' : 'Apagado';
});

// Style controls → preview
for (const id of ['scScoreSize', 'scTeamSize', 'scScoreColor', 'scTeamColor', 'scBgColor', 'scRadius', 'scTeamABg', 'scTeamBBg', 'scDividerColor', 'scPosY']) {
  document.getElementById(id)?.addEventListener('input', () => {
    actualizarValScore();
    enviarPreviewScore();
  });
}

for (const id of ['scBgOpacity', 'scTeamAOpacity', 'scTeamBOpacity']) {
  document.getElementById(id)?.addEventListener('input', () => {
    actualizarValScore();
    enviarPreviewScore();
  });
}

function actualizarValScore() {
  document.getElementById('valScScoreSize').textContent = document.getElementById('scScoreSize').value + 'rem';
  document.getElementById('valScTeamSize').textContent = document.getElementById('scTeamSize').value + 'rem';
  document.getElementById('valScBgOpacity').textContent = document.getElementById('scBgOpacity').value + '%';
  document.getElementById('valScRadius').textContent = document.getElementById('scRadius').value + 'px';
  document.getElementById('valScTeamAOpacity').textContent = document.getElementById('scTeamAOpacity').value + '%';
  document.getElementById('valScTeamBOpacity').textContent = document.getElementById('scTeamBOpacity').value + '%';
  document.getElementById('valScPosY').textContent = document.getElementById('scPosY').value + 'px';
}

document.getElementById('scResetStyle')?.addEventListener('click', () => {
  document.getElementById('scScoreSize').value = '3.5';
  document.getElementById('scTeamSize').value = '1.0';
  document.getElementById('scScoreColor').value = '#ffffff';
  document.getElementById('scTeamColor').value = '#aaaaaa';
  document.getElementById('scBgColor').value = '#000000';
  document.getElementById('scBgOpacity').value = '75';
  document.getElementById('scRadius').value = '12';
  document.getElementById('scTeamABg').value = '#1e50c8';
  document.getElementById('scTeamAOpacity').value = '30';
  document.getElementById('scTeamBBg').value = '#c83232';
  document.getElementById('scTeamBOpacity').value = '30';
  document.getElementById('scDividerColor').value = '#555555';
  document.getElementById('scPosY').value = '40';
  actualizarValScore();
  enviarPreviewScore();
});

actualizarValScore();
setTimeout(enviarPreviewScore, 500);

for (const id of ['inputTitleSize', 'inputSubtitleSize', 'inputScale', 'inputPosX', 'inputPosY']) {
  const el = document.getElementById(id);
  const val = document.getElementById('val' + id.slice(5));
  el.addEventListener('input', () => {
    if (id === 'inputScale') val.textContent = el.value + 'x';
    else if (id === 'inputPosX' || id === 'inputPosY') val.textContent = el.value + 'px';
    else val.textContent = el.value + 'rem';
    enviarPreview();
  });
}

for (const id of ['inputNombre', 'inputApellido', 'inputCargo', 'inputFont', 'inputTitleColor', 'inputTitleBg', 'inputSubtitleColor', 'inputSubtitleBg']) {
  document.getElementById(id).addEventListener('input', enviarPreview);
}

window.addEventListener('resize', ajustarEscalas);
requestAnimationFrame(ajustarEscalas);
setTimeout(enviarPreview, 500);

document.querySelectorAll('[data-score]').forEach(btn => {
  btn.addEventListener('click', () => {
    modificarScore(btn.dataset.score, parseInt(btn.dataset.val, 10));
  });
});

document.querySelector('[data-reset-score]').addEventListener('click', resetearScore);

// Shared: prevent Enter on any font dropdown input
document.querySelectorAll('input[list="fontList"], input[list="spFontList"], input[list="tkrFontList"]').forEach(inp => {
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
  });
});

document.getElementById('fontDropdownBtn').addEventListener('click', () => {
  const input = document.getElementById('inputFont');
  const prev = input.value;
  input.value = '';
  input.showPicker();
  requestAnimationFrame(() => {
    input.addEventListener('blur', function restore() {
      if (!input.value) input.value = prev;
      input.removeEventListener('blur', restore);
    }, { once: true });
  });
});

document.querySelector('[data-reset-title]').addEventListener('click', () => {
  document.getElementById('inputTitleSize').value = '3.0';
  document.getElementById('inputTitleColor').value = '#ffffff';
  document.getElementById('inputTitleBg').value = '#06155A';
 document.getElementById('valTitleSize').textContent = '3.0rem';
  enviarPreview();
});
document.querySelector('[data-reset-sub]').addEventListener('click', () => {
  document.getElementById('inputSubtitleSize').value = '2.5';
  document.getElementById('inputSubtitleColor').value = '#111111';
  document.getElementById('inputSubtitleBg').value = '#ffffff';
  document.getElementById('valSubtitleSize').textContent = '2.5rem';
  enviarPreview();
});
document.querySelector('[data-reset-pos]').addEventListener('click', () => {
  document.getElementById('inputScale').value = '1.0';
  document.getElementById('inputPosX').value = '100';
  document.getElementById('inputPosY').value = '90';
  document.getElementById('valScale').textContent = '1.0x';
  document.getElementById('valPosX').textContent = '100px';
  document.getElementById('valPosY').textContent = '90px';
  enviarPreview();
});

document.getElementById('lowerToggle').addEventListener('change', function() {
  enviarTercio(this.checked ? 'SHOW' : 'HIDE');
  document.getElementById('lowerToggleLabel').textContent = this.checked ? 'Encendido' : 'Apagado';
});

// ── Dual Lower Third ──────────────────────────────

function leerDualCfg() {
  const estiloL = {
    escala: parseFloat(document.getElementById('dualLScale').value) || 1.0,
    posX: parseInt(document.getElementById('dualLX').value, 10) || 100,
    posY: parseInt(document.getElementById('dualLY').value, 10) || 90
  };
  const estiloR = {
    escala: parseFloat(document.getElementById('dualRScale').value) || 1.0,
    posX: parseInt(document.getElementById('dualRX').value, 10) || 100,
    posY: parseInt(document.getElementById('dualRY').value, 10) || 90
  };
  const shared = {
    fontFamily: document.getElementById('dualFont').value || 'Montserrat, sans-serif',
    titleFontSize: document.getElementById('dualTitleSize').value + 'rem',
    subtitleFontSize: document.getElementById('dualSubSize').value + 'rem',
    titleColor: document.getElementById('dualTitleColor').value,
    titleBg: document.getElementById('dualTitleBg').value,
    subtitleColor: document.getElementById('dualSubColor').value,
    subtitleBg: document.getElementById('dualSubBg').value
  };
  return {
    left: {
      nombre: document.getElementById('dualLNombre').value,
      apellido: document.getElementById('dualLApellido').value,
      cargo: document.getElementById('dualLCargo').value,
      estilo: { ...shared, ...estiloL }
    },
    right: {
      nombre: document.getElementById('dualRNombre').value,
      apellido: document.getElementById('dualRApellido').value,
      cargo: document.getElementById('dualRCargo').value,
      estilo: { ...shared, ...estiloR }
    }
  };
}

function enviarPreviewDual() {
  const iframe = document.querySelector('[data-tab-content="lower-dual"] .preview-iframe');
  if (!iframe || !iframe.contentWindow) return;
  iframe.contentWindow.postMessage({ tipo: 'PREVIEW_LOWER_DUAL', data: leerDualCfg() }, '*');
}

function dualEmit(cfg) {
  socket.emit('update-graphic', { tipo: 'LOWER_DUAL', data: cfg });
}

function actualizarValDual() {
  document.getElementById('valDualTitleSize').textContent = document.getElementById('dualTitleSize').value + 'rem';
  document.getElementById('valDualSubSize').textContent = document.getElementById('dualSubSize').value + 'rem';
  document.getElementById('valDualLScale').textContent = document.getElementById('dualLScale').value + 'x';
  document.getElementById('valDualLX').textContent = document.getElementById('dualLX').value + 'px';
  document.getElementById('valDualLY').textContent = document.getElementById('dualLY').value + 'px';
  document.getElementById('valDualRScale').textContent = document.getElementById('dualRScale').value + 'x';
  document.getElementById('valDualRX').textContent = document.getElementById('dualRX').value + 'px';
  document.getElementById('valDualRY').textContent = document.getElementById('dualRY').value + 'px';
}

// ── Individual toggles (independent) + Both ──

let dualToggleBusy = false;

function dualSyncBoth() {
  const both = document.getElementById('dualBothToggle');
  const on = document.getElementById('dualLToggle').checked && document.getElementById('dualRToggle').checked;
  if (both.checked !== on) {
    both.checked = on;
    document.getElementById('dualBothToggleLabel').textContent = on ? 'Encendido' : 'Apagado';
  }
}

document.getElementById('dualLToggle').addEventListener('change', function() {
  if (dualToggleBusy) return;
  dualToggleBusy = true;
  if (this.checked) {
    const cfg = leerDualCfg();
    dualEmit({ accion: 'SHOW_LEFT', left: cfg.left });
  } else {
    dualEmit({ accion: 'HIDE_LEFT' });
  }
  dualSyncBoth();
  dualToggleBusy = false;
});

document.getElementById('dualRToggle').addEventListener('change', function() {
  if (dualToggleBusy) return;
  dualToggleBusy = true;
  if (this.checked) {
    const cfg = leerDualCfg();
    dualEmit({ accion: 'SHOW_RIGHT', right: cfg.right });
  } else {
    dualEmit({ accion: 'HIDE_RIGHT' });
  }
  dualSyncBoth();
  dualToggleBusy = false;
});

document.getElementById('dualBothToggle').addEventListener('change', function() {
  if (dualToggleBusy) return;
  dualToggleBusy = true;
  const cfg = leerDualCfg();
  if (this.checked) {
    if (!document.getElementById('dualLToggle').checked) {
      document.getElementById('dualLToggle').checked = true;
      document.getElementById('dualLToggleLabel').textContent = 'Encendido';
    }
    if (!document.getElementById('dualRToggle').checked) {
      document.getElementById('dualRToggle').checked = true;
      document.getElementById('dualRToggleLabel').textContent = 'Encendido';
    }
    dualEmit({ accion: 'SHOW', left: cfg.left, right: cfg.right });
  } else {
    dualEmit({ accion: 'HIDE' });
    document.getElementById('dualLToggle').checked = false;
    document.getElementById('dualLToggleLabel').textContent = 'Apagado';
    document.getElementById('dualRToggle').checked = false;
    document.getElementById('dualRToggleLabel').textContent = 'Apagado';
  }
  dualToggleBusy = false;
});

for (const id of ['dualLNombre', 'dualLApellido', 'dualLCargo', 'dualRNombre', 'dualRApellido', 'dualRCargo', 'dualFont', 'dualTitleColor', 'dualTitleBg', 'dualSubColor', 'dualSubBg']) {
  document.getElementById(id).addEventListener('input', enviarPreviewDual);
}

for (const id of ['dualTitleSize', 'dualSubSize', 'dualLScale', 'dualLX', 'dualLY', 'dualRScale', 'dualRX', 'dualRY']) {
  const el = document.getElementById(id);
  el.addEventListener('input', () => { actualizarValDual(); enviarPreviewDual(); });
}

actualizarValDual();
setTimeout(enviarPreviewDual, 500);

// Font dropdown
document.getElementById('dualFontDropdownBtn')?.addEventListener('click', () => {
  const input = document.getElementById('dualFont');
  const prev = input.value;
  input.value = '';
  input.showPicker();
  requestAnimationFrame(() => {
    input.addEventListener('blur', function restore() {
      if (!input.value) input.value = prev;
      input.removeEventListener('blur', restore);
    }, { once: true });
  });
});

// Dual style resets
document.querySelector('[data-dual-reset-title]')?.addEventListener('click', () => {
  document.getElementById('dualTitleSize').value = '3.0';
  document.getElementById('dualTitleColor').value = '#ffffff';
  document.getElementById('dualTitleBg').value = '#06155A';
  actualizarValDual();
  enviarPreviewDual();
});
document.querySelector('[data-dual-reset-sub]')?.addEventListener('click', () => {
  document.getElementById('dualSubSize').value = '2.5';
  document.getElementById('dualSubColor').value = '#111111';
  document.getElementById('dualSubBg').value = '#ffffff';
  actualizarValDual();
  enviarPreviewDual();
});
document.querySelector('[data-dual-reset-left]')?.addEventListener('click', () => {
  document.getElementById('dualLScale').value = '1.0';
  document.getElementById('dualLX').value = '100';
  document.getElementById('dualLY').value = '90';
  actualizarValDual();
  enviarPreviewDual();
});
document.querySelector('[data-dual-reset-right]')?.addEventListener('click', () => {
  document.getElementById('dualRScale').value = '1.0';
  document.getElementById('dualRX').value = '100';
  document.getElementById('dualRY').value = '90';
  actualizarValDual();
  enviarPreviewDual();
});

// ── Dual Guest Slots (shared 10 presets, independent left/right assign) ──

const DUAL_GUEST_KEY = 'dual_guests';
function cargarDualInvitados() {
  try { return JSON.parse(localStorage.getItem(DUAL_GUEST_KEY)) || {}; } catch { return {}; }
}
function guardarDualInvitados(data) {
  localStorage.setItem(DUAL_GUEST_KEY, JSON.stringify(data));
}

const dualInvitados = cargarDualInvitados();

function crearDualSlots(containerId, prefix) {
  const grid = document.getElementById(containerId);
  if (!grid) return;

  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.className = 'guest-btn' + (dualInvitados[i] ? ' filled' : '');
    btn.dataset.slot = i;
    btn.textContent = i;
    btn.title = dualInvitados[i]
      ? `${dualInvitados[i].nombre || ''} ${dualInvitados[i].apellido || ''}`
      : 'Slot vacío — clic der. para guardar';

    btn.addEventListener('click', (e) => {
      if (e.shiftKey) {
        delete dualInvitados[i];
        guardarDualInvitados(dualInvitados);
        document.querySelectorAll(`#${containerId} .guest-btn`).forEach(b => {
          if (b.dataset.slot == i) { b.classList.remove('filled'); b.title = 'Slot vacío — clic der. para guardar'; }
        });
        return;
      }
      const data = dualInvitados[i];
      if (!data) return;
      document.getElementById(prefix + 'Nombre').value = data.nombre || '';
      document.getElementById(prefix + 'Apellido').value = data.apellido || '';
      document.getElementById(prefix + 'Cargo').value = data.cargo || '';
      // Mark active on this side only
      document.querySelectorAll(`#${containerId} .guest-btn`).forEach(b => b.classList.remove('active-slot'));
      btn.classList.add('active-slot');
      enviarPreviewDual();
    });

    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const nombre = document.getElementById(prefix + 'Nombre').value.trim();
      const apellido = document.getElementById(prefix + 'Apellido').value.trim();
      const cargo = document.getElementById(prefix + 'Cargo').value.trim();
      if (!nombre && !apellido && !cargo) return;
      dualInvitados[i] = { nombre, apellido, cargo };
      guardarDualInvitados(dualInvitados);
      document.querySelectorAll(`#${containerId} .guest-btn`).forEach(b => {
        if (b.dataset.slot == i) { b.classList.add('filled'); b.title = `${nombre} ${apellido}`; }
      });
      document.querySelectorAll(`#${containerId} .guest-btn`).forEach(b => b.classList.remove('active-slot'));
      btn.classList.add('active-slot');
      enviarPreviewDual();
    });

    grid.appendChild(btn);
  }
}

crearDualSlots('dualL-guest-grid', 'dualL');
crearDualSlots('dualR-guest-grid', 'dualR');

if (dualInvitados[1]) {
  const d1 = dualInvitados[1];
  document.getElementById('dualLNombre').value = d1.nombre || '';
  document.getElementById('dualLApellido').value = d1.apellido || '';
  document.getElementById('dualLCargo').value = d1.cargo || '';
  document.getElementById('dualRNombre').value = d1.nombre || '';
  document.getElementById('dualRApellido').value = d1.apellido || '';
  document.getElementById('dualRCargo').value = d1.cargo || '';
}

let tickerLogoUrl = null;

function leerTkrCfg() {
  return {
    title: document.getElementById('tkrTitle').value,
    message: document.getElementById('tkrMessage').value,
    logoUrl: tickerLogoUrl,
    speed: parseFloat(document.getElementById('tkrSpeed').value) || 80,
    logoWidth: parseFloat(document.getElementById('tkrLogoWidth').value) || 4,
    fontSize: parseFloat(document.getElementById('tkrFontSize').value) || 33,
    fontFamily: document.getElementById('tkrFont').value || 'Inter, sans-serif',
    titleSize: parseInt(document.getElementById('tkrTitleSize').value, 10) || 44,
    titleColor: document.getElementById('tkrTitleColor').value || '#ffffff',
    titleBg: document.getElementById('tkrTitleBg').value || '#071041',
    msgColor: document.getElementById('tkrMsgColor').value || '#111111',
    msgBg: document.getElementById('tkrMsgBg').value || '#ffffff'
  };
}

function enviarPreviewTicker() {
  const iframe = document.querySelector('[data-tab-content="ticker"] .preview-iframe');
  if (!iframe || !iframe.contentWindow) return;
  iframe.contentWindow.postMessage({
    tipo: 'PREVIEW_TICKER',
    data: leerTkrCfg()
  }, '*');
}

function tickerEmit() {
  const cfg = leerTkrCfg();
  cfg.accion = document.getElementById('tkrToggle').checked ? 'SHOW' : 'HIDE';
  socket.emit('update-graphic', {
    tipo: 'TICKER',
    data: cfg
  });
}

function actualizarValoresTkr() {
  document.getElementById('valTkrSpeed').textContent = document.getElementById('tkrSpeed').value + 'px/s';
  document.getElementById('valTkrLogoWidth').textContent = document.getElementById('tkrLogoWidth').value + '%';
  document.getElementById('valTkrFontSize').textContent = document.getElementById('tkrFontSize').value + 'px';
  document.getElementById('valTkrTitleSize').textContent = document.getElementById('tkrTitleSize').value + 'px';
}

document.getElementById('tkrToggle').addEventListener('change', function() {
  const label = document.getElementById('tkrToggleLabel');
  label.textContent = this.checked ? 'Encendido' : 'Apagado';
  tickerEmit();
});

for (const id of ['tkrTitle', 'tkrMessage', 'tkrSpeed', 'tkrLogoWidth', 'tkrFontSize', 'tkrFont', 'tkrTitleSize', 'tkrTitleColor', 'tkrTitleBg', 'tkrMsgColor', 'tkrMsgBg']) {
  document.getElementById(id).addEventListener('input', () => {
    actualizarValoresTkr();
    enviarPreviewTicker();
  });
}
actualizarValoresTkr();
setTimeout(enviarPreviewTicker, 500);

// Font dropdown for ticker — match Lower Third behavior
document.getElementById('tkrFontDropdownBtn')?.addEventListener('click', () => {
  const input = document.getElementById('tkrFont');
  const prev = input.value;
  input.value = '';
  input.showPicker();
  requestAnimationFrame(() => {
    input.addEventListener('blur', function restore() {
      if (!input.value) input.value = prev;
      input.removeEventListener('blur', restore);
    }, { once: true });
  });
});

// Reset title style
document.querySelector('[data-reset-tkr-title]')?.addEventListener('click', () => {
  document.getElementById('tkrTitleSize').value = 44;
  document.getElementById('tkrTitleColor').value = '#ffffff';
  document.getElementById('tkrTitleBg').value = '#071041';
  actualizarValoresTkr();
  enviarPreviewTicker();
});

// Reset message style
document.querySelector('[data-reset-tkr-msg]')?.addEventListener('click', () => {
  document.getElementById('tkrFontSize').value = 33;
  document.getElementById('tkrMsgColor').value = '#111111';
  document.getElementById('tkrMsgBg').value = '#ffffff';
  actualizarValoresTkr();
  enviarPreviewTicker();
});

async function cargarTkrLogos() {
  const container = document.getElementById('tkr-logo-select');
  if (!container) return;
  try {
    const res = await fetch('/api/media');
    const files = await res.json();
    container.innerHTML = '';
    const btnNinguno = document.createElement('button');
    btnNinguno.textContent = 'Ninguno';
    btnNinguno.style.cssText = 'font-size:0.7rem;padding:2px 6px;border-radius:4px;border:2px solid #2a2a36;background:#1a1a24;color:#888;cursor:pointer;';
    btnNinguno.dataset.logo = '';
    btnNinguno.addEventListener('click', () => {
      document.querySelectorAll('#tkr-logo-select button').forEach(b => b.style.borderColor = '#2a2a36');
      btnNinguno.style.borderColor = '#6af';
      tickerLogoUrl = null;
      enviarPreviewTicker();
    });
    btnNinguno.style.borderColor = tickerLogoUrl ? '#2a2a36' : '#6af';
    container.appendChild(btnNinguno);
    for (const f of files) {
      const btn = document.createElement('button');
      btn.style.cssText = 'width:40px;height:32px;border-radius:4px;border:2px solid #2a2a36;background:#0f0f13;cursor:pointer;overflow:hidden;padding:0;';
      btn.innerHTML = `<img src="${f.url}" style="width:100%;height:100%;object-fit:contain;">`;
      btn.dataset.logo = f.url;
      btn.title = f.name;
      if (tickerLogoUrl === f.url) btn.style.borderColor = '#6af';
      btn.addEventListener('click', () => {
        document.querySelectorAll('#tkr-logo-select button').forEach(b => b.style.borderColor = '#2a2a36');
        btn.style.borderColor = '#6af';
        tickerLogoUrl = f.url;
        enviarPreviewTicker();
      });
      container.appendChild(btn);
    }
  } catch (_) { /* ignore */ }
}

document.querySelector('[data-tab="ticker"]')?.addEventListener('click', () => {
  setTimeout(cargarTkrLogos, 100);
});

// ─── SPONSORS ─────────────────────────────────────────────

let sponsorsList = [];

function leerSponsorsCfg() {
  return {
    barText: document.getElementById('spBarText').value || 'PATROCINADO POR',
    barColor: document.getElementById('spBarColor').value || '#e53935',
    barTextColor: document.getElementById('spBarTextColor').value || '#ffffff',
    barHeight: parseInt(document.getElementById('spBarHeight').value, 10) || 44,
    bgGradientTop: document.getElementById('spBgTop').value || '#3a3a3a',
    bgGradientBottom: document.getElementById('spBgBottom').value || '#555555',
    rotationSpeed: parseInt(document.getElementById('spRotationSpeed').value, 10) || 5000,
    fontFamily: document.getElementById('spFont').value || 'Inter, sans-serif'
  };
}

function enviarPreviewSponsors() {
  const iframe = document.querySelector('[data-tab-content="sponsors"] .preview-iframe');
  if (!iframe || !iframe.contentWindow) return;
  const items = document.querySelectorAll('.sponsor-item');
  const sponsors = [];
  items.forEach(item => {
    const name = item.querySelector('.sp-name').value.trim();
    const logoUrl = item.querySelector('.sp-logo-url').value.trim() || null;
    if (name || logoUrl) sponsors.push({ name, logoUrl });
  });
  sponsorsList = sponsors;
  iframe.contentWindow.postMessage({
    tipo: 'PREVIEW_SPONSORS',
    data: { sponsors, config: leerSponsorsCfg() }
  }, '*');
}

function sponsorsEmit(accion) {
  const items = document.querySelectorAll('.sponsor-item');
  const sponsors = [];
  items.forEach(item => {
    const name = item.querySelector('.sp-name').value.trim();
    const logoUrl = item.querySelector('.sp-logo-url').value.trim() || null;
    if (name || logoUrl) sponsors.push({ name, logoUrl });
  });
  sponsorsList = sponsors;
  socket.emit('update-graphic', {
    tipo: 'SPONSORS',
    data: { accion, sponsors, config: leerSponsorsCfg() }
  });
}

let spPickerTarget = null;

function sponsorsMostrarLogosPicker(btn) {
  const item = btn.closest('.sponsor-item');
  spPickerTarget = item.querySelector('.sp-logo-url');
  let popup = document.getElementById('sp-logo-picker');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'sp-logo-picker';
    popup.style.cssText = 'position:fixed;z-index:999;background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:0.5rem;max-height:200px;overflow-y:auto;display:flex;flex-wrap:wrap;gap:0.4rem;width:260px;box-shadow:0 8px 24px rgba(0,0,0,0.4);';
    document.body.appendChild(popup);
    popup.addEventListener('click', (e) => {
      const pickBtn = e.target.closest('[data-pick-url]');
      if (!pickBtn) return;
      if (spPickerTarget) spPickerTarget.value = pickBtn.dataset.pickUrl;
      popup.style.display = 'none';
      enviarPreviewSponsors();
    });
    document.addEventListener('click', (e) => {
      if (!popup.contains(e.target) && !e.target.closest('.sp-pick-logo')) {
        popup.style.display = 'none';
      }
    });
  }
  const rect = btn.getBoundingClientRect();
  popup.style.top = (rect.bottom + 4) + 'px';
  popup.style.left = Math.max(4, rect.left) + 'px';
  popup.style.display = 'flex';
  popup.innerHTML = '<div style="width:100%;font-size:0.7rem;color:var(--text-muted);margin-bottom:0.3rem;">Seleccionar logo:</div>';
  fetch('/api/media').then(r => r.json()).then(files => {
    if (!files.length) {
      popup.innerHTML += '<div style="font-size:0.7rem;color:var(--text-muted);width:100%;">Sube logos en la pestaña Media</div>';
      return;
    }
    const btnNinguno = document.createElement('button');
    btnNinguno.textContent = 'Sin logo';
    btnNinguno.style.cssText = 'font-size:0.7rem;padding:2px 6px;border-radius:4px;border:1px solid var(--border);background:var(--btn-bg);color:var(--text);cursor:pointer;';
    btnNinguno.dataset.pickUrl = '';
    popup.appendChild(btnNinguno);
    files.forEach(f => {
      const b = document.createElement('button');
      b.style.cssText = 'width:48px;height:36px;border-radius:4px;border:1px solid var(--border);background:var(--input-bg);cursor:pointer;overflow:hidden;padding:0;';
      b.innerHTML = `<img src="${f.url}" style="width:100%;height:100%;object-fit:contain;">`;
      b.dataset.pickUrl = f.url;
      b.title = f.name;
      popup.appendChild(b);
    });
  }).catch(() => {});
}

function sponsorsAddItem() {
  const list = document.getElementById('sponsor-list');
  const item = document.createElement('div');
  item.className = 'sponsor-item';
  item.style.cssText = 'display:flex;gap:0.3rem;align-items:center;width:100%;';
  item.innerHTML = `
    <input type="text" class="sp-name" placeholder="Nombre" style="flex:1;min-width:80px;font-size:0.8rem;">
    <input type="text" class="sp-logo-url" placeholder="URL logo (opcional)" style="flex:1.5;min-width:100px;font-size:0.8rem;">
    <button class="sp-pick-logo small" title="Seleccionar de Media" style="padding:0.3rem 0.4rem;font-size:0.8rem;">📁</button>
    <button class="sp-remove small danger" style="padding:0.3rem 0.4rem;font-size:0.8rem;">×</button>
  `;
  const nameInput = item.querySelector('.sp-name');
  const logoInput = item.querySelector('.sp-logo-url');
  nameInput.addEventListener('input', enviarPreviewSponsors);
  logoInput.addEventListener('input', enviarPreviewSponsors);
  item.querySelector('.sp-pick-logo').addEventListener('click', function() {
    sponsorsMostrarLogosPicker(this);
  });
  item.querySelector('.sp-remove').addEventListener('click', () => {
    item.remove();
    enviarPreviewSponsors();
  });
  list.appendChild(item);
  // Focus the name input
  setTimeout(() => nameInput.focus(), 50);
  enviarPreviewSponsors();
}

// Init sponsors tab: add 3 default items if empty
(function initSponsors() {
  const list = document.getElementById('sponsor-list');
  if (!list) return;
  // Add 3 default sponsors
  for (let i = 1; i <= 3; i++) {
    const item = document.createElement('div');
    item.className = 'sponsor-item';
    item.style.cssText = 'display:flex;gap:0.3rem;align-items:center;width:100%;';
    item.innerHTML = `
      <input type="text" class="sp-name" placeholder="Nombre" value="Sponsor ${String.fromCharCode(64 + i)}" style="flex:1;min-width:80px;font-size:0.8rem;">
      <input type="text" class="sp-logo-url" placeholder="URL logo (opcional)" style="flex:1.5;min-width:100px;font-size:0.8rem;">
      <button class="sp-pick-logo small" title="Seleccionar de Media" style="padding:0.3rem 0.4rem;font-size:0.8rem;">📁</button>
      <button class="sp-remove small danger" style="padding:0.3rem 0.4rem;font-size:0.8rem;">×</button>
    `;
    item.querySelector('.sp-name').addEventListener('input', enviarPreviewSponsors);
    item.querySelector('.sp-logo-url').addEventListener('input', enviarPreviewSponsors);
    item.querySelector('.sp-pick-logo').addEventListener('click', function() {
      sponsorsMostrarLogosPicker(this);
    });
    item.querySelector('.sp-remove').addEventListener('click', () => {
      item.remove();
      enviarPreviewSponsors();
    });
    list.appendChild(item);
  }
  setTimeout(enviarPreviewSponsors, 500);
})();

document.getElementById('sponsor-add')?.addEventListener('click', sponsorsAddItem);

// Toggle show/hide for sponsors
document.getElementById('sponsorToggle').addEventListener('change', function() {
  this.checked ? sponsorsEmit('SHOW') : sponsorsEmit('HIDE');
  document.getElementById('sponsorToggleLabel').textContent = this.checked ? 'Encendido' : 'Apagado';
});

// Font dropdown for sponsors
document.getElementById('spFontDropdownBtn')?.addEventListener('click', () => {
  const input = document.getElementById('spFont');
  const prev = input.value;
  input.value = '';
  input.showPicker();
  requestAnimationFrame(() => {
    input.addEventListener('blur', function restore() {
      if (!input.value) input.value = prev;
      input.removeEventListener('blur', restore);
    }, { once: true });
  });
});

// ── Sponsor Guest Slots (1-10 presets) ──

const SPONSOR_GUEST_KEY = 'sponsor_guests';
function cargarSpInvitados() {
  try { return JSON.parse(localStorage.getItem(SPONSOR_GUEST_KEY)) || {}; } catch { return {}; }
}
function guardarSpInvitados(data) {
  localStorage.setItem(SPONSOR_GUEST_KEY, JSON.stringify(data));
}

function sponsorsLeerSlots() {
  const items = document.querySelectorAll('.sponsor-item');
  const sponsors = [];
  items.forEach(item => {
    const name = item.querySelector('.sp-name').value.trim();
    const logoUrl = item.querySelector('.sp-logo-url').value.trim() || null;
    if (name || logoUrl) sponsors.push({ name, logoUrl });
  });
  return {
    sponsors,
    config: leerSponsorsCfg()
  };
}

function sponsorsCargarSlot(data) {
  if (!data) return;
  if (data.sponsors) {
    // Clear existing items
    const list = document.getElementById('sponsor-list');
    list.innerHTML = '';
    data.sponsors.forEach(sp => {
      const item = document.createElement('div');
      item.className = 'sponsor-item';
      item.style.cssText = 'display:flex;gap:0.3rem;align-items:center;width:100%;';
      item.innerHTML = `
        <input type="text" class="sp-name" placeholder="Nombre" value="${(sp.name || '').replace(/"/g, '&quot;')}" style="flex:1;min-width:80px;font-size:0.8rem;">
        <input type="text" class="sp-logo-url" placeholder="URL logo (opcional)" value="${(sp.logoUrl || '').replace(/"/g, '&quot;')}" style="flex:1.5;min-width:100px;font-size:0.8rem;">
        <button class="sp-pick-logo small" title="Seleccionar de Media" style="padding:0.3rem 0.4rem;font-size:0.8rem;">📁</button>
        <button class="sp-remove small danger" style="padding:0.3rem 0.4rem;font-size:0.8rem;">×</button>
      `;
      item.querySelector('.sp-name').addEventListener('input', enviarPreviewSponsors);
      item.querySelector('.sp-logo-url').addEventListener('input', enviarPreviewSponsors);
      item.querySelector('.sp-pick-logo').addEventListener('click', function() {
        sponsorsMostrarLogosPicker(this);
      });
      item.querySelector('.sp-remove').addEventListener('click', () => {
        item.remove();
        enviarPreviewSponsors();
      });
      list.appendChild(item);
    });
  }
  if (data.config) {
    if (data.config.barText) document.getElementById('spBarText').value = data.config.barText;
    if (data.config.barColor) document.getElementById('spBarColor').value = data.config.barColor;
    if (data.config.barTextColor) document.getElementById('spBarTextColor').value = data.config.barTextColor;
    if (data.config.barHeight) document.getElementById('spBarHeight').value = data.config.barHeight;
    if (data.config.bgGradientTop) document.getElementById('spBgTop').value = data.config.bgGradientTop;
    if (data.config.bgGradientBottom) document.getElementById('spBgBottom').value = data.config.bgGradientBottom;
    if (data.config.rotationSpeed) document.getElementById('spRotationSpeed').value = data.config.rotationSpeed;
    if (data.config.fontFamily) document.getElementById('spFont').value = data.config.fontFamily;
    // Update val displays
    document.getElementById('valSpBarHeight').textContent = document.getElementById('spBarHeight').value + 'px';
    document.getElementById('valSpRotationSpeed').textContent = (parseInt(document.getElementById('spRotationSpeed').value,10)/1000).toFixed(1) + 's';
  }
  enviarPreviewSponsors();
}

const spInvitados = cargarSpInvitados();
let spActiveSlot = null;

const spGuestGrid = document.getElementById('sponsor-guest-grid');
if (spGuestGrid) {
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.className = 'guest-btn' + (spInvitados[i] ? ' filled' : '');
    btn.dataset.slot = i;
    btn.textContent = i;
    btn.title = spInvitados[i]
      ? `${spInvitados[i].sponsors?.[0]?.name || 'Config #' + i}`
      : 'Slot vacío — clic der. para guardar';

    btn.addEventListener('click', (e) => {
      if (e.shiftKey) {
        delete spInvitados[i];
        guardarSpInvitados(spInvitados);
        btn.classList.remove('filled');
        btn.title = 'Slot vacío — clic der. para guardar';
        if (spActiveSlot === i) spActiveSlot = null;
        document.querySelectorAll('#sponsor-guest-grid .guest-btn').forEach(b => b.classList.remove('active-slot'));
        return;
      }
      const data = spInvitados[i];
      if (!data) return;
      sponsorsCargarSlot(data);
      document.querySelectorAll('#sponsor-guest-grid .guest-btn').forEach(b => b.classList.remove('active-slot'));
      btn.classList.add('active-slot');
      spActiveSlot = i;
    });

    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const data = sponsorsLeerSlots();
      if (!data.sponsors.length) return;
      spInvitados[i] = data;
      guardarSpInvitados(spInvitados);
      btn.classList.add('filled');
      btn.title = data.sponsors[0]?.name || 'Config #' + i;
      document.querySelectorAll('#sponsor-guest-grid .guest-btn').forEach(b => b.classList.remove('active-slot'));
      btn.classList.add('active-slot');
      spActiveSlot = i;
      enviarPreviewSponsors();
    });

    spGuestGrid.appendChild(btn);
  }
  if (spInvitados[1]) sponsorsCargarSlot(spInvitados[1]);
}

// Style controls → auto-preview
for (const id of ['spBarText', 'spBarColor', 'spBarTextColor', 'spBgTop', 'spBgBottom', 'spFont']) {
  document.getElementById(id)?.addEventListener('input', enviarPreviewSponsors);
}
for (const id of ['spBarHeight', 'spRotationSpeed']) {
  const el = document.getElementById(id);
  if (!el) continue;
  el.addEventListener('input', () => {
    const val = document.getElementById('valSp' + id.slice(2));
    if (val) val.textContent = id === 'spRotationSpeed' ? (parseInt(el.value,10)/1000).toFixed(1) + 's' : el.value + 'px';
    enviarPreviewSponsors();
  });
}
// Init val displays
['spBarHeight', 'spRotationSpeed'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  const val = document.getElementById('valSp' + id.slice(2));
  if (val) val.textContent = id === 'spRotationSpeed' ? (parseInt(el.value,10)/1000).toFixed(1) + 's' : el.value + 'px';
});

// Sponsors reset style
document.getElementById('spResetStyle')?.addEventListener('click', () => {
  document.getElementById('spBarText').value = 'PATROCINADO POR';
  document.getElementById('spBarColor').value = '#e53935';
  document.getElementById('spBarTextColor').value = '#ffffff';
  document.getElementById('spBarHeight').value = '44';
  document.getElementById('spBgTop').value = '#3a3a3a';
  document.getElementById('spBgBottom').value = '#555555';
  document.getElementById('spRotationSpeed').value = '5000';
  document.getElementById('spFont').value = 'Inter, sans-serif';
  document.getElementById('valSpBarHeight').textContent = '44px';
  document.getElementById('valSpRotationSpeed').textContent = '5.0s';
  enviarPreviewSponsors();
});

document.querySelectorAll('.url-row').forEach(row => {
  const url = window.location.origin + row.dataset.path;
  row.innerHTML = `
    <code class="url-text">${url}</code>
    <button class="url-copy" data-url="${url}" title="Copiar URL">📋</button>
  `;
});

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.url-copy');
  if (!btn) return;
  try { navigator.clipboard.writeText(btn.dataset.url); } catch {
    const ta = document.createElement('textarea');
    ta.value = btn.dataset.url;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  // Visual feedback
  const origText = btn.textContent;
  btn.textContent = '✓';
  btn.classList.add('copied');
  setTimeout(() => {
    btn.textContent = origText;
    btn.classList.remove('copied');
  }, 1500);
});

const GUEST_KEY = 'lower_guests';
function cargarInvitados() {
  try { return JSON.parse(localStorage.getItem(GUEST_KEY)) || {}; } catch { return {}; }
}
function guardarInvitados(data) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(data));
}

const guestGrid = document.getElementById('guest-grid');
const invitados = cargarInvitados();
let activeSlot = null;

function marcarActivo(slot) {
  document.querySelectorAll('.guest-btn').forEach(b => b.classList.remove('active-slot'));
  if (slot !== null) {
    const btn = document.querySelector(`.guest-btn[data-slot="${slot}"]`);
    if (btn) btn.classList.add('active-slot');
  }
  activeSlot = slot;
}

function cargarSlot(slot) {
  const data = invitados[slot];
  if (!data) return;
  document.getElementById('inputNombre').value = data.nombre || '';
  document.getElementById('inputApellido').value = data.apellido || '';
  document.getElementById('inputCargo').value = data.cargo || '';
  marcarActivo(slot);
  enviarPreview();
}

for (let i = 1; i <= 10; i++) {
  const btn = document.createElement('button');
  btn.className = 'guest-btn' + (invitados[i] ? ' filled' : '');
  btn.dataset.slot = i;
  btn.textContent = i;
  btn.title = invitados[i]
    ? `${invitados[i].nombre || ''} ${invitados[i].apellido || ''}`
    : 'Slot vacío — clic der. para guardar';

  btn.addEventListener('click', (e) => {
    if (e.shiftKey) {
      delete invitados[i];
      guardarInvitados(invitados);
      btn.classList.remove('filled');
      btn.title = 'Slot vacío — clic der. para guardar';
      if (activeSlot === i) marcarActivo(null);
      return;
    }
    cargarSlot(i);
  });

  btn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('inputNombre').value.trim();
    const apellido = document.getElementById('inputApellido').value.trim();
    const cargo = document.getElementById('inputCargo').value.trim();
    if (!nombre && !apellido && !cargo) return;
    invitados[i] = { nombre, apellido, cargo };
    guardarInvitados(invitados);
    btn.classList.add('filled');
    btn.title = `${nombre} ${apellido}`;
    marcarActivo(i);
    enviarPreview();
  });

  guestGrid.appendChild(btn);
}

if (invitados[1]) cargarSlot(1);

const TKR_GUEST_KEY = 'ticker_guests';
function cargarTkrInvitados() {
  try { return JSON.parse(localStorage.getItem(TKR_GUEST_KEY)) || {}; } catch { return {}; }
}
function guardarTkrInvitados(data) {
  localStorage.setItem(TKR_GUEST_KEY, JSON.stringify(data));
}

const tkrGuestGrid = document.getElementById('tkr-guest-grid');
const tkrInvitados = cargarTkrInvitados();
let tkrActiveSlot = null;

function tkrMarcarActivo(slot) {
  document.querySelectorAll('#tkr-guest-grid .guest-btn').forEach(b => b.classList.remove('active-slot'));
  if (slot !== null) {
    const btn = document.querySelector(`#tkr-guest-grid .guest-btn[data-slot="${slot}"]`);
    if (btn) btn.classList.add('active-slot');
  }
  tkrActiveSlot = slot;
}

function tkrCargarSlot(slot) {
  const data = tkrInvitados[slot];
  if (!data) return;
  document.getElementById('tkrTitle').value = data.title || '';
  document.getElementById('tkrMessage').value = data.message || '';
  tickerLogoUrl = data.logoUrl || null;
  if (data.speed) document.getElementById('tkrSpeed').value = data.speed;
  if (data.logoWidth) document.getElementById('tkrLogoWidth').value = data.logoWidth;
  if (data.fontSize) document.getElementById('tkrFontSize').value = data.fontSize;
  if (data.fontFamily) document.getElementById('tkrFont').value = data.fontFamily;
  if (data.titleSize) document.getElementById('tkrTitleSize').value = data.titleSize;
  if (data.titleColor) document.getElementById('tkrTitleColor').value = data.titleColor;
  if (data.titleBg) document.getElementById('tkrTitleBg').value = data.titleBg;
  if (data.msgColor) document.getElementById('tkrMsgColor').value = data.msgColor;
  if (data.msgBg) document.getElementById('tkrMsgBg').value = data.msgBg;
  actualizarValoresTkr();
  tkrMarcarActivo(slot);
  cargarTkrLogos();
  enviarPreviewTicker();
}

for (let i = 1; i <= 10; i++) {
  const btn = document.createElement('button');
  btn.className = 'guest-btn' + (tkrInvitados[i] ? ' filled' : '');
  btn.dataset.slot = i;
  btn.textContent = i;
  btn.title = tkrInvitados[i]
    ? `${tkrInvitados[i].title || ''}`
    : 'Slot vacío — clic der. para guardar';

  btn.addEventListener('click', (e) => {
    if (e.shiftKey) {
      delete tkrInvitados[i];
      guardarTkrInvitados(tkrInvitados);
      btn.classList.remove('filled');
      btn.title = 'Slot vacío — clic der. para guardar';
      if (tkrActiveSlot === i) tkrMarcarActivo(null);
      return;
    }
    tkrCargarSlot(i);
  });

  btn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const title = document.getElementById('tkrTitle').value.trim();
    const message = document.getElementById('tkrMessage').value.trim();
    if (!title && !message) return;
    tkrInvitados[i] = {
      title,
      message,
      logoUrl: tickerLogoUrl,
      speed: parseFloat(document.getElementById('tkrSpeed').value) || 80,
      logoWidth: parseFloat(document.getElementById('tkrLogoWidth').value) || 4,
      fontSize: parseFloat(document.getElementById('tkrFontSize').value) || 33,
      fontFamily: document.getElementById('tkrFont').value || 'Inter, sans-serif',
      titleSize: parseInt(document.getElementById('tkrTitleSize').value, 10) || 44,
      titleColor: document.getElementById('tkrTitleColor').value || '#ffffff',
      titleBg: document.getElementById('tkrTitleBg').value || '#071041',
      msgColor: document.getElementById('tkrMsgColor').value || '#111111',
      msgBg: document.getElementById('tkrMsgBg').value || '#ffffff'
    };
    guardarTkrInvitados(tkrInvitados);
    btn.classList.add('filled');
    btn.title = title || '(sin título)';
    tkrMarcarActivo(i);
    enviarPreviewTicker();
  });

  tkrGuestGrid.appendChild(btn);
}

if (tkrInvitados[1]) tkrCargarSlot(1);

function obtenerEstilo() {
  return {
    fontFamily: document.getElementById('inputFont').value || 'Montserrat, sans-serif',
    titleFontSize: document.getElementById('inputTitleSize').value + 'rem',
    subtitleFontSize: document.getElementById('inputSubtitleSize').value + 'rem',
    titleColor: document.getElementById('inputTitleColor').value,
    titleBg: document.getElementById('inputTitleBg').value,
    subtitleColor: document.getElementById('inputSubtitleColor').value,
    subtitleBg: document.getElementById('inputSubtitleBg').value,
    escala: parseFloat(document.getElementById('inputScale').value),
    posX: parseInt(document.getElementById('inputPosX').value, 10),
    posY: parseInt(document.getElementById('inputPosY').value, 10)
  };
}

function enviarPreview() {
  const iframe = document.querySelector('[data-tab-content="lower"] .preview-iframe');
  if (!iframe || !iframe.contentWindow) return;
  iframe.contentWindow.postMessage({
    tipo: 'PREVIEW_LOWER',
    data: {
      nombre: document.getElementById('inputNombre').value,
      apellido: document.getElementById('inputApellido').value,
      cargo: document.getElementById('inputCargo').value,
      estilo: obtenerEstilo()
    }
  }, '*');
}

function enviarTercio(estadoAnimacion) {
  socket.emit('update-graphic', {
    tipo: 'LOWER_THIRD',
    data: {
      accion: estadoAnimacion,
      nombre: document.getElementById('inputNombre').value,
      apellido: document.getElementById('inputApellido').value,
      cargo: document.getElementById('inputCargo').value,
      estilo: obtenerEstilo()
    }
  });
}

// ─── COMBO TAB ───────────────────────────────────────────────

function comboLeerLowerDual() {
  const cfg = leerDualCfg();
  return {
    accion: 'SHOW',
    left: cfg.left,
    right: cfg.right
  };
}

function comboLeerSponsors() {
  const items = document.querySelectorAll('.sponsor-item');
  const sponsors = [];
  items.forEach(item => {
    const name = item.querySelector('.sp-name').value.trim();
    const logoUrl = item.querySelector('.sp-logo-url').value.trim() || null;
    if (name || logoUrl) sponsors.push({ name, logoUrl });
  });
  return {
    accion: 'SHOW',
    sponsors,
    config: leerSponsorsCfg()
  };
}

function comboLeerTicker() {
  const cfg = leerTkrCfg();
  cfg.accion = 'SHOW';
  return cfg;
}

function comboEmit(accion) {
  if (accion === 'SHOW') {
    // Sync all three tab toggles so UI stays coherent
    const bt = document.getElementById('dualBothToggle');
    if (bt && !bt.checked) { bt.checked = true; bt.dispatchEvent(new Event('change')); }
    const st = document.getElementById('sponsorToggle');
    if (st && !st.checked) { st.checked = true; st.dispatchEvent(new Event('change')); }
    const tt = document.getElementById('tkrToggle');
    if (tt && !tt.checked) { tt.checked = true; tt.dispatchEvent(new Event('change')); }
  } else {
    const bt = document.getElementById('dualBothToggle');
    if (bt && bt.checked) { bt.checked = false; bt.dispatchEvent(new Event('change')); }
    const st = document.getElementById('sponsorToggle');
    if (st && st.checked) { st.checked = false; st.dispatchEvent(new Event('change')); }
    const tt = document.getElementById('tkrToggle');
    if (tt && tt.checked) { tt.checked = false; tt.dispatchEvent(new Event('change')); }
  }
}

document.getElementById('comboToggle').addEventListener('change', function() {
  const label = document.getElementById('comboToggleLabel');
  if (this.checked) {
    label.textContent = 'Encendido';
    comboEmit('SHOW');
  } else {
    label.textContent = 'Apagado';
    comboEmit('HIDE');
  }
});

/* ═══════════════════════════════════════════
   WEATHER
   ═══════════════════════════════════════════ */

function leerWeatherCfg() {
  return {
    city: document.getElementById('weatherCity').value || 'Lima',
    country: document.getElementById('weatherCountry').value || '',
    refreshInterval: parseInt(document.getElementById('weatherRefresh').value, 10) * 1000,
    estilo: {
      fontFamily: document.getElementById('weatherFont').value || 'Inter, sans-serif',
      textColor: document.getElementById('weatherTextColor').value,
      countryColor: document.getElementById('weatherCountryColor').value,
      bgColor: hexToRgba(document.getElementById('weatherBgColor').value, parseFloat(document.getElementById('weatherOpacity').value) || 0.65),
      opacity: parseFloat(document.getElementById('weatherOpacity').value) || 0.65,
      posX: parseInt(document.getElementById('weatherPosX').value, 10) || 32,
      posY: parseInt(document.getElementById('weatherPosY').value, 10) || 32,
      fontSizeCountry: document.getElementById('weatherSizeCountry').value + 'rem',
      fontSizeCity: document.getElementById('weatherSizeCity').value + 'rem',
      fontSizeTemp: document.getElementById('weatherSizeTemp').value + 'rem',
      showIcon: document.getElementById('weatherShowIcon').checked,
      showCountry: document.getElementById('weatherShowCountry').checked,
    }
  };
}

function actualizarValoresWeather() {
  document.getElementById('valWeatherRefresh').textContent = (parseInt(document.getElementById('weatherRefresh').value,10)/60).toFixed(0) + ' min';
  document.getElementById('valWeatherOpacity').textContent = document.getElementById('weatherOpacity').value;
  document.getElementById('valWeatherPosX').textContent = document.getElementById('weatherPosX').value + 'px';
  document.getElementById('valWeatherPosY').textContent = document.getElementById('weatherPosY').value + 'px';
  document.getElementById('valWeatherSizeCountry').textContent = document.getElementById('weatherSizeCountry').value + 'rem';
  document.getElementById('valWeatherSizeCity').textContent = document.getElementById('weatherSizeCity').value + 'rem';
  document.getElementById('valWeatherSizeTemp').textContent = document.getElementById('weatherSizeTemp').value + 'rem';
}

function enviarPreviewWeather() {
  const iframe = document.querySelector('[data-tab-content="weather"] .preview-iframe');
  if (!iframe || !iframe.contentWindow) return;
  iframe.contentWindow.postMessage({ tipo: 'PREVIEW_WEATHER', data: leerWeatherCfg() }, '*');
}

function weatherEmit(accion) {
  const cfg = leerWeatherCfg();
  cfg.accion = accion;
  socket.emit('update-graphic', { tipo: 'WEATHER', data: cfg });
}

// Weather toggle
document.getElementById('weatherToggle').addEventListener('change', function() {
  this.checked ? weatherEmit('SHOW') : weatherEmit('HIDE');
  document.getElementById('weatherToggleLabel').textContent = this.checked ? 'Encendido' : 'Apagado';
});

// Weather range/input listeners
['weatherCity','weatherCountry'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', enviarPreviewWeather);
});
['weatherRefresh','weatherOpacity','weatherPosX','weatherPosY','weatherSizeCountry','weatherSizeCity','weatherSizeTemp'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => { actualizarValoresWeather(); enviarPreviewWeather(); });
});
['weatherTextColor','weatherCountryColor','weatherBgColor','weatherFont','weatherShowIcon','weatherShowCountry'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', enviarPreviewWeather);
});
document.getElementById('weatherShowIcon')?.addEventListener('change', enviarPreviewWeather);
document.getElementById('weatherShowCountry')?.addEventListener('change', enviarPreviewWeather);

// Weather font dropdown
document.getElementById('weatherFontDropdownBtn')?.addEventListener('click', () => {
  const input = document.getElementById('weatherFont');
  const prev = input.value;
  input.value = '';
  input.showPicker();
  requestAnimationFrame(() => {
    input.addEventListener('blur', function restore() {
      if (!input.value) input.value = prev;
      input.removeEventListener('blur', restore);
    }, { once: true });
  });
});

// Weather reset style
document.getElementById('weatherResetStyle')?.addEventListener('click', () => {
  document.getElementById('weatherFont').value = 'Inter, sans-serif';
  document.getElementById('weatherTextColor').value = '#ffffff';
  document.getElementById('weatherCountryColor').value = '#8ab4f8';
  document.getElementById('weatherBgColor').value = '#000000';
  document.getElementById('weatherOpacity').value = '0.65';
  document.getElementById('weatherPosX').value = '32';
  document.getElementById('weatherPosY').value = '32';
  document.getElementById('weatherSizeCountry').value = '0.7';
  document.getElementById('weatherSizeCity').value = '1.2';
  document.getElementById('weatherSizeTemp').value = '1.8';
  document.getElementById('weatherShowIcon').checked = true;
  document.getElementById('weatherShowCountry').checked = true;
  actualizarValoresWeather();
  enviarPreviewWeather();
});

actualizarValoresWeather();
setTimeout(enviarPreviewWeather, 500);

/* ═══════════════════════════════════════════
   COUNTDOWN
   ═══════════════════════════════════════════ */

function leerCountdownCfg() {
  return {
    target: parseInt(document.getElementById('cdDuration').value, 10) || 3600,
    label: document.getElementById('cdLabel').value || '',
    mode: document.getElementById('cdMode').value || 'countdown',
    estilo: {
      fontFamily: document.getElementById('cdFont').value || 'Inter, sans-serif',
      labelSize: document.getElementById('cdLabelSize').value + 'rem',
      labelColor: document.getElementById('cdLabelColor').value,
      displaySize: document.getElementById('cdDisplaySize').value + 'rem',
      displayColor: document.getElementById('cdDisplayColor').value,
      displayFont: 'Bebas Neue, Inter, sans-serif',
      bgColor: hexToRgba(document.getElementById('cdBgColor').value, parseFloat(document.getElementById('cdOpacity').value) || 0.6),
      opacity: parseFloat(document.getElementById('cdOpacity').value) || 0.6,
      posX: parseInt(document.getElementById('cdPosX').value, 10) || 32,
      posY: parseInt(document.getElementById('cdPosY').value, 10) || 96,
    }
  };
}

function actualizarValoresCD() {
  document.getElementById('valCdOpacity').textContent = document.getElementById('cdOpacity').value;
  document.getElementById('valCdLabelSize').textContent = document.getElementById('cdLabelSize').value + 'rem';
  document.getElementById('valCdDisplaySize').textContent = document.getElementById('cdDisplaySize').value + 'rem';
  document.getElementById('valCdPosX').textContent = document.getElementById('cdPosX').value + 'px';
  document.getElementById('valCdPosY').textContent = document.getElementById('cdPosY').value + 'px';
}

function enviarPreviewCountdown() {
  const iframe = document.querySelector('[data-tab-content="countdown"] .preview-iframe');
  if (!iframe || !iframe.contentWindow) return;
  iframe.contentWindow.postMessage({ tipo: 'PREVIEW_COUNTDOWN', data: leerCountdownCfg() }, '*');
}

function countdownEmit(accion) {
  const cfg = leerCountdownCfg();
  cfg.accion = accion;
  socket.emit('update-graphic', { tipo: 'COUNTDOWN', data: cfg });
}

// Countdown toggle
document.getElementById('countdownToggle').addEventListener('change', function() {
  this.checked ? countdownEmit('SHOW') : countdownEmit('HIDE');
  document.getElementById('countdownToggleLabel').textContent = this.checked ? 'Encendido' : 'Apagado';
});

// Countdown range/input listeners
['cdDuration','cdLabel','cdMode'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', enviarPreviewCountdown);
});
document.getElementById('cdMode')?.addEventListener('change', enviarPreviewCountdown);
['cdOpacity','cdLabelSize','cdDisplaySize','cdPosX','cdPosY'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => { actualizarValoresCD(); enviarPreviewCountdown(); });
});
['cdLabelColor','cdDisplayColor','cdBgColor','cdFont'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', enviarPreviewCountdown);
});

// Countdown font dropdown
document.getElementById('cdFontDropdownBtn')?.addEventListener('click', () => {
  const input = document.getElementById('cdFont');
  const prev = input.value;
  input.value = '';
  input.showPicker();
  requestAnimationFrame(() => {
    input.addEventListener('blur', function restore() {
      if (!input.value) input.value = prev;
      input.removeEventListener('blur', restore);
    }, { once: true });
  });
});

// Countdown reset
document.getElementById('cdReset')?.addEventListener('click', () => {
  countdownEmit('SHOW');
});

// Countdown reset style
document.getElementById('cdResetStyle')?.addEventListener('click', () => {
  document.getElementById('cdFont').value = 'Inter, sans-serif';
  document.getElementById('cdLabelSize').value = '0.6';
  document.getElementById('cdDisplaySize').value = '2.8';
  document.getElementById('cdLabelColor').value = '#aaaaaa';
  document.getElementById('cdDisplayColor').value = '#ffffff';
  document.getElementById('cdBgColor').value = '#000000';
  document.getElementById('cdOpacity').value = '0.6';
  document.getElementById('cdPosX').value = '32';
  document.getElementById('cdPosY').value = '96';
  actualizarValoresCD();
  enviarPreviewCountdown();
});

actualizarValoresCD();
setTimeout(enviarPreviewCountdown, 500);

/* ═══════════════════════════════════════════
   NOW PLAYING
   ═══════════════════════════════════════════ */

function leerNowPlayingCfg() {
  return {
    song: document.getElementById('npSong').value || '',
    artist: document.getElementById('npArtist').value || '',
    coverUrl: document.getElementById('npCoverUrl').value || null,
    estilo: {
      fontFamily: document.getElementById('npFont').value || 'Inter, sans-serif',
      barText: document.getElementById('npBarText').value || 'NOW PLAYING',
      barBg: document.getElementById('npBarBg').value,
      barColor: document.getElementById('npBarColor').value,
      songSize: document.getElementById('npSongSize').value + 'rem',
      songColor: document.getElementById('npSongColor').value,
      artistSize: document.getElementById('npArtistSize').value + 'rem',
      artistColor: document.getElementById('npArtistColor').value,
      bgColor: hexToRgba(document.getElementById('npBgColor').value, parseFloat(document.getElementById('npOpacity').value) || 0.65),
      opacity: parseFloat(document.getElementById('npOpacity').value) || 0.65,
      posX: parseInt(document.getElementById('npPosX').value, 10) || 32,
      posY: parseInt(document.getElementById('npPosY').value, 10) || 96,
    }
  };
}

function actualizarValoresNP() {
  document.getElementById('valNpOpacity').textContent = document.getElementById('npOpacity').value;
  document.getElementById('valNpSongSize').textContent = document.getElementById('npSongSize').value + 'rem';
  document.getElementById('valNpArtistSize').textContent = document.getElementById('npArtistSize').value + 'rem';
  document.getElementById('valNpPosX').textContent = document.getElementById('npPosX').value + 'px';
  document.getElementById('valNpPosY').textContent = document.getElementById('npPosY').value + 'px';
}

function enviarPreviewNowPlaying() {
  const iframe = document.querySelector('[data-tab-content="nowplaying"] .preview-iframe');
  if (!iframe || !iframe.contentWindow) return;
  iframe.contentWindow.postMessage({ tipo: 'PREVIEW_NOWPLAYING', data: leerNowPlayingCfg() }, '*');
}

function nowPlayingEmit(accion) {
  const cfg = leerNowPlayingCfg();
  cfg.accion = accion;
  socket.emit('update-graphic', { tipo: 'NOWPLAYING', data: cfg });
}

// Now Playing toggle
document.getElementById('nowplayingToggle').addEventListener('change', function() {
  this.checked ? nowPlayingEmit('SHOW') : nowPlayingEmit('HIDE');
  document.getElementById('nowplayingToggleLabel').textContent = this.checked ? 'Encendido' : 'Apagado';
});

// Now Playing input listeners
['npSong','npArtist','npCoverUrl','npBarText'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', enviarPreviewNowPlaying);
});
['npOpacity','npSongSize','npArtistSize','npPosX','npPosY'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => { actualizarValoresNP(); enviarPreviewNowPlaying(); });
});
['npBarBg','npBarColor','npSongColor','npArtistColor','npBgColor','npFont'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', enviarPreviewNowPlaying);
});

// Now Playing font dropdown
document.getElementById('npFontDropdownBtn')?.addEventListener('click', () => {
  const input = document.getElementById('npFont');
  const prev = input.value;
  input.value = '';
  input.showPicker();
  requestAnimationFrame(() => {
    input.addEventListener('blur', function restore() {
      if (!input.value) input.value = prev;
      input.removeEventListener('blur', restore);
    }, { once: true });
  });
});

// Now Playing reset style
document.getElementById('npResetStyle')?.addEventListener('click', () => {
  document.getElementById('npFont').value = 'Inter, sans-serif';
  document.getElementById('npBarText').value = 'NOW PLAYING';
  document.getElementById('npBarBg').value = '#1db954';
  document.getElementById('npBarColor').value = '#ffffff';
  document.getElementById('npSongSize').value = '1.0';
  document.getElementById('npArtistSize').value = '0.75';
  document.getElementById('npSongColor').value = '#ffffff';
  document.getElementById('npArtistColor').value = '#aaaaaa';
  document.getElementById('npBgColor').value = '#000000';
  document.getElementById('npOpacity').value = '0.65';
  document.getElementById('npPosX').value = '32';
  document.getElementById('npPosY').value = '96';
  actualizarValoresNP();
  enviarPreviewNowPlaying();
});

actualizarValoresNP();
setTimeout(enviarPreviewNowPlaying, 500);

// ─── QUICK PANEL SIDEBAR ─────────────────────────────────────

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
  qpResultadosToggle: 'resultadosToggle'
};

function qpSyncToggles() {
  for (const [qpId, tabId] of Object.entries(QP_MAP)) {
    const qp = document.getElementById(qpId);
    const tab = document.getElementById(tabId);
    if (qp && tab) qp.checked = tab.checked;
  }
}

// Sidebar toggle → proxy to tab toggle change event
for (const [qpId, tabId] of Object.entries(QP_MAP)) {
  document.getElementById(qpId)?.addEventListener('change', function() {
    const tab = document.getElementById(tabId);
    if (tab && tab.checked !== this.checked) {
      tab.checked = this.checked;
      tab.dispatchEvent(new Event('change'));
    }
  });
}

// Whenever ANY tab toggle changes (user click OR dispatchEvent), sync sidebar to match
const ALL_TAB_TOGGLES = ['scoreToggle','lowerToggle','dualLToggle','dualRToggle','sponsorToggle','tkrToggle','weatherToggle','countdownToggle','nowplayingToggle','comboToggle','resultadosToggle'];
document.addEventListener('change', (e) => {
  if (e.target && e.target.type === 'checkbox' && ALL_TAB_TOGGLES.includes(e.target.id)) {
    qpSyncToggles();
  }
});

// Sidebar text sync: Dual
['Nombre', 'Apellido', 'Cargo'].forEach(field => {
  document.getElementById('qpDual' + field)?.addEventListener('input', function() {
    const left = document.getElementById('dualL' + field);
    const right = document.getElementById('dualR' + field);
    if (left) left.value = this.value;
    if (right) right.value = this.value;
    enviarPreviewDual();
  });
});

// Sidebar text sync: Ticker message
document.getElementById('qpMensaje')?.addEventListener('input', function() {
  const tkrMsg = document.getElementById('tkrMessage');
  if (tkrMsg) { tkrMsg.value = this.value; enviarPreviewTicker(); }
});

// Guest slots (uses same key as dual left)
(function qpInitGuestSlots() {
  const grid = document.getElementById('qp-guest-grid');
  if (!grid) return;
  const invitados = cargarDualInvitados();
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.className = 'guest-btn' + (invitados[i] ? ' filled' : '');
    btn.dataset.slot = i;
    btn.textContent = i;
    btn.title = invitados[i]
      ? `${invitados[i].nombre || ''} ${invitados[i].apellido || ''}`
      : 'Slot vacío — clic der. para guardar';
    btn.addEventListener('click', () => {
      const data = invitados[i];
      if (!data) return;
      document.getElementById('qpDualNombre').value = data.nombre || '';
      document.getElementById('qpDualApellido').value = data.apellido || '';
      document.getElementById('qpDualCargo').value = data.cargo || '';
      // Also update tab fields
      ['Nombre', 'Apellido', 'Cargo'].forEach(f => {
        const el = document.getElementById('dualL' + f);
        if (el) el.value = data[f.toLowerCase()] || '';
        const el2 = document.getElementById('dualR' + f);
        if (el2) el2.value = data[f.toLowerCase()] || '';
      });
      document.querySelectorAll('#qp-guest-grid .guest-btn').forEach(b => b.classList.remove('active-slot'));
      btn.classList.add('active-slot');
      enviarPreviewDual();
    });
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const nombre = document.getElementById('qpDualNombre').value.trim();
      const apellido = document.getElementById('qpDualApellido').value.trim();
      const cargo = document.getElementById('qpDualCargo').value.trim();
      if (!nombre && !apellido && !cargo) return;
      const data = { nombre, apellido, cargo };
      const existing = cargarDualInvitados();
      existing[i] = data;
      guardarDualInvitados(existing);
      invitados[i] = data;
      btn.classList.add('filled');
      btn.title = `${nombre} ${apellido}`;
      document.querySelectorAll('#qp-guest-grid .guest-btn').forEach(b => b.classList.remove('active-slot'));
      btn.classList.add('active-slot');
      enviarPreviewDual();
    });
    grid.appendChild(btn);
  }
  // Load slot 1 on init if exists
  if (invitados[1]) {
    document.getElementById('qpDualNombre').value = invitados[1].nombre || '';
    document.getElementById('qpDualApellido').value = invitados[1].apellido || '';
    document.getElementById('qpDualCargo').value = invitados[1].cargo || '';
    ['Nombre', 'Apellido', 'Cargo'].forEach(f => {
      const el = document.getElementById('dualL' + f);
      if (el) el.value = invitados[1][f.toLowerCase()] || '';
      const el2 = document.getElementById('dualR' + f);
      if (el2) el2.value = invitados[1][f.toLowerCase()] || '';
    });
    const first = grid.querySelector('.guest-btn[data-slot="1"]');
    if (first) first.classList.add('active-slot');
    enviarPreviewDual();
  }
})();

// Show All / Hide All buttons
document.getElementById('qpShowAll')?.addEventListener('click', () => {
  const qp = document.getElementById('qpComboToggle');
  if (qp && !qp.checked) { qp.checked = true; qp.dispatchEvent(new Event('change')); }
});
document.getElementById('qpHideAll')?.addEventListener('click', () => {
  const qp = document.getElementById('qpComboToggle');
  if (qp && qp.checked) { qp.checked = false; qp.dispatchEvent(new Event('change')); }
});

// Initial sync
setTimeout(qpSyncToggles, 300);

// ─── RESULTADOS ────────────────────────────────────────────

let resFotoAUrl = null;
let resFotoBUrl = null;
let resLogoUrl = null;

function leerResultadosData() {
  return {
    candidateA: {
      name: document.getElementById('resNombreA').value,
      party: document.getElementById('resPartidoA').value,
      color: document.getElementById('resColorA').value,
      photo: resFotoAUrl,
      percent: parseFloat(document.getElementById('resPercentA').value) || 0,
      totalVotes: parseInt(document.getElementById('resVotosA').value, 10) || 0
    },
    candidateB: {
      name: document.getElementById('resNombreB').value,
      party: document.getElementById('resPartidoB').value,
      color: document.getElementById('resColorB').value,
      photo: resFotoBUrl,
      percent: parseFloat(document.getElementById('resPercentB').value) || 0,
      totalVotes: parseInt(document.getElementById('resVotosB').value, 10) || 0
    },
    center: {
      participation: parseFloat(document.getElementById('resParticipacion').value) || 0,
      topDepartment: document.getElementById('resTopDept').value,
      tendency: document.getElementById('resTendencia').value,
      difference: parseFloat(document.getElementById('resDiferencia').value) || 0
    },
    header: {
      logo: resLogoUrl,
      date: document.getElementById('resFecha').value,
      escrutinio: parseFloat(document.getElementById('resEscrutinio').value) || 0
    },
    ticker: {
      messages: document.getElementById('resTickerMsgs').value.split('\n').filter(l => l.trim())
    }
  };
}

function enviarPreviewResultados() {
  const data = leerResultadosData();
  const iframe = document.querySelector('[data-tab-content="resultados"] .preview-iframe');
  if (iframe?.contentWindow) {
    iframe.contentWindow.postMessage({ tipo: 'PREVIEW_RESULTADOS', data }, '*');
  }
  if (document.getElementById('resultadosToggle')?.checked) {
    socket.emit('update-graphic', {
      tipo: 'RESULTADOS',
      data: { accion: 'UPDATE', data }
    });
  }
}

function resultadosEmit(accion) {
  socket.emit('update-graphic', {
    tipo: 'RESULTADOS',
    data: { accion, data: leerResultadosData() }
  });
}

function getResCurrentUrl(setter) {
  if (setter === 'A') return resFotoAUrl;
  if (setter === 'B') return resFotoBUrl;
  return resLogoUrl;
}

function setResUrl(setter, url) {
  if (setter === 'A') resFotoAUrl = url;
  else if (setter === 'B') resFotoBUrl = url;
  else resLogoUrl = url;
}

async function cargarResPhotoPicker(containerId, setter) {
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    const res = await fetch('/api/media');
    const files = await res.json();
    container.innerHTML = '';
    const currentUrl = getResCurrentUrl(setter);
    const btnNinguno = document.createElement('button');
    btnNinguno.textContent = 'Ninguna';
    btnNinguno.style.cssText = 'font-size:0.65rem;padding:2px 5px;border-radius:4px;border:2px solid #2a2a36;background:#1a1a24;color:#888;cursor:pointer;';
    if (!currentUrl) btnNinguno.style.borderColor = '#6af';
    btnNinguno.addEventListener('click', () => {
      document.querySelectorAll(`#${containerId} button`).forEach(b => b.style.borderColor = '#2a2a36');
      btnNinguno.style.borderColor = '#6af';
      setResUrl(setter, null);
      enviarPreviewResultados();
    });
    container.appendChild(btnNinguno);
    for (const f of files) {
      const btn = document.createElement('button');
      btn.style.cssText = 'width:36px;height:28px;border-radius:4px;border:2px solid #2a2a36;background:#0f0f13;cursor:pointer;overflow:hidden;padding:0;';
      btn.innerHTML = `<img src="${f.url}" style="width:100%;height:100%;object-fit:contain;">`;
      btn.dataset.url = f.url;
      btn.title = f.name;
      if (currentUrl === f.url) btn.style.borderColor = '#6af';
      btn.addEventListener('click', () => {
        document.querySelectorAll(`#${containerId} button`).forEach(b => b.style.borderColor = '#2a2a36');
        btn.style.borderColor = '#6af';
        setResUrl(setter, f.url);
        enviarPreviewResultados();
      });
      container.appendChild(btn);
    }
  } catch (_) { /* ignore */ }
}

document.querySelector('[data-tab="resultados"]')?.addEventListener('click', () => {
  setTimeout(() => {
    cargarResPhotoPicker('res-fotoA-picker', 'A');
    cargarResPhotoPicker('res-fotoB-picker', 'B');
    cargarResPhotoPicker('res-logo-picker', 'logo');
    enviarPreviewResultados();
  }, 100);
});

document.getElementById('resultadosToggle')?.addEventListener('change', function() {
  const label = document.getElementById('resultadosToggleLabel');
  label.textContent = this.checked ? 'Encendido' : 'Apagado';
  this.checked ? resultadosEmit('SHOW') : resultadosEmit('HIDE');
});

for (const id of ['resNombreA', 'resPartidoA', 'resColorA', 'resPercentA', 'resVotosA', 'resNombreB', 'resPartidoB', 'resColorB', 'resPercentB', 'resVotosB', 'resParticipacion', 'resTopDept', 'resTendencia', 'resDiferencia', 'resFecha', 'resEscrutinio', 'resTickerMsgs']) {
  document.getElementById(id)?.addEventListener('input', enviarPreviewResultados);
}

setTimeout(enviarPreviewResultados, 500);

// ─── MEDIA / LOGOS ──────────────────────────────────────────

async function cargarMedia() {
  const grid = document.getElementById('media-grid');
  if (!grid) return;
  try {
    const res = await fetch('/api/media');
    const files = await res.json();
    grid.innerHTML = '';
    for (const f of files) {
      const card = document.createElement('div');
      card.className = 'media-card';
      card.innerHTML = `
        <img src="${f.url}" loading="lazy">
        <div class="name">${f.name}</div>
        <div class="actions">
          <button class="media-copy" data-url="${f.url}">Copiar URL</button>
          <button class="media-del" data-name="${f.name}">×</button>
        </div>
      `;
      grid.appendChild(card);
    }
  } catch (_) { /* ignore */ }
}

document.addEventListener('click', async (e) => {
  const copyBtn = e.target.closest('.media-copy');
  if (copyBtn) {
    const url = window.location.origin + copyBtn.dataset.url;
    try { await navigator.clipboard.writeText(url); } catch {}
    return;
  }
  const delBtn = e.target.closest('.media-del');
  if (delBtn) {
    try {
      await fetch('/api/media/' + encodeURIComponent(delBtn.dataset.name), { method: 'DELETE' });
      cargarMedia();
    } catch {}
  }
});

document.getElementById('media-upload-btn')?.addEventListener('click', () => {
  document.getElementById('media-file-input').click();
});

document.getElementById('media-file-input')?.addEventListener('change', async (e) => {
  const files = e.target.files;
  if (!files.length) return;
  for (const file of files) {
    const reader = new FileReader();
    const data = await new Promise(resolve => {
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    try {
      await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, data })
      });
    } catch (_) { /* ignore */ }
  }
  e.target.value = '';
  cargarMedia();
});

document.querySelector('[data-tab="media"]')?.addEventListener('click', () => {
  setTimeout(cargarMedia, 100);
});
