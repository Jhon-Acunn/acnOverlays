import { hexToRgba, setVal, bindFontPicker, debounce } from './utils.js';
import { emitGraphic, emitGraphicNow } from './socket.js';
import { loadJSON, saveJSON, SERVER_SETTINGS_EVENT } from './storage.js';

const TIPO = 'WEATHER';
const TAB = 'weather';
const PREVIEW_TIPO = 'PREVIEW_WEATHER';
const TOGGLE_ID = 'weatherToggle';
const SETTINGS_KEY = 'weather_settings';

function saveSettings() {
  saveJSON(SETTINGS_KEY, {
    weatherCity: document.getElementById('weatherCity').value,
    weatherCountry: document.getElementById('weatherCountry').value,
    weatherRefresh: document.getElementById('weatherRefresh').value,
    weatherFont: document.getElementById('weatherFont').value,
    weatherTextColor: document.getElementById('weatherTextColor').value,
    weatherCountryColor: document.getElementById('weatherCountryColor').value,
    weatherBgColor: document.getElementById('weatherBgColor').value,
    weatherOpacity: document.getElementById('weatherOpacity').value,
    weatherPosX: document.getElementById('weatherPosX').value,
    weatherPosY: document.getElementById('weatherPosY').value,
    weatherSizeCountry: document.getElementById('weatherSizeCountry').value,
    weatherSizeCity: document.getElementById('weatherSizeCity').value,
    weatherSizeTemp: document.getElementById('weatherSizeTemp').value,
    weatherToggle: document.getElementById('weatherToggle')?.checked ?? false,
    weatherShowIcon: document.getElementById('weatherShowIcon')?.checked ?? true,
    weatherShowCountry: document.getElementById('weatherShowCountry')?.checked ?? true,
  });
}

function loadSettings() {
  const s = loadJSON(SETTINGS_KEY, {});
  if (s.weatherCity !== undefined) document.getElementById('weatherCity').value = s.weatherCity;
  if (s.weatherCountry !== undefined) document.getElementById('weatherCountry').value = s.weatherCountry;
  if (s.weatherRefresh !== undefined) document.getElementById('weatherRefresh').value = s.weatherRefresh;
  if (s.weatherFont !== undefined) document.getElementById('weatherFont').value = s.weatherFont;
  if (s.weatherTextColor !== undefined) document.getElementById('weatherTextColor').value = s.weatherTextColor;
  if (s.weatherCountryColor !== undefined) document.getElementById('weatherCountryColor').value = s.weatherCountryColor;
  if (s.weatherBgColor !== undefined) document.getElementById('weatherBgColor').value = s.weatherBgColor;
  if (s.weatherOpacity !== undefined) document.getElementById('weatherOpacity').value = s.weatherOpacity;
  if (s.weatherPosX !== undefined) document.getElementById('weatherPosX').value = s.weatherPosX;
  if (s.weatherPosY !== undefined) document.getElementById('weatherPosY').value = s.weatherPosY;
  if (s.weatherSizeCountry !== undefined) document.getElementById('weatherSizeCountry').value = s.weatherSizeCountry;
  if (s.weatherSizeCity !== undefined) document.getElementById('weatherSizeCity').value = s.weatherSizeCity;
  if (s.weatherSizeTemp !== undefined) document.getElementById('weatherSizeTemp').value = s.weatherSizeTemp;
  if (s.weatherToggle !== undefined) document.getElementById('weatherToggle').checked = s.weatherToggle;
  if (s.weatherShowIcon !== undefined) document.getElementById('weatherShowIcon').checked = s.weatherShowIcon;
  if (s.weatherShowCountry !== undefined) document.getElementById('weatherShowCountry').checked = s.weatherShowCountry;
}

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
  loadSettings();

  window.addEventListener('storage', (e) => {
    if (e.key === SETTINGS_KEY && e.newValue) {
      loadSettings();
      const container = document.querySelector('[data-tab-content="weather"]');
      if (container) {
        container.querySelectorAll('input, select, textarea').forEach(el => {
          const eventType = el.type === 'checkbox' ? 'change' : 'input';
          el.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
      }
    }
  });

  window.addEventListener(SERVER_SETTINGS_EVENT, (e) => {
    if (e.detail && e.detail.key === SETTINGS_KEY) {
      loadSettings();
      const container = document.querySelector('[data-tab-content="weather"]');
      if (container) {
        container.querySelectorAll('input, select, textarea').forEach(el => {
          const eventType = el.type === 'checkbox' ? 'change' : 'input';
          el.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
      }
    }
  });

  const debouncedSave = debounce(saveSettings, 300);

  for (const id of [
    'weatherCity', 'weatherCountry', 'weatherRefresh',
    'weatherFont', 'weatherTextColor', 'weatherCountryColor', 'weatherBgColor',
    'weatherOpacity', 'weatherPosX', 'weatherPosY',
    'weatherSizeCountry', 'weatherSizeCity', 'weatherSizeTemp',
  ]) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.type === 'checkbox') el.addEventListener('change', debouncedSave);
    else el.addEventListener('input', debouncedSave);
  }
  document.getElementById('weatherToggle')?.addEventListener('change', debouncedSave);
  document.getElementById('weatherShowIcon')?.addEventListener('change', debouncedSave);
  document.getElementById('weatherShowCountry')?.addEventListener('change', debouncedSave);

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
  ['weatherTextColor', 'weatherCountryColor', 'weatherBgColor', 'weatherFont'].forEach((id) =>
    document.getElementById(id)?.addEventListener('input', weatherUpdate)
  );
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
