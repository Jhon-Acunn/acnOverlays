import { setVal, bindFontPicker } from './utils.js';
import { createGuestSlots } from './guest-slots.js';
import { emitGraphic, emitGraphicNow } from './socket.js';

const TIPO = 'TICKER';
const TAB = 'ticker';
const PREVIEW_TIPO = 'PREVIEW_TICKER';
const TOGGLE_ID = 'tkrToggle';

let tickerLogoUrl = null;

function leerTkrData() {
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
    msgBg: document.getElementById('tkrMsgBg').value || '#ffffff',
  };
}

function tickerUpdate() {
  emitGraphic({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData: leerTkrData,
    toggleId: TOGGLE_ID,
  });
}

function tickerEmit(accion) {
  emitGraphicNow({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData: leerTkrData,
    toggleId: TOGGLE_ID,
    accion,
  });
}

function actualizarValoresTkr() {
  setVal('valTkrSpeed', document.getElementById('tkrSpeed').value + 'px/s');
  setVal('valTkrLogoWidth', document.getElementById('tkrLogoWidth').value + '%');
  setVal('valTkrFontSize', document.getElementById('tkrFontSize').value + 'px');
  setVal('valTkrTitleSize', document.getElementById('tkrTitleSize').value + 'px');
}

async function cargarTkrLogos() {
  const container = document.getElementById('tkr-logo-select');
  if (!container) return;
  try {
    const res = await fetch('/api/media');
    const files = await res.json();
    container.innerHTML = '';
    const btnNinguno = document.createElement('button');
    btnNinguno.textContent = 'Ninguno';
    btnNinguno.style.cssText =
      'font-size:0.7rem;padding:2px 6px;border-radius:4px;border:2px solid #2a2a36;background:#1a1a24;color:#888;cursor:pointer;';
    btnNinguno.dataset.logo = '';
    btnNinguno.addEventListener('click', () => {
      container.querySelectorAll('button').forEach((b) => (b.style.borderColor = '#2a2a36'));
      btnNinguno.style.borderColor = '#6af';
      tickerLogoUrl = null;
      tickerUpdate();
    });
    btnNinguno.style.borderColor = tickerLogoUrl ? '#2a2a36' : '#6af';
    container.appendChild(btnNinguno);
    for (const f of files) {
      const btn = document.createElement('button');
      btn.style.cssText =
        'width:40px;height:32px;border-radius:4px;border:2px solid #2a2a36;background:#0f0f13;cursor:pointer;overflow:hidden;padding:0;';
      btn.innerHTML = `<img src="${f.url}" style="width:100%;height:100%;object-fit:contain;">`;
      btn.dataset.logo = f.url;
      btn.title = f.name;
      if (tickerLogoUrl === f.url) btn.style.borderColor = '#6af';
      btn.addEventListener('click', () => {
        container.querySelectorAll('button').forEach((b) => (b.style.borderColor = '#2a2a36'));
        btn.style.borderColor = '#6af';
        tickerLogoUrl = f.url;
        tickerUpdate();
      });
      container.appendChild(btn);
    }
  } catch {
    /* noop */
  }
}

export function initTicker() {
  document.getElementById('tkrToggle')?.addEventListener('change', function () {
    tickerEmit(this.checked ? 'SHOW' : 'HIDE');
  });
  for (const id of [
    'tkrTitle',
    'tkrMessage',
    'tkrSpeed',
    'tkrLogoWidth',
    'tkrFontSize',
    'tkrFont',
    'tkrTitleSize',
    'tkrTitleColor',
    'tkrTitleBg',
    'tkrMsgColor',
    'tkrMsgBg',
  ]) {
    document.getElementById(id)?.addEventListener('input', () => {
      actualizarValoresTkr();
      tickerUpdate();
    });
  }
  actualizarValoresTkr();
  setTimeout(() => {
    if (document.getElementById(TOGGLE_ID)?.checked) tickerUpdate();
  }, 500);
  bindFontPicker('tkrFontDropdownBtn', 'tkrFont');

  document.querySelector('[data-reset-tkr-title]')?.addEventListener('click', () => {
    document.getElementById('tkrTitleSize').value = 44;
    document.getElementById('tkrTitleColor').value = '#ffffff';
    document.getElementById('tkrTitleBg').value = '#071041';
    actualizarValoresTkr();
    tickerUpdate();
  });
  document.querySelector('[data-reset-tkr-msg]')?.addEventListener('click', () => {
    document.getElementById('tkrFontSize').value = 33;
    document.getElementById('tkrMsgColor').value = '#111111';
    document.getElementById('tkrMsgBg').value = '#ffffff';
    actualizarValoresTkr();
    tickerUpdate();
  });

  document.querySelector('[data-tab="ticker"]')?.addEventListener('click', () => {
    setTimeout(cargarTkrLogos, 100);
  });

  createGuestSlots({
    gridId: 'tkr-guest-grid',
    storageKey: 'ticker_guests',
    getCurrent: () => {
      const title = document.getElementById('tkrTitle').value.trim();
      const message = document.getElementById('tkrMessage').value.trim();
      if (!title && !message) return null;
      return {
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
        msgBg: document.getElementById('tkrMsgBg').value || '#ffffff',
      };
    },
    applyData: (d) => {
      document.getElementById('tkrTitle').value = d.title || '';
      document.getElementById('tkrMessage').value = d.message || '';
      tickerLogoUrl = d.logoUrl || null;
      if (d.speed) document.getElementById('tkrSpeed').value = d.speed;
      if (d.logoWidth) document.getElementById('tkrLogoWidth').value = d.logoWidth;
      if (d.fontSize) document.getElementById('tkrFontSize').value = d.fontSize;
      if (d.fontFamily) document.getElementById('tkrFont').value = d.fontFamily;
      if (d.titleSize) document.getElementById('tkrTitleSize').value = d.titleSize;
      if (d.titleColor) document.getElementById('tkrTitleColor').value = d.titleColor;
      if (d.titleBg) document.getElementById('tkrTitleBg').value = d.titleBg;
      if (d.msgColor) document.getElementById('tkrMsgColor').value = d.msgColor;
      if (d.msgBg) document.getElementById('tkrMsgBg').value = d.msgBg;
      actualizarValoresTkr();
      cargarTkrLogos();
    },
    formatTitle: (d) => d.title || '(sin título)',
    applyPreview: tickerUpdate,
  })?.loadInitial(1);
}
