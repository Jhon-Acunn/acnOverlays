import { setVal, bindFontPicker } from './utils.js';
import { createGuestSlots } from './guest-slots.js';
import { emitGraphic, emitGraphicNow } from './socket.js';
import { loadJSON, saveJSON, SERVER_SETTINGS_EVENT, isApplyingRemote } from './storage.js';

const TIPO = 'LOWER_DUAL';
const TAB = 'lower-dual';
const PREVIEW_TIPO = 'PREVIEW_LOWER_DUAL';
const STORAGE_KEY = 'lower_dual_settings';

const DUAL_IDS = [
  'dualLNombre', 'dualLApellido', 'dualLCargo',
  'dualRNombre', 'dualRApellido', 'dualRCargo',
  'dualFont', 'dualTitleSize', 'dualSubSize',
  'dualLScale', 'dualLX', 'dualLY',
  'dualRScale', 'dualRX', 'dualRY',
  'dualTitleColor', 'dualTitleBg', 'dualSubColor', 'dualSubBg',
];

const DUAL_TOGGLE_IDS = ['dualLToggle', 'dualRToggle', 'dualBothToggle'];

function saveSettings() {
  const data = {};
  for (const id of DUAL_IDS) {
    const el = document.getElementById(id);
    data[id] = el ? el.value : '';
  }
  for (const id of DUAL_TOGGLE_IDS) {
    const el = document.getElementById(id);
    data[id] = el ? el.checked : false;
  }
  saveJSON(STORAGE_KEY, data);
}

function loadSettings() {
  const data = loadJSON(STORAGE_KEY, {});
  for (const id of DUAL_IDS) {
    const el = document.getElementById(id);
    if (el && data[id] !== undefined) el.value = data[id];
  }
  for (const id of DUAL_TOGGLE_IDS) {
    const el = document.getElementById(id);
    if (el) el.checked = !!data[id];
  }
}

let _dualSaveTimer;
function _dualDebouncedSave() {
  if (isApplyingRemote()) return;
  clearTimeout(_dualSaveTimer);
  _dualSaveTimer = setTimeout(saveSettings, 300);
}

function leerDualCfg() {
  const shared = {
    fontFamily: document.getElementById('dualFont').value || 'Montserrat, sans-serif',
    titleFontSize: document.getElementById('dualTitleSize').value + 'rem',
    subtitleFontSize: document.getElementById('dualSubSize').value + 'rem',
    titleColor: document.getElementById('dualTitleColor').value,
    titleBg: document.getElementById('dualTitleBg').value,
    subtitleColor: document.getElementById('dualSubColor').value,
    subtitleBg: document.getElementById('dualSubBg').value,
  };
  const estiloL = {
    escala: parseFloat(document.getElementById('dualLScale').value) || 1.0,
    posX: parseInt(document.getElementById('dualLX').value, 10) || 100,
    posY: parseInt(document.getElementById('dualLY').value, 10) || 90,
  };
  const estiloR = {
    escala: parseFloat(document.getElementById('dualRScale').value) || 1.0,
    posX: parseInt(document.getElementById('dualRX').value, 10) || 100,
    posY: parseInt(document.getElementById('dualRY').value, 10) || 90,
  };
  return {
    left: {
      nombre: document.getElementById('dualLNombre').value,
      apellido: document.getElementById('dualLApellido').value,
      cargo: document.getElementById('dualLCargo').value,
      estilo: { ...shared, ...estiloL },
    },
    right: {
      nombre: document.getElementById('dualRNombre').value,
      apellido: document.getElementById('dualRApellido').value,
      cargo: document.getElementById('dualRCargo').value,
      estilo: { ...shared, ...estiloR },
    },
  };
}

function accionPorVisibilidad() {
  const leftOn = document.getElementById('dualLToggle').checked;
  const rightOn = document.getElementById('dualRToggle').checked;
  if (leftOn && rightOn) return 'SHOW';
  if (leftOn) return 'SHOW_LEFT';
  if (rightOn) return 'SHOW_RIGHT';
  return 'HIDE';
}

function dualUpdate() {
  const accion = accionPorVisibilidad();
  const getData = () => {
    const cfg = leerDualCfg();
    if (accion === 'SHOW_LEFT') return { left: cfg.left };
    if (accion === 'SHOW_RIGHT') return { right: cfg.right };
    return cfg;
  };
  emitGraphic({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData,
    customAccion: accion,
  });
}

function dualEmit(accion) {
  const getData = () => {
    const cfg = leerDualCfg();
    if (accion === 'SHOW_LEFT') return { left: cfg.left };
    if (accion === 'SHOW_RIGHT') return { right: cfg.right };
    return cfg;
  };
  emitGraphicNow({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData,
    accion,
  });
}

function actualizarValDual() {
  setVal('valDualTitleSize', document.getElementById('dualTitleSize').value + 'rem');
  setVal('valDualSubSize', document.getElementById('dualSubSize').value + 'rem');
  setVal('valDualLScale', document.getElementById('dualLScale').value + 'x');
  setVal('valDualLX', document.getElementById('dualLX').value + 'px');
  setVal('valDualLY', document.getElementById('dualLY').value + 'px');
  setVal('valDualRScale', document.getElementById('dualRScale').value + 'x');
  setVal('valDualRX', document.getElementById('dualRX').value + 'px');
  setVal('valDualRY', document.getElementById('dualRY').value + 'px');
}

export function initLowerDual() {
  let busy = false;

  loadSettings();

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      loadSettings();
      const container = document.querySelector('[data-tab-content="lower-dual"]');
      if (container) {
        container.querySelectorAll('input, select, textarea').forEach(el => {
          const eventType = el.type === 'checkbox' ? 'change' : 'input';
          el.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
      }
    }
  });

  window.addEventListener(SERVER_SETTINGS_EVENT, (e) => {
    if (e.detail && e.detail.key === STORAGE_KEY) {
      loadSettings();
      const container = document.querySelector('[data-tab-content="lower-dual"]');
      if (container) {
        container.querySelectorAll('input, select, textarea').forEach(el => {
          const eventType = el.type === 'checkbox' ? 'change' : 'input';
          el.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
      }
    }
  });

  actualizarValDual();

  function syncBoth() {
    const both = document.getElementById('dualBothToggle');
    if (!both) return;
    const on =
      document.getElementById('dualLToggle').checked &&
      document.getElementById('dualRToggle').checked;
    if (both.checked !== on) {
      both.checked = on;
    }
  }

  document.getElementById('dualLToggle')?.addEventListener('change', function () {
    if (busy) return;
    busy = true;
    if (this.checked) {
      dualEmit('SHOW_LEFT');
    } else {
      dualEmit('HIDE_LEFT');
    }
    syncBoth();
    busy = false;
  });

  document.getElementById('dualRToggle')?.addEventListener('change', function () {
    if (busy) return;
    busy = true;
    if (this.checked) {
      dualEmit('SHOW_RIGHT');
    } else {
      dualEmit('HIDE_RIGHT');
    }
    syncBoth();
    busy = false;
  });

  document.getElementById('dualBothToggle')?.addEventListener('change', function () {
    if (busy) return;
    busy = true;
    if (this.checked) {
      const l = document.getElementById('dualLToggle');
      const r = document.getElementById('dualRToggle');
      if (l && !l.checked) {
        l.checked = true;
      }
      if (r && !r.checked) {
        r.checked = true;
      }
      dualEmit('SHOW');
    } else {
      dualEmit('HIDE');
      const l = document.getElementById('dualLToggle');
      const r = document.getElementById('dualRToggle');
      if (l) {
        l.checked = false;
      }
      if (r) {
        r.checked = false;
      }
    }
    busy = false;
  });

  for (const id of [
    'dualLNombre',
    'dualLApellido',
    'dualLCargo',
    'dualRNombre',
    'dualRApellido',
    'dualRCargo',
    'dualFont',
    'dualTitleColor',
    'dualTitleBg',
    'dualSubColor',
    'dualSubBg',
  ]) {
    document.getElementById(id)?.addEventListener('input', dualUpdate);
  }
  for (const id of [
    'dualTitleSize',
    'dualSubSize',
    'dualLScale',
    'dualLX',
    'dualLY',
    'dualRScale',
    'dualRX',
    'dualRY',
  ]) {
    document.getElementById(id)?.addEventListener('input', () => {
      actualizarValDual();
      dualUpdate();
    });
  }
  bindFontPicker('dualFontDropdownBtn', 'dualFont');

  const dualContainer = document.querySelector(`[data-tab-content="${TAB}"]`);
  if (dualContainer) {
    dualContainer.addEventListener('input', _dualDebouncedSave);
    dualContainer.addEventListener('change', _dualDebouncedSave);
  }

  document.querySelector('[data-dual-reset-title]')?.addEventListener('click', () => {
    document.getElementById('dualTitleSize').value = '3.0';
    document.getElementById('dualTitleColor').value = '#ffffff';
    document.getElementById('dualTitleBg').value = '#06155A';
    actualizarValDual();
    dualUpdate();
  });
  document.querySelector('[data-dual-reset-sub]')?.addEventListener('click', () => {
    document.getElementById('dualSubSize').value = '2.5';
    document.getElementById('dualSubColor').value = '#111111';
    document.getElementById('dualSubBg').value = '#ffffff';
    actualizarValDual();
    dualUpdate();
  });
  document.querySelector('[data-dual-reset-left]')?.addEventListener('click', () => {
    document.getElementById('dualLScale').value = '1.0';
    document.getElementById('dualLX').value = '100';
    document.getElementById('dualLY').value = '90';
    actualizarValDual();
    dualUpdate();
  });
  document.querySelector('[data-dual-reset-right]')?.addEventListener('click', () => {
    document.getElementById('dualRScale').value = '1.0';
    document.getElementById('dualRX').value = '100';
    document.getElementById('dualRY').value = '90';
    actualizarValDual();
    dualUpdate();
  });

  createGuestSlots({
    gridId: 'dualL-guest-grid',
    storageKey: 'dual_guests',
    getCurrent: () => {
      const nombre = document.getElementById('dualLNombre').value.trim();
      const apellido = document.getElementById('dualLApellido').value.trim();
      const cargo = document.getElementById('dualLCargo').value.trim();
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
      set('dualLNombre', d.nombre);
      set('dualLApellido', d.apellido);
      set('dualLCargo', d.cargo);
    },
    formatTitle: (d) => `${d.nombre || ''} ${d.apellido || ''}`.trim() || 'Empty Slot',
    applyPreview: dualUpdate,
  });

  createGuestSlots({
    gridId: 'dualR-guest-grid',
    storageKey: 'dual_guests',
    getCurrent: () => {
      const nombre = document.getElementById('dualRNombre').value.trim();
      const apellido = document.getElementById('dualRApellido').value.trim();
      const cargo = document.getElementById('dualRCargo').value.trim();
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
      set('dualRNombre', d.nombre);
      set('dualRApellido', d.apellido);
      set('dualRCargo', d.cargo);
    },
    formatTitle: (d) => `${d.nombre || ''} ${d.apellido || ''}`.trim() || 'Empty Slot',
    applyPreview: dualUpdate,
  });

  // Initial load (slot 1)
  const initial = JSON.parse(localStorage.getItem('dual_guests') || '{}');
  if (initial[1]) {
    const d1 = initial[1];
    document.getElementById('dualLNombre').value = d1.nombre || '';
    document.getElementById('dualLApellido').value = d1.apellido || '';
    document.getElementById('dualLCargo').value = d1.cargo || '';
    document.getElementById('dualRNombre').value = d1.nombre || '';
    document.getElementById('dualRApellido').value = d1.apellido || '';
    document.getElementById('dualRCargo').value = d1.cargo || '';
  }
}
