import { hexToRgba, setVal, bindFontPicker, debounce } from './utils.js';
import { emitGraphic, emitGraphicNow } from './socket.js';
import { loadJSON, saveJSON } from './storage.js';

const TIPO = 'NOWPLAYING';
const TAB = 'nowplaying';
const PREVIEW_TIPO = 'PREVIEW_NOWPLAYING';
const TOGGLE_ID = 'nowplayingToggle';
const SETTINGS_KEY = 'nowplaying_settings';

function saveSettings() {
  saveJSON(SETTINGS_KEY, {
    npSong: document.getElementById('npSong').value,
    npArtist: document.getElementById('npArtist').value,
    npCoverUrl: document.getElementById('npCoverUrl').value,
    npBarText: document.getElementById('npBarText').value,
    npBarBg: document.getElementById('npBarBg').value,
    npBarColor: document.getElementById('npBarColor').value,
    npFont: document.getElementById('npFont').value,
    npSongSize: document.getElementById('npSongSize').value,
    npSongColor: document.getElementById('npSongColor').value,
    npArtistSize: document.getElementById('npArtistSize').value,
    npArtistColor: document.getElementById('npArtistColor').value,
    npBgColor: document.getElementById('npBgColor').value,
    npOpacity: document.getElementById('npOpacity').value,
    npPosX: document.getElementById('npPosX').value,
    npPosY: document.getElementById('npPosY').value,
    nowplayingToggle: document.getElementById('nowplayingToggle')?.checked ?? false,
  });
}

function loadSettings() {
  const s = loadJSON(SETTINGS_KEY, {});
  if (s.npSong !== undefined) document.getElementById('npSong').value = s.npSong;
  if (s.npArtist !== undefined) document.getElementById('npArtist').value = s.npArtist;
  if (s.npCoverUrl !== undefined) document.getElementById('npCoverUrl').value = s.npCoverUrl;
  if (s.npBarText !== undefined) document.getElementById('npBarText').value = s.npBarText;
  if (s.npBarBg !== undefined) document.getElementById('npBarBg').value = s.npBarBg;
  if (s.npBarColor !== undefined) document.getElementById('npBarColor').value = s.npBarColor;
  if (s.npFont !== undefined) document.getElementById('npFont').value = s.npFont;
  if (s.npSongSize !== undefined) document.getElementById('npSongSize').value = s.npSongSize;
  if (s.npSongColor !== undefined) document.getElementById('npSongColor').value = s.npSongColor;
  if (s.npArtistSize !== undefined) document.getElementById('npArtistSize').value = s.npArtistSize;
  if (s.npArtistColor !== undefined) document.getElementById('npArtistColor').value = s.npArtistColor;
  if (s.npBgColor !== undefined) document.getElementById('npBgColor').value = s.npBgColor;
  if (s.npOpacity !== undefined) document.getElementById('npOpacity').value = s.npOpacity;
  if (s.npPosX !== undefined) document.getElementById('npPosX').value = s.npPosX;
  if (s.npPosY !== undefined) document.getElementById('npPosY').value = s.npPosY;
  if (s.nowplayingToggle !== undefined) document.getElementById('nowplayingToggle').checked = s.nowplayingToggle;
}

function leerNowPlayingData() {
  return {
    song: document.getElementById('npSong').value || '',
    artist: document.getElementById('npArtist').value || '',
    coverUrl: document.getElementById('npCoverUrl').value || null,
    estilo: {
      fontFamily: document.getElementById('npFont').value || 'Inter, sans-serif',
      barText: document.getElementById('npBarText').value || 'NOW PLAYING',
      barBg: document.getElementById('npBarBg').value,
      barColor: document.getElementById('npBarColor').value,
      songSize: document.getElementById('npSongSize').value + 'rem',
      songColor: document.getElementById('npSongColor').value,
      artistSize: document.getElementById('npArtistSize').value + 'rem',
      artistColor: document.getElementById('npArtistColor').value,
      bgColor: hexToRgba(
        document.getElementById('npBgColor').value,
        parseFloat(document.getElementById('npOpacity').value) || 0.65
      ),
      opacity: parseFloat(document.getElementById('npOpacity').value) || 0.65,
      posX: parseInt(document.getElementById('npPosX').value, 10) || 32,
      posY: parseInt(document.getElementById('npPosY').value, 10) || 96,
    },
  };
}

function nowPlayingUpdate() {
  emitGraphic({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData: leerNowPlayingData,
    toggleId: TOGGLE_ID,
  });
}

function nowPlayingEmit(accion) {
  emitGraphicNow({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData: leerNowPlayingData,
    toggleId: TOGGLE_ID,
    accion,
  });
}

function actualizarValoresNP() {
  setVal('valNpOpacity', document.getElementById('npOpacity').value);
  setVal('valNpSongSize', document.getElementById('npSongSize').value + 'rem');
  setVal('valNpArtistSize', document.getElementById('npArtistSize').value + 'rem');
  setVal('valNpPosX', document.getElementById('npPosX').value + 'px');
  setVal('valNpPosY', document.getElementById('npPosY').value + 'px');
}

export function initNowPlaying() {
  loadSettings();

  window.addEventListener('storage', (e) => {
    if (e.key === SETTINGS_KEY && e.newValue) {
      loadSettings();
      const container = document.querySelector('[data-tab-content="nowplaying"]');
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
    'npSong', 'npArtist', 'npCoverUrl', 'npBarText',
    'npBarBg', 'npBarColor', 'npFont',
    'npSongSize', 'npSongColor', 'npArtistSize', 'npArtistColor',
    'npBgColor', 'npOpacity', 'npPosX', 'npPosY',
  ]) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.type === 'checkbox') el.addEventListener('change', debouncedSave);
    else el.addEventListener('input', debouncedSave);
  }
  document.getElementById('nowplayingToggle')?.addEventListener('change', debouncedSave);

  document.getElementById('nowplayingToggle')?.addEventListener('change', function () {
    nowPlayingEmit(this.checked ? 'SHOW' : 'HIDE');
  });
  ['npSong', 'npArtist', 'npCoverUrl', 'npBarText'].forEach((id) =>
    document.getElementById(id)?.addEventListener('input', nowPlayingUpdate)
  );
  ['npOpacity', 'npSongSize', 'npArtistSize', 'npPosX', 'npPosY'].forEach((id) =>
    document.getElementById(id)?.addEventListener('input', () => {
      actualizarValoresNP();
      nowPlayingUpdate();
    })
  );
  ['npBarBg', 'npBarColor', 'npSongColor', 'npArtistColor', 'npBgColor', 'npFont'].forEach((id) =>
    document.getElementById(id)?.addEventListener('input', nowPlayingUpdate)
  );
  bindFontPicker('npFontDropdownBtn', 'npFont');
  setTimeout(() => {
    if (document.getElementById(TOGGLE_ID)?.checked) nowPlayingUpdate();
  }, 500);
  document.getElementById('npResetStyle')?.addEventListener('click', () => {
    document.getElementById('npFont').value = 'Inter, sans-serif';
    document.getElementById('npBarText').value = 'NOW PLAYING';
    document.getElementById('npBarBg').value = '#1db954';
    document.getElementById('npBarColor').value = '#ffffff';
    document.getElementById('npSongSize').value = '1.0';
    document.getElementById('npArtistSize').value = '0.75';
    document.getElementById('npSongColor').value = '#ffffff';
    document.getElementById('npArtistColor').value = '#aaaaaa';
    document.getElementById('npBgColor').value = '#000000';
    document.getElementById('npOpacity').value = '0.65';
    document.getElementById('npPosX').value = '32';
    document.getElementById('npPosY').value = '96';
    actualizarValoresNP();
    nowPlayingUpdate();
  });
  actualizarValoresNP();
}
