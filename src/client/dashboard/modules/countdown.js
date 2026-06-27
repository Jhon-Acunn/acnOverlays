import { hexToRgba, setVal, bindFontPicker, debounce } from './utils.js';
import { emitGraphic, emitGraphicNow } from './socket.js';
import { loadJSON, saveJSON } from './storage.js';

const TIPO = 'COUNTDOWN';
const TAB = 'countdown';
const PREVIEW_TIPO = 'PREVIEW_COUNTDOWN';
const TOGGLE_ID = 'countdownToggle';
const SETTINGS_KEY = 'countdown_settings';

function saveSettings() {
  saveJSON(SETTINGS_KEY, {
    cdDuration: document.getElementById('cdDuration').value,
    cdLabel: document.getElementById('cdLabel').value,
    cdMode: document.getElementById('cdMode').value,
    cdFont: document.getElementById('cdFont').value,
    cdLabelSize: document.getElementById('cdLabelSize').value,
    cdLabelColor: document.getElementById('cdLabelColor').value,
    cdDisplaySize: document.getElementById('cdDisplaySize').value,
    cdDisplayColor: document.getElementById('cdDisplayColor').value,
    cdBgColor: document.getElementById('cdBgColor').value,
    cdOpacity: document.getElementById('cdOpacity').value,
    cdPosX: document.getElementById('cdPosX').value,
    cdPosY: document.getElementById('cdPosY').value,
    countdownToggle: document.getElementById('countdownToggle')?.checked ?? false,
  });
}

function loadSettings() {
  const s = loadJSON(SETTINGS_KEY, {});
  if (s.cdDuration !== undefined) document.getElementById('cdDuration').value = s.cdDuration;
  if (s.cdLabel !== undefined) document.getElementById('cdLabel').value = s.cdLabel;
  if (s.cdMode !== undefined) document.getElementById('cdMode').value = s.cdMode;
  if (s.cdFont !== undefined) document.getElementById('cdFont').value = s.cdFont;
  if (s.cdLabelSize !== undefined) document.getElementById('cdLabelSize').value = s.cdLabelSize;
  if (s.cdLabelColor !== undefined) document.getElementById('cdLabelColor').value = s.cdLabelColor;
  if (s.cdDisplaySize !== undefined) document.getElementById('cdDisplaySize').value = s.cdDisplaySize;
  if (s.cdDisplayColor !== undefined) document.getElementById('cdDisplayColor').value = s.cdDisplayColor;
  if (s.cdBgColor !== undefined) document.getElementById('cdBgColor').value = s.cdBgColor;
  if (s.cdOpacity !== undefined) document.getElementById('cdOpacity').value = s.cdOpacity;
  if (s.cdPosX !== undefined) document.getElementById('cdPosX').value = s.cdPosX;
  if (s.cdPosY !== undefined) document.getElementById('cdPosY').value = s.cdPosY;
  if (s.countdownToggle !== undefined) document.getElementById('countdownToggle').checked = s.countdownToggle;
}

function leerCountdownData() {
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
      bgColor: hexToRgba(
        document.getElementById('cdBgColor').value,
        parseFloat(document.getElementById('cdOpacity').value) || 0.6
      ),
      opacity: parseFloat(document.getElementById('cdOpacity').value) || 0.6,
      posX: parseInt(document.getElementById('cdPosX').value, 10) || 32,
      posY: parseInt(document.getElementById('cdPosY').value, 10) || 96,
    },
  };
}

function countdownUpdate() {
  emitGraphic({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData: leerCountdownData,
    toggleId: TOGGLE_ID,
  });
}

function countdownEmit(accion) {
  emitGraphicNow({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData: leerCountdownData,
    toggleId: TOGGLE_ID,
    accion,
  });
}

function actualizarValoresCD() {
  setVal('valCdOpacity', document.getElementById('cdOpacity').value);
  setVal('valCdLabelSize', document.getElementById('cdLabelSize').value + 'rem');
  setVal('valCdDisplaySize', document.getElementById('cdDisplaySize').value + 'rem');
  setVal('valCdPosX', document.getElementById('cdPosX').value + 'px');
  setVal('valCdPosY', document.getElementById('cdPosY').value + 'px');
}

export function initCountdown() {
  loadSettings();

  window.addEventListener('storage', (e) => {
    if (e.key === SETTINGS_KEY && e.newValue) {
      loadSettings();
      const container = document.querySelector('[data-tab-content="countdown"]');
      if (container) {
        container.querySelectorAll('input, select, textarea').forEach((el) => {
          const eventType = el.type === 'checkbox' ? 'change' : 'input';
          el.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
      }
    }
  });

  const debouncedSave = debounce(saveSettings, 300);

  for (const id of [
    'cdDuration', 'cdLabel', 'cdMode',
    'cdFont', 'cdLabelSize', 'cdLabelColor',
    'cdDisplaySize', 'cdDisplayColor', 'cdBgColor',
    'cdOpacity', 'cdPosX', 'cdPosY',
  ]) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.type === 'checkbox') el.addEventListener('change', debouncedSave);
    else el.addEventListener('input', debouncedSave);
  }
  document.getElementById('cdMode')?.addEventListener('change', debouncedSave);
  document.getElementById('countdownToggle')?.addEventListener('change', debouncedSave);

  document.getElementById('countdownToggle')?.addEventListener('change', function () {
    countdownEmit(this.checked ? 'SHOW' : 'HIDE');
  });
  ['cdDuration', 'cdLabel', 'cdMode'].forEach((id) =>
    document.getElementById(id)?.addEventListener('input', countdownUpdate)
  );
  document.getElementById('cdMode')?.addEventListener('change', countdownUpdate);
  ['cdOpacity', 'cdLabelSize', 'cdDisplaySize', 'cdPosX', 'cdPosY'].forEach((id) =>
    document.getElementById(id)?.addEventListener('input', () => {
      actualizarValoresCD();
      countdownUpdate();
    })
  );
  ['cdLabelColor', 'cdDisplayColor', 'cdBgColor', 'cdFont'].forEach((id) =>
    document.getElementById(id)?.addEventListener('input', countdownUpdate)
  );
  bindFontPicker('cdFontDropdownBtn', 'cdFont');
  setTimeout(() => {
    if (document.getElementById(TOGGLE_ID)?.checked) countdownUpdate();
  }, 500);

  document.getElementById('cdReset')?.addEventListener('click', () => countdownEmit('SHOW'));
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
    countdownUpdate();
  });
  actualizarValoresCD();
}
