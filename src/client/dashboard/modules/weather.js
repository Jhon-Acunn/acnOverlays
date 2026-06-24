import { hexToRgba, setVal, bindFontPicker } from './utils.js';
import { emitGraphic, emitGraphicNow } from './socket.js';

const TIPO = 'WEATHER';
const TAB = 'weather';
const PREVIEW_TIPO = 'PREVIEW_WEATHER';
const TOGGLE_ID = 'weatherToggle';

function leerWeatherData() {
  return {
    city: document.getElementById('weatherCity').value || 'Lima',
    country: document.getElementById('weatherCountry').value || '',
    refreshInterval: parseInt(document.getElementById('weatherRefresh').value, 10) * 1000,
    estilo: {
      fontFamily: document.getElementById('weatherFont').value || 'Inter, sans-serif',
      textColor: document.getElementById('weatherTextColor').value,
      countryColor: document.getElementById('weatherCountryColor').value,
      bgColor: hexToRgba(
        document.getElementById('weatherBgColor').value,
        parseFloat(document.getElementById('weatherOpacity').value) || 0.65
      ),
      opacity: parseFloat(document.getElementById('weatherOpacity').value) || 0.65,
      posX: parseInt(document.getElementById('weatherPosX').value, 10) || 32,
      posY: parseInt(document.getElementById('weatherPosY').value, 10) || 32,
      fontSizeCountry: document.getElementById('weatherSizeCountry').value + 'rem',
      fontSizeCity: document.getElementById('weatherSizeCity').value + 'rem',
      fontSizeTemp: document.getElementById('weatherSizeTemp').value + 'rem',
      showIcon: document.getElementById('weatherShowIcon').checked,
      showCountry: document.getElementById('weatherShowCountry').checked,
    },
  };
}

function weatherUpdate() {
  emitGraphic({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData: leerWeatherData,
    toggleId: TOGGLE_ID,
  });
}

function weatherEmit(accion) {
  emitGraphicNow({
    tipo: TIPO,
    tab: TAB,
    previewTipo: PREVIEW_TIPO,
    getData: leerWeatherData,
    toggleId: TOGGLE_ID,
    accion,
  });
}

function actualizarValoresWeather() {
  setVal(
    'valWeatherRefresh',
    (parseInt(document.getElementById('weatherRefresh').value, 10) / 60).toFixed(0) + ' min'
  );
  setVal('valWeatherOpacity', document.getElementById('weatherOpacity').value);
  setVal('valWeatherPosX', document.getElementById('weatherPosX').value + 'px');
  setVal('valWeatherPosY', document.getElementById('weatherPosY').value + 'px');
  setVal('valWeatherSizeCountry', document.getElementById('weatherSizeCountry').value + 'rem');
  setVal('valWeatherSizeCity', document.getElementById('weatherSizeCity').value + 'rem');
  setVal('valWeatherSizeTemp', document.getElementById('weatherSizeTemp').value + 'rem');
}

export function initWeather() {
  document.getElementById('weatherToggle')?.addEventListener('change', function () {
    weatherEmit(this.checked ? 'SHOW' : 'HIDE');
  });
  ['weatherCity', 'weatherCountry'].forEach((id) =>
    document.getElementById(id)?.addEventListener('input', weatherUpdate)
  );
  [
    'weatherRefresh',
    'weatherOpacity',
    'weatherPosX',
    'weatherPosY',
    'weatherSizeCountry',
    'weatherSizeCity',
    'weatherSizeTemp',
  ].forEach((id) =>
    document.getElementById(id)?.addEventListener('input', () => {
      actualizarValoresWeather();
      weatherUpdate();
    })
  );
  [
    'weatherTextColor',
    'weatherCountryColor',
    'weatherBgColor',
    'weatherFont',
  ].forEach((id) => document.getElementById(id)?.addEventListener('input', weatherUpdate));
  document.getElementById('weatherShowIcon')?.addEventListener('change', weatherUpdate);
  document.getElementById('weatherShowCountry')?.addEventListener('change', weatherUpdate);

  bindFontPicker('weatherFontDropdownBtn', 'weatherFont');
  setTimeout(() => {
    if (document.getElementById(TOGGLE_ID)?.checked) weatherUpdate();
  }, 500);

  document.getElementById('weatherResetStyle')?.addEventListener('click', () => {
    document.getElementById('weatherFont').value = 'Inter, sans-serif';
    document.getElementById('weatherTextColor').value = '#ffffff';
    document.getElementById('weatherCountryColor').value = '#8ab4f8';
    document.getElementById('weatherBgColor').value = '#000000';
    document.getElementById('weatherOpacity').value = '0.65';
    document.getElementById('weatherPosX').value = '32';
    document.getElementById('weatherPosY').value = '32';
    document.getElementById('weatherSizeCountry').value = '0.7';
    document.getElementById('weatherSizeCity').value = '1.2';
    document.getElementById('weatherSizeTemp').value = '1.8';
    document.getElementById('weatherShowIcon').checked = true;
    document.getElementById('weatherShowCountry').checked = true;
    actualizarValoresWeather();
    weatherUpdate();
  });
  actualizarValoresWeather();
}
