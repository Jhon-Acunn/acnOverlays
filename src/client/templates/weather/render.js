import { io } from 'socket.io-client';
import gsap from 'gsap';

const isPreview = window.location.search.includes('preview=1');
const WEATHER_API = 'https://wttr.in';

let weatherInterval = null;
let weatherTimeline = null;
let weatherVisible = false;
let weatherCurrentData = {};

// ── Weather data fetch ──

async function fetchWeather(city, country) {
  if (!city) return null;
  try {
    const url = `${WEATHER_API}/${encodeURIComponent(city)}?format=j1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const cc = json.current_condition?.[0];
    const area = json.nearest_area?.[0];
    if (!cc) return null;
    return {
      city: area?.areaName?.[0]?.value || city,
      country: area?.country?.[0]?.value || country || '',
      temp: cc.temp_C || '--',
      desc: cc.weatherDesc?.[0]?.value || '',
      code: cc.weatherCode || '',
      humidity: cc.humidity || '',
    };
  } catch {
    return null;
  }
}

// ── Weather icon from code ──

function weatherEmoji(code) {
  const map = {
    '113': '☀️', '116': '⛅', '119': '☁️', '122': '☁️',
    '143': '🌫️', '176': '🌦️', '179': '🌧️', '182': '🌧️',
    '185': '🌧️', '200': '⛈️', '227': '🌨️', '230': '🌨️',
    '248': '🌫️', '260': '🌫️', '263': '🌦️', '266': '🌦️',
    '281': '🌧️', '284': '🌧️', '293': '🌦️', '296': '🌦️',
    '299': '🌧️', '302': '🌧️', '305': '🌧️', '308': '🌧️',
    '311': '🌧️', '314': '🌧️', '317': '🌧️', '320': '🌨️',
    '323': '🌨️', '326': '🌨️', '329': '❄️', '332': '❄️',
    '335': '❄️', '338': '❄️', '350': '🧊', '353': '🌦️',
    '356': '🌧️', '359': '🌧️', '362': '🌧️', '365': '🌧️',
    '368': '🌨️', '371': '❄️', '374': '🌧️', '377': '🌧️',
    '386': '⛈️', '389': '⛈️', '392': '⛈️', '395': '❄️',
  };
  return map[code] || '🌡️';
}

// ── Style application ──

function aplicarEstiloWeather(estilo) {
  if (!estilo) return;
  const root = document.documentElement;
  const container = document.getElementById('weather-container');
  if (estilo.fontFamily) container.style.fontFamily = estilo.fontFamily;
  if (estilo.fontSizeCountry) document.getElementById('weather-country').style.fontSize = estilo.fontSizeCountry;
  if (estilo.fontSizeCity) document.getElementById('weather-city').style.fontSize = estilo.fontSizeCity;
  if (estilo.fontSizeTemp) document.getElementById('weather-temp').style.fontSize = estilo.fontSizeTemp;
  if (estilo.textColor) {
    container.style.color = estilo.textColor;
    document.getElementById('weather-city').style.color = estilo.textColor;
    document.getElementById('weather-temp').style.color = estilo.textColor;
  }
  if (estilo.countryColor) document.getElementById('weather-country').style.color = estilo.countryColor;
  if (estilo.bgColor) container.style.background = estilo.bgColor;
  if (estilo.borderRadius) container.style.borderRadius = estilo.borderRadius + 'px';
  if (estilo.opacity !== undefined) container.style.opacity = estilo.opacity;
  if (estilo.posX !== undefined) container.style.left = estilo.posX + 'px';
  if (estilo.posY !== undefined) container.style.top = estilo.posY + 'px';
  if (estilo.showIcon !== undefined) {
    document.getElementById('weather-icon').style.display = estilo.showIcon ? '' : 'none';
  }
  if (estilo.showCountry !== undefined) {
    document.getElementById('weather-country').style.display = estilo.showCountry ? '' : 'none';
  }
}

// ── UI Update ──

function actualizarWeatherUI(data, estilo) {
  if (!data) return;
  weatherCurrentData = data;
  document.getElementById('weather-country').textContent = data.country || '';
  document.getElementById('weather-city').textContent = data.city || '--';
  document.getElementById('weather-temp').textContent = data.temp ? `${data.temp}°C` : '--';
  document.getElementById('weather-icon').textContent = weatherEmoji(data.code);
  if (estilo) aplicarEstiloWeather(estilo);
}

// ── Periodic refresh ──

function iniciarRefreshWeather(city, country, intervalMs, estilo) {
  detenerRefreshWeather();
  if (!city) return;
  weatherInterval = setInterval(async () => {
    const data = await fetchWeather(city, country);
    if (data) actualizarWeatherUI(data, estilo);
  }, intervalMs || 600000); // default 10 min
}

function detenerRefreshWeather() {
  if (weatherInterval) {
    clearInterval(weatherInterval);
    weatherInterval = null;
  }
}

// ── Entry animation ──

function animEntradaWeather() {
  const container = document.getElementById('weather-container');
  container.style.display = 'flex';
  if (weatherTimeline) weatherTimeline.kill();
  gsap.set(container, { opacity: 0, scale: 0.9 });
  weatherTimeline = gsap.timeline()
    .to(container, { duration: 0.4, opacity: 1, scale: 1, ease: 'power3.out' });
  weatherVisible = true;
}

function animSalidaWeather() {
  const container = document.getElementById('weather-container');
  if (weatherTimeline) weatherTimeline.kill();
  weatherTimeline = gsap.timeline({
    onComplete: () => {
      container.style.display = 'none';
      gsap.set(container, { clearProps: 'opacity,transform' });
      weatherVisible = false;
    }
  })
    .to(container, { duration: 0.3, opacity: 0, scale: 0.9, ease: 'power2.in' });
}

// ── Main show/handle ──

async function mostrarWeather(cfg) {
  const { city, country, refreshInterval, estilo } = cfg;
  if (!city) return;
  detenerRefreshWeather();
  const data = await fetchWeather(city, country);
  if (data) actualizarWeatherUI(data, estilo);
  else {
    // Show with city name only if fetch fails
    document.getElementById('weather-country').textContent = country || '';
    document.getElementById('weather-city').textContent = city;
    document.getElementById('weather-temp').textContent = '--';
    document.getElementById('weather-icon').textContent = '🌡️';
    if (estilo) aplicarEstiloWeather(estilo);
  }
  animEntradaWeather();
  iniciarRefreshWeather(city, country, refreshInterval, estilo);
}

function ocultarWeather() {
  detenerRefreshWeather();
  animSalidaWeather();
}

// ── Preview via postMessage ──

if (isPreview) {
  window.addEventListener('message', (e) => {
    if (e.source !== window.parent) return;
    try {
      const msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (!msg || !msg.tipo) return;
      if (msg.tipo === 'PREVIEW_WEATHER') {
        const { city, country, refreshInterval, estilo } = msg.data || {};
        document.getElementById('weather-container').style.display = 'none';
        gsap.set(document.getElementById('weather-container'), { clearProps: 'all' });
        mostrarWeather({ city, country, refreshInterval, estilo });
      }
    } catch (_) { /* ignore */ }
  });

  // Demo preview on load
  mostrarWeather({
    city: 'Lima',
    country: 'Perú',
    refreshInterval: 600000,
    estilo: {
      fontFamily: 'Inter, sans-serif',
      fontSizeCountry: '0.7rem',
      fontSizeCity: '1.2rem',
      fontSizeTemp: '1.8rem',
      textColor: '#ffffff',
      countryColor: 'rgba(255,255,255,0.55)',
      bgColor: 'rgba(0,0,0,0.65)',
      borderRadius: 12,
      opacity: 1,
      posX: 32,
      posY: 32,
      showIcon: true,
      showCountry: true,
    }
  });
}

// ── Socket (OBS mode) ──

if (!isPreview) {
  const socket = io({
    reconnectionDelay: 1000,
    reconnectionAttempts: 10
  });

  socket.on('connect_error', (err) => {
    console.error('[SOCKET WEATHER] Error:', err.message);
  });

  socket.on('render-graphic', async (payload) => {
    try {
      if (!payload || payload.tipo !== 'WEATHER') return;
      const { accion, city, country, refreshInterval, estilo } = payload.data || {};
      if (accion === 'SHOW') {
        await mostrarWeather({ city, country, refreshInterval, estilo });
      } else if (accion === 'HIDE') {
        ocultarWeather();
      } else if (accion === 'UPDATE' && weatherVisible) {
        const data = await fetchWeather(city, country);
        if (data) actualizarWeatherUI(data, estilo);
        if (refreshInterval) {
          iniciarRefreshWeather(city, country, refreshInterval, estilo);
        }
      }
    } catch (err) {
      console.error('[RENDER WEATHER] Error:', err);
    }
  });
}
