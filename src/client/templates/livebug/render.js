import { io } from 'socket.io-client';
import { getAuthToken } from '../../shared/auth-token.js';
import { SOCKET_OPTIONS } from '../../shared/socket-options.js';
import gsap from 'gsap';

const WEATHER_API = 'https://wttr.in';

let timeline = null;
let visible = false;
let tempInterval = null;
let currentCity = '';

function aplicarEstilo(estilo) {
  if (!estilo) return;

  const body = document.body;
  const lugarEl = document.getElementById('lt-lugar');
  const ciudadTempEl = document.getElementById('lt-ciudad-temp');
  const inner = document.getElementById('lt-inner');
  const container = document.getElementById('lt-container');

  if (estilo.fontFamily) body.style.fontFamily = estilo.fontFamily;
  if (estilo.titleFontSize) lugarEl.style.fontSize = estilo.titleFontSize;
  if (estilo.titleColor) lugarEl.style.color = estilo.titleColor;
  if (estilo.titleBg) document.getElementById('lt-name-box').style.background = estilo.titleBg;
  if (estilo.subtitleFontSize) ciudadTempEl.style.fontSize = estilo.subtitleFontSize;
  if (estilo.subtitleColor) ciudadTempEl.style.color = estilo.subtitleColor;
  if (estilo.subtitleBg) {
    document.getElementById('lt-title-box').style.background = estilo.subtitleBg;
    document.getElementById('lt-name-ghost').style.background = estilo.subtitleBg;
  }
  if (estilo.escala) inner.style.transform = 'scale(' + estilo.escala + ')';
  if (estilo.posX !== undefined) container.style.left = estilo.posX + 'px';
  if (estilo.posY !== undefined) container.style.top = estilo.posY + 'px';
}

async function fetchTemp(ciudad) {
  if (!ciudad) return null;
  try {
    const url = `${WEATHER_API}/${encodeURIComponent(ciudad)}?format=j1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const cc = json.current_condition?.[0];
    if (!cc) return null;
    return cc.temp_C || null;
  } catch {
    return null;
  }
}

function renderCiudadTemp(ciudad, temp) {
  const t = temp != null ? `${temp}°C` : '--°C';
  document.getElementById('lt-ciudad-temp').textContent = `${(ciudad || '').toUpperCase()} ${t}`;
}

function updateData(data) {
  if (!data) return;
  const { lugar, ciudad, refreshInterval, estilo } = data;
  if (lugar !== undefined)
    document.getElementById('lt-lugar').textContent = (lugar || '').toUpperCase();
  if (estilo) aplicarEstilo(estilo);
  if (ciudad !== undefined && ciudad !== currentCity) {
    currentCity = ciudad;
    if (tempInterval) {
      clearInterval(tempInterval);
      tempInterval = null;
    }
    if (ciudad) {
      fetchTemp(ciudad).then((t) => renderCiudadTemp(ciudad, t));
      tempInterval = setInterval(() => {
        fetchTemp(currentCity).then((t) => renderCiudadTemp(currentCity, t));
      }, refreshInterval || 1800000);
    } else {
      renderCiudadTemp('', null);
    }
  } else if (ciudad !== undefined && refreshInterval) {
    if (tempInterval) {
      clearInterval(tempInterval);
      tempInterval = null;
    }
    if (currentCity) {
      tempInterval = setInterval(() => {
        fetchTemp(currentCity).then((t) => renderCiudadTemp(currentCity, t));
      }, refreshInterval);
    }
  }
}

function showDefault() {
  updateData({
    lugar: 'C.C VIVA',
    ciudad: 'TUNJA',
    refreshInterval: 1800000,
    estilo: {
      fontFamily: 'Montserrat, sans-serif',
      titleFontSize: '3.0rem',
      subtitleFontSize: '2.5rem',
      titleColor: '#ffffff',
      titleBg: '#06155A',
      subtitleColor: '#111111',
      subtitleBg: '#ffffff',
      escala: 1.0,
      posX: 100,
      posY: 32,
    },
  });
  animarEntrada();
}

function animarEntrada() {
  if (timeline) timeline.kill();

  const container = document.getElementById('lt-container');
  container.style.display = 'block';
  visible = true;

  // Reset state cleanly before entry so the next SHOW always starts fresh
  gsap.set('#lt-name-group', { clearProps: 'xPercent', xPercent: -110 });
  gsap.set('#lt-name-ghost', { clearProps: 'transform', scaleX: 0, transformOrigin: 'left' });
  gsap.set('#lt-name-text', { clearProps: 'opacity', opacity: 0 });
  gsap.set('#lt-title-box', { clearProps: 'transform', scaleY: 0, transformOrigin: 'top' });

  timeline = gsap.timeline();

  // name-group: 1.0s, power4.out
  timeline.to('#lt-name-group', {
    duration: 1.0,
    xPercent: 0,
    ease: 'power4.out',
  }, 0);

  // ghost: 0.4s, power3.out, started 0.5s into name-group animation
  timeline.to(
    '#lt-name-ghost',
    {
      duration: 0.4,
      scaleX: 1,
      ease: 'power3.out',
      transformOrigin: 'left',
    },
    '-=0.5'
  );

  // name-text: 0.35s, power2.out, started 0.35s into ghost animation
  timeline.to(
    '#lt-name-text',
    {
      duration: 0.35,
      opacity: 1,
      ease: 'power2.out',
    },
    '-=0.35'
  );

  // title-box: 0.55s, back.out(1.6), started 0.2s into name-text animation
  timeline.to(
    '#lt-title-box',
    {
      duration: 0.55,
      scaleY: 1,
      ease: 'back.out(1.6)',
      transformOrigin: 'top',
    },
    '-=0.2'
  );
}

function animarSalida() {
  if (timeline) timeline.kill();

  timeline = gsap.timeline({
    onComplete: () => {
      const container = document.getElementById('lt-container');
      container.style.display = 'none';
      visible = false;
      // Reset all transforms so the next SHOW starts fresh
      gsap.set('#lt-name-group', { clearProps: 'xPercent' });
      gsap.set('#lt-name-ghost', { clearProps: 'transform' });
      gsap.set('#lt-title-box', { clearProps: 'transform' });
      gsap.set('#lt-name-text', { clearProps: 'opacity' });
    },
  });

  // title-box collapses first
  timeline.to('#lt-title-box', {
    duration: 0.25,
    scaleY: 0,
    ease: 'power2.in',
    transformOrigin: 'top',
  }, 0);

  // name-text fades out 0.1s into title-box exit
  timeline.to(
    '#lt-name-text',
    {
      duration: 0.2,
      opacity: 0,
      ease: 'power2.in',
    },
    '-=0.1'
  );

  // name-group slides out 0.1s into name-text exit
  timeline.to(
    '#lt-name-group',
    {
      duration: 0.55,
      xPercent: -110,
      ease: 'power3.in',
    },
    '-=0.1'
  );
}

function handlePayload(payload) {
  try {
    if (!payload || payload.tipo !== 'LIVEBUG') return;
    if (!payload.data || typeof payload.data !== 'object') return;

    const { accion } = payload.data;

    if (accion === 'SHOW') {
      updateData(payload.data);
      if (!visible) animarEntrada();
    } else if (accion === 'HIDE') {
      animarSalida();
    } else if (accion === 'UPDATE') {
      if (!visible) return;
      updateData(payload.data);
    } else if (accion === 'REFRESH_TEMP') {
      if (currentCity) {
        fetchTemp(currentCity).then((t) => renderCiudadTemp(currentCity, t));
      }
    }
  } catch (err) {
    console.error('[RENDER LIVEBUG] Error:', err);
  }
}

showDefault();

getAuthToken().then((token) => {
  const socket = io({ ...SOCKET_OPTIONS, auth: { token } });
  socket.on('connect_error', (err) => {
    console.error('[SOCKET LIVEBUG] Error:', err.message);
  });

  socket.on('render-graphic', handlePayload);
});
