import { setVal } from './utils.js';
import { emitGraphic, emitGraphicNow } from './socket.js';

const TIPO = 'LIVEBUG';
const TAB = 'livebug';
const PREVIEW_TIPO = 'PREVIEW_LIVEBUG';
const TOGGLE_ID = 'livebugToggle';

function obtenerEstilo() {
  return {
    fontFamily: document.getElementById('lbInputFont').value || 'Montserrat, sans-serif',
    titleFontSize: document.getElementById('lbInputTitleSize').value + 'rem',
    subtitleFontSize: document.getElementById('lbInputSubtitleSize').value + 'rem',
    titleColor: document.getElementById('lbInputTitleColor').value,
    titleBg: document.getElementById('lbInputTitleBg').value,
    subtitleColor: document.getElementById('lbInputSubtitleColor').value,
    subtitleBg: document.getElementById('lbInputSubtitleBg').value,
    escala: parseFloat(document.getElementById('lbInputScale').value),
    posX: parseInt(document.getElementById('lbInputPosX').value, 10),
    posY: parseInt(document.getElementById('lbInputPosY').value, 10),
  };
}

function leerLiveBugData() {
  return {
    lugar: document.getElementById('lbInputLugar').value,
    ciudad: document.getElementById('lbInputCiudad').value,
    refreshInterval: parseInt(document.getElementById('lbInputRefresh').value, 10) * 1000,
    estilo: obtenerEstilo(),
  };
}

function liveBugUpdate() {
  emitGraphic({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData: leerLiveBugData,
    toggleId: TOGGLE_ID,
  });
}

function liveBugEmit(accion) {
  emitGraphicNow({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData: leerLiveBugData,
    toggleId: TOGGLE_ID,
    accion,
  });
}

function liveBugRefreshTemp() {
  const btn = document.getElementById('lbRefreshTempBtn');
  if (btn) {
    btn.disabled = true;
    btn.style.color = '#fff';
    setTimeout(() => {
      btn.disabled = false;
      btn.style.color = '';
    }, 1500);
  }
  emitGraphicNow({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData: leerLiveBugData,
    toggleId: TOGGLE_ID,
    accion: 'REFRESH_TEMP',
  });
}

function actualizarValoresLiveBug() {
  setVal('valLbRefresh', document.getElementById('lbInputRefresh').value / 60 + ' min');
}

export function initLiveBug() {
  document.getElementById('lbInputLugar')?.addEventListener('input', liveBugUpdate);
  document.getElementById('lbInputCiudad')?.addEventListener('input', liveBugUpdate);
  document.getElementById('lbInputRefresh')?.addEventListener('input', () => {
    actualizarValoresLiveBug();
    liveBugUpdate();
  });

  for (const id of [
    'lbInputTitleSize',
    'lbInputSubtitleSize',
    'lbInputScale',
    'lbInputPosX',
    'lbInputPosY',
  ]) {
    const el = document.getElementById(id);
    if (!el) continue;
    const val = document.getElementById('val' + id.slice(2));
    el.addEventListener('input', () => {
      if (val) {
        if (id === 'lbInputScale') val.textContent = el.value + 'x';
        else if (id === 'lbInputPosX' || id === 'lbInputPosY') val.textContent = el.value + 'px';
        else val.textContent = el.value + 'rem';
      }
      liveBugUpdate();
    });
  }
  for (const id of [
    'lbInputFont',
    'lbInputTitleColor',
    'lbInputTitleBg',
    'lbInputSubtitleColor',
    'lbInputSubtitleBg',
  ]) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', liveBugUpdate);
  }
  setTimeout(() => {
    if (document.getElementById(TOGGLE_ID)?.checked) liveBugEmit('SHOW');
  }, 500);

  document.getElementById('livebugToggle')?.addEventListener('change', function () {
    liveBugEmit(this.checked ? 'SHOW' : 'HIDE');
  });

  document.getElementById('lbRefreshTempBtn')?.addEventListener('click', liveBugRefreshTemp);

  document.querySelector('[data-lb-reset-title]')?.addEventListener('click', () => {
    document.getElementById('lbInputTitleSize').value = '3.0';
    document.getElementById('lbInputTitleColor').value = '#ffffff';
    document.getElementById('lbInputTitleBg').value = '#06155A';
    setVal('valLbTitleSize', '3.0rem');
    liveBugUpdate();
  });
  document.querySelector('[data-lb-reset-sub]')?.addEventListener('click', () => {
    document.getElementById('lbInputSubtitleSize').value = '2.5';
    document.getElementById('lbInputSubtitleColor').value = '#111111';
    document.getElementById('lbInputSubtitleBg').value = '#ffffff';
    setVal('valLbSubtitleSize', '2.5rem');
    liveBugUpdate();
  });
  document.querySelector('[data-lb-reset-pos]')?.addEventListener('click', () => {
    document.getElementById('lbInputScale').value = '1.0';
    document.getElementById('lbInputPosX').value = '100';
    document.getElementById('lbInputPosY').value = '32';
    setVal('valLbScale', '1.0x');
    setVal('valLbPosX', '100px');
    setVal('valLbPosY', '32px');
    liveBugUpdate();
  });

  document.getElementById('livebugResetStyle')?.addEventListener('click', () => {
    document.getElementById('lbInputFont').value = 'Montserrat, sans-serif';
    document.getElementById('lbInputTitleSize').value = '3.0';
    document.getElementById('lbInputTitleColor').value = '#ffffff';
    document.getElementById('lbInputTitleBg').value = '#06155A';
    document.getElementById('lbInputSubtitleSize').value = '2.5';
    document.getElementById('lbInputSubtitleColor').value = '#111111';
    document.getElementById('lbInputSubtitleBg').value = '#ffffff';
    document.getElementById('lbInputScale').value = '1.0';
    document.getElementById('lbInputPosX').value = '100';
    document.getElementById('lbInputPosY').value = '32';
    setVal('valLbTitleSize', '3.0rem');
    setVal('valLbSubtitleSize', '2.5rem');
    setVal('valLbScale', '1.0x');
    setVal('valLbPosX', '100px');
    setVal('valLbPosY', '32px');
    liveBugUpdate();
  });
  actualizarValoresLiveBug();
}
