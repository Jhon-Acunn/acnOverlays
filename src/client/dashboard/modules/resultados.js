import { emitGraphic, emitGraphicNow } from './socket.js';
import { loadJSON, saveJSON } from './storage.js';
import { debounce } from './utils.js';

const TIPO = 'RESULTADOS';
const TAB = 'resultados';
const PREVIEW_TIPO = 'PREVIEW_RESULTADOS';
const TOGGLE_ID = 'resultadosToggle';
const SETTINGS_KEY = 'resultados_settings';

function saveSettings() {
  saveJSON(SETTINGS_KEY, {
    resNombreA: document.getElementById('resNombreA').value,
    resPartidoA: document.getElementById('resPartidoA').value,
    resColorA: document.getElementById('resColorA').value,
    resPercentA: document.getElementById('resPercentA').value,
    resVotosA: document.getElementById('resVotosA').value,
    resNombreB: document.getElementById('resNombreB').value,
    resPartidoB: document.getElementById('resPartidoB').value,
    resColorB: document.getElementById('resColorB').value,
    resPercentB: document.getElementById('resPercentB').value,
    resVotosB: document.getElementById('resVotosB').value,
    resParticipacion: document.getElementById('resParticipacion').value,
    resTopDept: document.getElementById('resTopDept').value,
    resTendencia: document.getElementById('resTendencia').value,
    resDiferencia: document.getElementById('resDiferencia').value,
    resFecha: document.getElementById('resFecha').value,
    resEscrutinio: document.getElementById('resEscrutinio').value,
    resTickerMsgs: document.getElementById('resTickerMsgs').value,
    resultadosToggle: document.getElementById('resultadosToggle')?.checked ?? false,
  });
}

function loadSettings() {
  const s = loadJSON(SETTINGS_KEY, {});
  if (s.resNombreA !== undefined) document.getElementById('resNombreA').value = s.resNombreA;
  if (s.resPartidoA !== undefined) document.getElementById('resPartidoA').value = s.resPartidoA;
  if (s.resColorA !== undefined) document.getElementById('resColorA').value = s.resColorA;
  if (s.resPercentA !== undefined) document.getElementById('resPercentA').value = s.resPercentA;
  if (s.resVotosA !== undefined) document.getElementById('resVotosA').value = s.resVotosA;
  if (s.resNombreB !== undefined) document.getElementById('resNombreB').value = s.resNombreB;
  if (s.resPartidoB !== undefined) document.getElementById('resPartidoB').value = s.resPartidoB;
  if (s.resColorB !== undefined) document.getElementById('resColorB').value = s.resColorB;
  if (s.resPercentB !== undefined) document.getElementById('resPercentB').value = s.resPercentB;
  if (s.resVotosB !== undefined) document.getElementById('resVotosB').value = s.resVotosB;
  if (s.resParticipacion !== undefined) document.getElementById('resParticipacion').value = s.resParticipacion;
  if (s.resTopDept !== undefined) document.getElementById('resTopDept').value = s.resTopDept;
  if (s.resTendencia !== undefined) document.getElementById('resTendencia').value = s.resTendencia;
  if (s.resDiferencia !== undefined) document.getElementById('resDiferencia').value = s.resDiferencia;
  if (s.resFecha !== undefined) document.getElementById('resFecha').value = s.resFecha;
  if (s.resEscrutinio !== undefined) document.getElementById('resEscrutinio').value = s.resEscrutinio;
  if (s.resTickerMsgs !== undefined) document.getElementById('resTickerMsgs').value = s.resTickerMsgs;
  if (s.resultadosToggle !== undefined) document.getElementById('resultadosToggle').checked = s.resultadosToggle;
}

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
      totalVotes: parseInt(document.getElementById('resVotosA').value, 10) || 0,
    },
    candidateB: {
      name: document.getElementById('resNombreB').value,
      party: document.getElementById('resPartidoB').value,
      color: document.getElementById('resColorB').value,
      photo: resFotoBUrl,
      percent: parseFloat(document.getElementById('resPercentB').value) || 0,
      totalVotes: parseInt(document.getElementById('resVotosB').value, 10) || 0,
    },
    center: {
      participation: parseFloat(document.getElementById('resParticipacion').value) || 0,
      topDepartment: document.getElementById('resTopDept').value,
      tendency: document.getElementById('resTendencia').value,
      difference: parseFloat(document.getElementById('resDiferencia').value) || 0,
    },
    header: {
      logo: resLogoUrl,
      date: document.getElementById('resFecha').value,
      escrutinio: parseFloat(document.getElementById('resEscrutinio').value) || 0,
    },
    ticker: {
      messages: document
        .getElementById('resTickerMsgs')
        .value.split('\n')
        .filter((l) => l.trim()),
    },
  };
}

function resultadosUpdate() {
  emitGraphic({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData: leerResultadosData,
    toggleId: TOGGLE_ID,
    wrap: (accion, data) => ({ accion, data }),
  });
}

function resultadosEmit(accion) {
  emitGraphicNow({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData: leerResultadosData,
    toggleId: TOGGLE_ID,
    accion,
    wrap: (accion, data) => ({ accion, data }),
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
    btnNinguno.textContent = 'None';
    btnNinguno.style.cssText =
      'font-size:0.65rem;padding:2px 5px;border-radius:4px;border:2px solid #2a2a36;background:#1a1a24;color:#888;cursor:pointer;';
    if (!currentUrl) btnNinguno.style.borderColor = '#6af';
    btnNinguno.addEventListener('click', () => {
      container.querySelectorAll('button').forEach((b) => (b.style.borderColor = '#2a2a36'));
      btnNinguno.style.borderColor = '#6af';
      setResUrl(setter, null);
      resultadosUpdate();
    });
    container.appendChild(btnNinguno);
    for (const f of files) {
      const btn = document.createElement('button');
      btn.style.cssText =
        'width:36px;height:28px;border-radius:4px;border:2px solid #2a2a36;background:#0f0f13;cursor:pointer;overflow:hidden;padding:0;';
      btn.innerHTML = `<img src="${f.url}" style="width:100%;height:100%;object-fit:contain;">`;
      btn.dataset.url = f.url;
      btn.title = f.name;
      if (currentUrl === f.url) btn.style.borderColor = '#6af';
      btn.addEventListener('click', () => {
        container.querySelectorAll('button').forEach((b) => (b.style.borderColor = '#2a2a36'));
        btn.style.borderColor = '#6af';
        setResUrl(setter, f.url);
        resultadosUpdate();
      });
      container.appendChild(btn);
    }
  } catch {
    /* noop */
  }
}

export function initResultados() {
  loadSettings();

  window.addEventListener('storage', (e) => {
    if (e.key === SETTINGS_KEY && e.newValue) {
      loadSettings();
      const container = document.querySelector('[data-tab-content="resultados"]');
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
    'resNombreA', 'resPartidoA', 'resColorA', 'resPercentA', 'resVotosA',
    'resNombreB', 'resPartidoB', 'resColorB', 'resPercentB', 'resVotosB',
    'resParticipacion', 'resTopDept', 'resTendencia', 'resDiferencia',
    'resFecha', 'resEscrutinio', 'resTickerMsgs',
  ]) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.type === 'checkbox') el.addEventListener('change', debouncedSave);
    else el.addEventListener('input', debouncedSave);
  }
  document.getElementById('resultadosToggle')?.addEventListener('change', debouncedSave);

  document.getElementById('resultadosToggle')?.addEventListener('change', function () {
    resultadosEmit(this.checked ? 'SHOW' : 'HIDE');
  });

  for (const id of [
    'resNombreA',
    'resPartidoA',
    'resColorA',
    'resPercentA',
    'resVotosA',
    'resNombreB',
    'resPartidoB',
    'resColorB',
    'resPercentB',
    'resVotosB',
    'resParticipacion',
    'resTopDept',
    'resTendencia',
    'resDiferencia',
    'resFecha',
    'resEscrutinio',
    'resTickerMsgs',
  ]) {
    document.getElementById(id)?.addEventListener('input', resultadosUpdate);
  }

  setTimeout(() => {
    if (document.getElementById(TOGGLE_ID)?.checked) resultadosUpdate();
  }, 500);

  document.querySelector('[data-tab="resultados"]')?.addEventListener('click', () => {
    setTimeout(() => {
      cargarResPhotoPicker('res-fotoA-picker', 'A');
      cargarResPhotoPicker('res-fotoB-picker', 'B');
      cargarResPhotoPicker('res-logo-picker', 'logo');
      resultadosUpdate();
    }, 100);
  });
}
