import { hexToRgba, setVal, bindFontPicker } from './utils.js';
import { emitGraphic, emitGraphicNow } from './socket.js';

const TIPO = 'COUNTDOWN';
const TAB = 'countdown';
const PREVIEW_TIPO = 'PREVIEW_COUNTDOWN';
const TOGGLE_ID = 'countdownToggle';

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
