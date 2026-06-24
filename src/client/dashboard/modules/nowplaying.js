import { hexToRgba, setVal, bindFontPicker } from './utils.js';
import { emitGraphic, emitGraphicNow } from './socket.js';

const TIPO = 'NOWPLAYING';
const TAB = 'nowplaying';
const PREVIEW_TIPO = 'PREVIEW_NOWPLAYING';
const TOGGLE_ID = 'nowplayingToggle';

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
