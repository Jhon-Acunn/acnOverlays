import { setVal, bindFontPicker } from './utils.js';
import { createGuestSlots } from './guest-slots.js';
import { emitGraphic, emitGraphicNow } from './socket.js';
import { loadJSON, saveJSON, SERVER_SETTINGS_EVENT, isApplyingRemote } from './storage.js';

const TIPO = 'TICKER';
const TAB = 'ticker';
const PREVIEW_TIPO = 'PREVIEW_TICKER';
const TOGGLE_ID = 'tkrToggle';

let tkrSaveTimer;

function saveTkrSettings() {
  saveJSON('ticker_settings', {
    tkrTitle: document.getElementById('tkrTitle').value,
    tkrMessage: document.getElementById('tkrMessage').value,
    tkrSpeed: document.getElementById('tkrSpeed').value,
    tkrLogoWidth: document.getElementById('tkrLogoWidth').value,
    tkrFontSize: document.getElementById('tkrFontSize').value,
    tkrFont: document.getElementById('tkrFont').value,
    tkrTitleSize: document.getElementById('tkrTitleSize').value,
    tkrTitleColor: document.getElementById('tkrTitleColor').value,
    tkrTitleBg: document.getElementById('tkrTitleBg').value,
    tkrMsgColor: document.getElementById('tkrMsgColor').value,
    tkrMsgBg: document.getElementById('tkrMsgBg').value,
    tkrToggle: document.getElementById('tkrToggle').checked,
  });
}

function loadTkrSettings() {
  const s = loadJSON('ticker_settings', {});
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.value = val;
  };
  set('tkrTitle', s.tkrTitle);
  set('tkrMessage', s.tkrMessage);
  set('tkrSpeed', s.tkrSpeed);
  set('tkrLogoWidth', s.tkrLogoWidth);
  set('tkrFontSize', s.tkrFontSize);
  set('tkrFont', s.tkrFont);
  set('tkrTitleSize', s.tkrTitleSize);
  set('tkrTitleColor', s.tkrTitleColor);
  set('tkrTitleBg', s.tkrTitleBg);
  set('tkrMsgColor', s.tkrMsgColor);
  set('tkrMsgBg', s.tkrMsgBg);
  const toggle = document.getElementById('tkrToggle');
  if (toggle && s.tkrToggle !== undefined) toggle.checked = s.tkrToggle;
}

function debouncedSaveTkr() {
  if (isApplyingRemote()) return;
  clearTimeout(tkrSaveTimer);
  tkrSaveTimer = setTimeout(saveTkrSettings, 300);
}

let tickerLogoUrl = null;

function leerTkrData() {
  return {
    title: document.getElementById('tkrTitle').value,
    message: document.getElementById('tkrMessage').value,
    logoUrl: tickerLogoUrl,
    speed: parseFloat(document.getElementById('tkrSpeed').value) || 80,
    logoWidth: parseFloat(document.getElementById('tkrLogoWidth').value) || 4,
    fontSize: parseFloat(document.getElementById('tkrFontSize').value) || 33,
    fontFamily: document.getElementById('tkrFont').value || 'Montserrat, sans-serif',
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
    btnNinguno.textContent = 'None';
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
  loadTkrSettings();

  window.addEventListener('storage', (e) => {
    if (e.key === 'ticker_settings' && e.newValue) {
      loadTkrSettings();
      const container = document.querySelector('[data-tab-content="ticker"]');
      if (container) {
        container.querySelectorAll('input, select, textarea').forEach(el => {
          const eventType = el.type === 'checkbox' ? 'change' : 'input';
          el.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
      }
    }
  });

  window.addEventListener(SERVER_SETTINGS_EVENT, (e) => {
    if (e.detail && e.detail.key === 'ticker_settings') {
      loadTkrSettings();
      const container = document.querySelector('[data-tab-content="ticker"]');
      if (container) {
        container.querySelectorAll('input, select, textarea').forEach(el => {
          const eventType = el.type === 'checkbox' ? 'change' : 'input';
          el.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
      }
    }
  });

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
    debouncedSaveTkr();
  });
  document.querySelector('[data-reset-tkr-msg]')?.addEventListener('click', () => {
    document.getElementById('tkrFontSize').value = 33;
    document.getElementById('tkrMsgColor').value = '#111111';
    document.getElementById('tkrMsgBg').value = '#ffffff';
    actualizarValoresTkr();
    tickerUpdate();
    debouncedSaveTkr();
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
        fontFamily: document.getElementById('tkrFont').value || 'Montserrat, sans-serif',
        titleSize: parseInt(document.getElementById('tkrTitleSize').value, 10) || 44,
        titleColor: document.getElementById('tkrTitleColor').value || '#ffffff',
        titleBg: document.getElementById('tkrTitleBg').value || '#071041',
        msgColor: document.getElementById('tkrMsgColor').value || '#111111',
        msgBg: document.getElementById('tkrMsgBg').value || '#ffffff',
      };
    },
    applyData: (d) => {
      const set = (id, val, dispatch = true) => {
        const el = document.getElementById(id);
        if (el && val !== undefined) {
          el.value = val;
          if (dispatch) el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };
      set('tkrTitle', d.title || '');
      set('tkrMessage', d.message || '');
      tickerLogoUrl = d.logoUrl || null;
      set('tkrSpeed', d.speed);
      set('tkrLogoWidth', d.logoWidth);
      set('tkrFontSize', d.fontSize);
      set('tkrFont', d.fontFamily);
      set('tkrTitleSize', d.titleSize);
      set('tkrTitleColor', d.titleColor);
      set('tkrTitleBg', d.titleBg);
      set('tkrMsgColor', d.msgColor);
      set('tkrMsgBg', d.msgBg);
      actualizarValoresTkr();
      cargarTkrLogos();
    },
    formatTitle: (d) => d.title || '(no title)',
    applyPreview: tickerUpdate,
  })?.loadInitial(1);

  const tkrContainer = document.querySelector('[data-tab-content="ticker"]');
  if (tkrContainer) {
    tkrContainer.addEventListener('input', debouncedSaveTkr);
    tkrContainer.addEventListener('change', debouncedSaveTkr);
  }
}
