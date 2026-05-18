import { io } from 'socket.io-client';

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

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`[data-tab-content="${tab.dataset.tab}"]`).classList.add('active');
    requestAnimationFrame(ajustarEscalas);
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

  socket.emit('update-graphic', {
    tipo: 'SCOREBOARD',
    data: {
      txtEquipoA: document.getElementById('nameA').value || 'EQUIPO A',
      puntosA: scoreA,
      txtEquipoB: document.getElementById('nameB').value || 'EQUIPO B',
      puntosB: scoreB
    }
  });
}

function resetearScore() {
  scoreA = 0;
  scoreB = 0;
  document.getElementById('displayA').innerText = '0';
  document.getElementById('displayB').innerText = '0';

  guardarScore();

  socket.emit('update-graphic', {
    tipo: 'SCOREBOARD',
    data: {
      txtEquipoA: document.getElementById('nameA').value || 'EQUIPO A',
      puntosA: 0,
      txtEquipoB: document.getElementById('nameB').value || 'EQUIPO B',
      puntosB: 0
    }
  });
}

function enviarScore() {
  socket.emit('update-graphic', {
    tipo: 'SCOREBOARD',
    data: {
      txtEquipoA: document.getElementById('nameA').value || 'EQUIPO A',
      puntosA: scoreA,
      txtEquipoB: document.getElementById('nameB').value || 'EQUIPO B',
      puntosB: scoreB
    }
  });
}
document.getElementById('nameA').addEventListener('input', enviarScore);
document.getElementById('nameB').addEventListener('input', enviarScore);

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

document.getElementById('fontDropdownBtn').addEventListener('click', () => {
  const input = document.getElementById('inputFont');
  const prev = input.value;
  input.value = '';
  input.showPicker();
  input.addEventListener('blur', function restore() {
    if (!input.value) input.value = prev;
    input.removeEventListener('blur', restore);
  }, { once: true });
});

document.querySelector('[data-reset-title]').addEventListener('click', () => {
  document.getElementById('inputTitleSize').value = '3.0';
  document.getElementById('inputTitleColor').value = '#ffffff';
  document.getElementById('inputTitleBg').value = '#06155A';
 document.getElementById('valTitleSize').textContent = '3.0rem';
  enviarPreview();
});
document.querySelector('[data-reset-sub]').addEventListener('click', () => {
  document.getElementById('inputSubtitleSize').value = '1.65';
  document.getElementById('inputSubtitleColor').value = '#111111';
  document.getElementById('inputSubtitleBg').value = '#ffffff';
 document.getElementById('valSubtitleSize').textContent = '1.65rem';
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

document.querySelectorAll('[data-sponsors]').forEach(btn => {
  btn.addEventListener('click', () => {
    const accion = btn.dataset.sponsors;
    socket.emit('update-graphic', { tipo: 'SPONSORS', data: { accion } });
  });
});

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
  input.addEventListener('blur', function restore() {
    if (!input.value) input.value = prev;
    input.removeEventListener('blur', restore);
  }, { once: true });
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

function mostrarSponsors() {
  socket.emit('update-graphic', {
    tipo: 'SPONSORS',
    data: { accion: 'SHOW' }
  });
}

function ocultarSponsors() {
  socket.emit('update-graphic', {
    tipo: 'SPONSORS',
    data: { accion: 'HIDE' }
  });
}

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
