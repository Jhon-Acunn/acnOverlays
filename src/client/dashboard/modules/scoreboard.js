import { loadJSON, saveJSON } from './storage.js';
import { colorWithOpacity, setVal, debounce } from './utils.js';
import { emitGraphic, emitGraphicNow } from './socket.js';

const STORAGE_KEY = 'scoreboard';
const SETTINGS_KEY = 'scoreboard_settings';
let scoreA = 0;
let scoreB = 0;

const TIPO = 'SCOREBOARD';
const TAB = 'scoreboard';
const PREVIEW_TIPO = 'PREVIEW_SCOREBOARD';
const TOGGLE_ID = 'scoreToggle';

function cargarScore() {
  const saved = loadJSON(STORAGE_KEY, null);
  if (saved && typeof saved.scoreA === 'number' && typeof saved.scoreB === 'number') {
    return saved;
  }
  return { scoreA: 0, scoreB: 0 };
}

function guardarScore() {
  saveJSON(STORAGE_KEY, { scoreA, scoreB });
}

function leerScoreEstilo() {
  const bgColor = document.getElementById('scBgColor').value || '#000000';
  const bgOpacity = parseInt(document.getElementById('scBgOpacity').value, 10) / 100 || 0.75;
  const teamABg = document.getElementById('scTeamABg').value || '#1e50c8';
  const teamAOpacity = parseInt(document.getElementById('scTeamAOpacity').value, 10) / 100 || 0.3;
  const teamBBg = document.getElementById('scTeamBBg').value || '#c83232';
  const teamBOpacity = parseInt(document.getElementById('scTeamBBg').value, 10) / 100 || 0.3;
  return {
    fontFamily: 'Inter, sans-serif',
    scoreSize: document.getElementById('scScoreSize').value + 'rem',
    teamSize: document.getElementById('scTeamSize').value + 'rem',
    scoreColor: document.getElementById('scScoreColor').value,
    teamColor: document.getElementById('scTeamColor').value,
    bgColor: colorWithOpacity(bgColor, bgOpacity),
    borderRadius: parseInt(document.getElementById('scRadius').value, 10) || 12,
    teamABg: colorWithOpacity(teamABg, teamAOpacity),
    teamBBg: colorWithOpacity(teamBBg, teamBOpacity),
    dividerColor: document.getElementById('scDividerColor').value,
    escala: 1.0,
    posY: parseInt(document.getElementById('scPosY').value, 10) || 40,
  };
}

function leerScoreData() {
  return {
    txtEquipoA: document.getElementById('nameA').value || 'LOCAL',
    puntosA: scoreA,
    txtEquipoB: document.getElementById('nameB').value || 'VISITANTE',
    puntosB: scoreB,
    estilo: leerScoreEstilo(),
  };
}

function scoreUpdate() {
  emitGraphic({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData: leerScoreData,
    toggleId: TOGGLE_ID,
  });
}

function scoreEmit(accion) {
  emitGraphicNow({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData: leerScoreData,
    toggleId: TOGGLE_ID,
    accion,
  });
}

function modificarScore(equipo, valor) {
  if (equipo === 'A') {
    scoreA = Math.max(0, scoreA + valor);
    document.getElementById('displayA').innerText = String(scoreA);
  }
  if (equipo === 'B') {
    scoreB = Math.max(0, scoreB + valor);
    document.getElementById('displayB').innerText = String(scoreB);
  }
  guardarScore();
  scoreEmit();
}

function resetearScore() {
  scoreA = 0;
  scoreB = 0;
  document.getElementById('displayA').innerText = '0';
  document.getElementById('displayB').innerText = '0';
  guardarScore();
  scoreEmit();
}

function saveSettings() {
  saveJSON(SETTINGS_KEY, {
    scScoreSize: document.getElementById('scScoreSize').value,
    scTeamSize: document.getElementById('scTeamSize').value,
    scScoreColor: document.getElementById('scScoreColor').value,
    scTeamColor: document.getElementById('scTeamColor').value,
    scBgColor: document.getElementById('scBgColor').value,
    scBgOpacity: document.getElementById('scBgOpacity').value,
    scRadius: document.getElementById('scRadius').value,
    scTeamABg: document.getElementById('scTeamABg').value,
    scTeamAOpacity: document.getElementById('scTeamAOpacity').value,
    scTeamBBg: document.getElementById('scTeamBBg').value,
    scTeamBOpacity: document.getElementById('scTeamBOpacity').value,
    scDividerColor: document.getElementById('scDividerColor').value,
    scPosY: document.getElementById('scPosY').value,
    nameA: document.getElementById('nameA').value,
    nameB: document.getElementById('nameB').value,
    scoreToggle: document.getElementById('scoreToggle')?.checked ?? false,
  });
}

function loadSettings() {
  const s = loadJSON(SETTINGS_KEY, {});
  if (s.scScoreSize !== undefined) document.getElementById('scScoreSize').value = s.scScoreSize;
  if (s.scTeamSize !== undefined) document.getElementById('scTeamSize').value = s.scTeamSize;
  if (s.scScoreColor !== undefined) document.getElementById('scScoreColor').value = s.scScoreColor;
  if (s.scTeamColor !== undefined) document.getElementById('scTeamColor').value = s.scTeamColor;
  if (s.scBgColor !== undefined) document.getElementById('scBgColor').value = s.scBgColor;
  if (s.scBgOpacity !== undefined) document.getElementById('scBgOpacity').value = s.scBgOpacity;
  if (s.scRadius !== undefined) document.getElementById('scRadius').value = s.scRadius;
  if (s.scTeamABg !== undefined) document.getElementById('scTeamABg').value = s.scTeamABg;
  if (s.scTeamAOpacity !== undefined) document.getElementById('scTeamAOpacity').value = s.scTeamAOpacity;
  if (s.scTeamBBg !== undefined) document.getElementById('scTeamBBg').value = s.scTeamBBg;
  if (s.scTeamBOpacity !== undefined) document.getElementById('scTeamBOpacity').value = s.scTeamBOpacity;
  if (s.scDividerColor !== undefined) document.getElementById('scDividerColor').value = s.scDividerColor;
  if (s.scPosY !== undefined) document.getElementById('scPosY').value = s.scPosY;
  if (s.nameA !== undefined) document.getElementById('nameA').value = s.nameA;
  if (s.nameB !== undefined) document.getElementById('nameB').value = s.nameB;
  if (s.scoreToggle !== undefined) document.getElementById('scoreToggle').checked = s.scoreToggle;
}

function actualizarValScore() {
  setVal('valScScoreSize', document.getElementById('scScoreSize').value + 'rem');
  setVal('valScTeamSize', document.getElementById('scTeamSize').value + 'rem');
  setVal('valScBgOpacity', document.getElementById('scBgOpacity').value + '%');
  setVal('valScRadius', document.getElementById('scRadius').value + 'px');
  setVal('valScTeamAOpacity', document.getElementById('scTeamAOpacity').value + '%');
  setVal('valScTeamBOpacity', document.getElementById('scTeamBOpacity').value + '%');
  setVal('valScPosY', document.getElementById('scPosY').value + 'px');
}

export function initScoreboard() {
  loadSettings();

  window.addEventListener('storage', (e) => {
    if (e.key === SETTINGS_KEY && e.newValue) {
      loadSettings();
    }
  });
  const loaded = cargarScore();
  scoreA = loaded.scoreA;
  scoreB = loaded.scoreB;
  document.getElementById('displayA').innerText = String(scoreA);
  document.getElementById('displayB').innerText = String(scoreB);

  const debouncedSave = debounce(saveSettings, 300);

  for (const id of [
    'scScoreSize', 'scTeamSize', 'scScoreColor', 'scTeamColor',
    'scBgColor', 'scBgOpacity', 'scRadius', 'scTeamABg', 'scTeamAOpacity',
    'scTeamBBg', 'scTeamBOpacity', 'scDividerColor', 'scPosY',
    'nameA', 'nameB',
  ]) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.type === 'checkbox') el.addEventListener('change', debouncedSave);
    else el.addEventListener('input', debouncedSave);
  }
  document.getElementById('scoreToggle')?.addEventListener('change', debouncedSave);

  document.getElementById('nameA')?.addEventListener('input', scoreUpdate);
  document.getElementById('nameB')?.addEventListener('input', scoreUpdate);

  document.getElementById('scoreToggle')?.addEventListener('change', function () {
    scoreEmit(this.checked ? 'SHOW' : 'HIDE');
  });

  for (const id of [
    'scScoreSize',
    'scTeamSize',
    'scScoreColor',
    'scTeamColor',
    'scBgColor',
    'scRadius',
    'scTeamABg',
    'scTeamBBg',
    'scDividerColor',
    'scPosY',
    'scBgOpacity',
    'scTeamAOpacity',
    'scTeamBOpacity',
  ]) {
    document.getElementById(id)?.addEventListener('input', () => {
      actualizarValScore();
      scoreUpdate();
    });
  }
  actualizarValScore();
  setTimeout(() => {
    if (document.getElementById(TOGGLE_ID)?.checked) scoreUpdate();
  }, 500);

  document.querySelectorAll('[data-score]').forEach((btn) => {
    btn.addEventListener('click', () => {
      modificarScore(btn.dataset.score, parseInt(btn.dataset.val, 10));
    });
  });
  document.querySelector('[data-reset-score]')?.addEventListener('click', resetearScore);

  document.getElementById('scResetStyle')?.addEventListener('click', () => {
    document.getElementById('scScoreSize').value = '3.5';
    document.getElementById('scTeamSize').value = '1.0';
    document.getElementById('scScoreColor').value = '#ffffff';
    document.getElementById('scTeamColor').value = '#aaaaaa';
    document.getElementById('scBgColor').value = '#000000';
    document.getElementById('scBgOpacity').value = '75';
    document.getElementById('scRadius').value = '12';
    document.getElementById('scTeamABg').value = '#1e50c8';
    document.getElementById('scTeamAOpacity').value = '30';
    document.getElementById('scTeamBBg').value = '#c83232';
    document.getElementById('scTeamBOpacity').value = '30';
    document.getElementById('scDividerColor').value = '#555555';
    document.getElementById('scPosY').value = '40';
    actualizarValScore();
    scoreUpdate();
  });
}
