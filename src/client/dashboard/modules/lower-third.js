import { setVal } from './utils.js';
import { createGuestSlots } from './guest-slots.js';
import { emitGraphic, emitGraphicNow } from './socket.js';
import { loadJSON, saveJSON } from './storage.js';

const GUEST_STORAGE_KEY = 'lower_guests';
const MODULE_KEY = 'lower_third_settings';

const LOWER_IDS = [
  'inputNombre', 'inputApellido', 'inputCargo', 'inputFont',
  'inputTitleSize', 'inputSubtitleSize',
  'inputScale', 'inputPosX', 'inputPosY',
  'inputTitleColor', 'inputTitleBg', 'inputSubtitleColor', 'inputSubtitleBg',
];

const LOWER_TOGGLE_IDS = ['lowerToggle'];

function saveLowerSettings() {
  const data = {};
  for (const id of LOWER_IDS) {
    const el = document.getElementById(id);
    data[id] = el ? el.value : '';
  }
  for (const id of LOWER_TOGGLE_IDS) {
    const el = document.getElementById(id);
    data[id] = el ? el.checked : false;
  }
  saveJSON(MODULE_KEY, data);
}

function loadLowerSettings() {
  const data = loadJSON(MODULE_KEY, {});
  for (const id of LOWER_IDS) {
    const el = document.getElementById(id);
    if (el && data[id] !== undefined) el.value = data[id];
  }
  for (const id of LOWER_TOGGLE_IDS) {
    const el = document.getElementById(id);
    if (el) el.checked = !!data[id];
  }
}

let _lowerSaveTimer;
function _lowerDebouncedSave() {
  clearTimeout(_lowerSaveTimer);
  _lowerSaveTimer = setTimeout(saveLowerSettings, 300);
}

const TIPO = 'LOWER_THIRD';
const TAB = 'lower';
const PREVIEW_TIPO = 'PREVIEW_LOWER';
const TOGGLE_ID = 'lowerToggle';

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
    posY: parseInt(document.getElementById('inputPosY').value, 10),
  };
}

function leerLowerThirdData() {
  return {
    nombre: document.getElementById('inputNombre').value,
    apellido: document.getElementById('inputApellido').value,
    cargo: document.getElementById('inputCargo').value,
    estilo: obtenerEstilo(),
  };
}

function lowerUpdate() {
  emitGraphic({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData: leerLowerThirdData,
    toggleId: TOGGLE_ID,
  });
}

function lowerEmit(accion) {
  emitGraphicNow({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData: leerLowerThirdData,
    toggleId: TOGGLE_ID,
    accion,
  });
}

export function initLowerThird() {
  loadLowerSettings();

  window.addEventListener('storage', (e) => {
    if (e.key === MODULE_KEY && e.newValue) {
      loadLowerSettings();
    }
  });
  setVal('valTitleSize', (document.getElementById('inputTitleSize')?.value || '0') + 'rem');
  setVal('valSubtitleSize', (document.getElementById('inputSubtitleSize')?.value || '0') + 'rem');
  setVal('valScale', (document.getElementById('inputScale')?.value || '0') + 'x');
  setVal('valPosX', (document.getElementById('inputPosX')?.value || '0') + 'px');
  setVal('valPosY', (document.getElementById('inputPosY')?.value || '0') + 'px');

  document.getElementById('nameA')?.addEventListener('input', lowerUpdate);
  document.getElementById('nameB')?.addEventListener('input', lowerUpdate);
  for (const id of [
    'inputTitleSize',
    'inputSubtitleSize',
    'inputScale',
    'inputPosX',
    'inputPosY',
  ]) {
    const el = document.getElementById(id);
    if (!el) continue;
    const val = document.getElementById('val' + id.slice(5));
    el.addEventListener('input', () => {
      if (val) {
        if (id === 'inputScale') val.textContent = el.value + 'x';
        else if (id === 'inputPosX' || id === 'inputPosY') val.textContent = el.value + 'px';
        else val.textContent = el.value + 'rem';
      }
      lowerUpdate();
    });
  }
  for (const id of [
    'inputNombre',
    'inputApellido',
    'inputCargo',
    'inputFont',
    'inputTitleColor',
    'inputTitleBg',
    'inputSubtitleColor',
    'inputSubtitleBg',
  ]) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', lowerUpdate);
  }
  setTimeout(() => {
    if (document.getElementById(TOGGLE_ID)?.checked) lowerUpdate();
  }, 500);

  document.getElementById('lowerToggle')?.addEventListener('change', function () {
    lowerEmit(this.checked ? 'SHOW' : 'HIDE');
  });

  document.querySelector('[data-reset-title]')?.addEventListener('click', () => {
    document.getElementById('inputTitleSize').value = '3.0';
    document.getElementById('inputTitleColor').value = '#ffffff';
    document.getElementById('inputTitleBg').value = '#06155A';
    setVal('valTitleSize', '3.0rem');
    lowerUpdate();
  });
  document.querySelector('[data-reset-sub]')?.addEventListener('click', () => {
    document.getElementById('inputSubtitleSize').value = '2.5';
    document.getElementById('inputSubtitleColor').value = '#111111';
    document.getElementById('inputSubtitleBg').value = '#ffffff';
    setVal('valSubtitleSize', '2.5rem');
    lowerUpdate();
  });
  document.querySelector('[data-reset-pos]')?.addEventListener('click', () => {
    document.getElementById('inputScale').value = '1.0';
    document.getElementById('inputPosX').value = '100';
    document.getElementById('inputPosY').value = '90';
    setVal('valScale', '1.0x');
    setVal('valPosX', '100px');
    setVal('valPosY', '90px');
    lowerUpdate();
  });

  const lowerContainer = document.getElementById(TAB);
  if (lowerContainer) {
    lowerContainer.addEventListener('input', _lowerDebouncedSave);
    lowerContainer.addEventListener('change', _lowerDebouncedSave);
  }

  createGuestSlots({
    gridId: 'guest-grid',
    storageKey: GUEST_STORAGE_KEY,
    getCurrent: () => {
      const nombre = document.getElementById('inputNombre').value.trim();
      const apellido = document.getElementById('inputApellido').value.trim();
      const cargo = document.getElementById('inputCargo').value.trim();
      if (!nombre && !apellido && !cargo) return null;
      return { nombre, apellido, cargo };
    },
    applyData: (d) => {
      const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) {
          el.value = val || '';
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };
      set('inputNombre', d.nombre);
      set('inputApellido', d.apellido);
      set('inputCargo', d.cargo);
    },
    formatTitle: (d) => `${d.nombre || ''} ${d.apellido || ''}`.trim() || 'Empty Slot',
    applyPreview: lowerUpdate,
  })?.loadInitial(1);
}
