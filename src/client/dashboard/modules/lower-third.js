import { setVal } from './utils.js';
import { createGuestSlots } from './guest-slots.js';
import { emitGraphic, emitGraphicNow } from './socket.js';

const STORAGE_KEY = 'lower_guests';

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

  createGuestSlots({
    gridId: 'guest-grid',
    storageKey: STORAGE_KEY,
    getCurrent: () => {
      const nombre = document.getElementById('inputNombre').value.trim();
      const apellido = document.getElementById('inputApellido').value.trim();
      const cargo = document.getElementById('inputCargo').value.trim();
      if (!nombre && !apellido && !cargo) return null;
      return { nombre, apellido, cargo };
    },
    applyData: (d) => {
      document.getElementById('inputNombre').value = d.nombre || '';
      document.getElementById('inputApellido').value = d.apellido || '';
      document.getElementById('inputCargo').value = d.cargo || '';
    },
    formatTitle: (d) => `${d.nombre || ''} ${d.apellido || ''}`.trim() || 'Slot vacío',
    applyPreview: lowerUpdate,
  })?.loadInitial(1);
}
