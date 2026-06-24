import { io } from 'socket.io-client';
import { getAuthToken } from '../../shared/auth-token.js';
import { SOCKET_OPTIONS } from '../../shared/socket-options.js';
import gsap from 'gsap';

let timeline = null;
let visible = false;

function aplicarEstilo(estilo) {
  if (!estilo) return;

  const body = document.body;
  const nombreEl = document.getElementById('lt-nombre');
  const apellidoEl = document.getElementById('lt-apellido');
  const cargoEl = document.getElementById('lt-cargo');
  const inner = document.getElementById('lt-inner');
  const container = document.getElementById('lt-container');

  if (estilo.fontFamily) body.style.fontFamily = estilo.fontFamily;
  if (estilo.titleFontSize) {
    nombreEl.style.fontSize = estilo.titleFontSize;
    apellidoEl.style.fontSize = estilo.titleFontSize;
  }
  if (estilo.titleColor) {
    nombreEl.style.color = estilo.titleColor;
    apellidoEl.style.color = estilo.titleColor;
  }
  if (estilo.titleBg) document.getElementById('lt-name-box').style.background = estilo.titleBg;
  if (estilo.subtitleFontSize) cargoEl.style.fontSize = estilo.subtitleFontSize;
  if (estilo.subtitleColor) cargoEl.style.color = estilo.subtitleColor;
  if (estilo.subtitleBg) {
    document.getElementById('lt-title-box').style.background = estilo.subtitleBg;
    document.getElementById('lt-name-ghost').style.background = estilo.subtitleBg;
  }
  if (estilo.escala) inner.style.transform = 'scale(' + estilo.escala + ')';
  if (estilo.posX !== undefined) container.style.left = estilo.posX + 'px';
  if (estilo.posY !== undefined) container.style.bottom = estilo.posY + 'px';
}

function updateData(data) {
  if (!data) return;
  const { nombre, apellido, cargo, estilo } = data;
  if (nombre !== undefined) document.getElementById('lt-nombre').textContent = nombre || '';
  if (apellido !== undefined) document.getElementById('lt-apellido').textContent = apellido || '';
  if (cargo !== undefined) document.getElementById('lt-cargo').textContent = (cargo || '').toUpperCase();
  if (estilo) aplicarEstilo(estilo);
}

function showDefault() {
  updateData({
    nombre: '',
    apellido: '',
    cargo: 'CARGO',
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
      posY: 90,
    },
  });
}

function animarEntrada() {
  if (timeline) timeline.kill();

  const container = document.getElementById('lt-container');
  container.style.display = 'block';
  visible = true;

  gsap.set('#lt-name-group', { xPercent: -110 });
  gsap.set('#lt-name-ghost', { scaleX: 0, transformOrigin: 'left' });
  gsap.set('#lt-name-text', { opacity: 0 });
  gsap.set('#lt-title-box', { scaleY: 0, transformOrigin: 'top' });

  timeline = gsap.timeline();

  timeline.to('#lt-name-group', {
    duration: 1.0,
    xPercent: 0,
    ease: 'power4.out',
  });

  timeline.to('#lt-name-ghost', {
    duration: 0.4,
    scaleX: 1,
    ease: 'power3.out',
    transformOrigin: 'left',
  }, '-=0.5');

  timeline.to('#lt-name-text', {
    duration: 0.35,
    opacity: 1,
    ease: 'power2.out',
  }, '-=0.35');

  timeline.to('#lt-title-box', {
    duration: 0.55,
    scaleY: 1,
    ease: 'back.out(1.6)',
    transformOrigin: 'top',
  }, '-=0.2');
}

function animarSalida() {
  if (timeline) timeline.kill();

  timeline = gsap.timeline({
    onComplete: () => {
      const container = document.getElementById('lt-container');
      container.style.display = 'none';
      visible = false;
      gsap.set('#lt-name-group', { clearProps: 'xPercent' });
      gsap.set('#lt-name-ghost', { clearProps: 'transform' });
      gsap.set('#lt-title-box', { clearProps: 'transform' });
      gsap.set('#lt-name-text', { opacity: 0 });
    },
  });

  timeline.to('#lt-title-box', {
    duration: 0.25,
    scaleY: 0,
    ease: 'power2.in',
    transformOrigin: 'top',
  });

  timeline.to('#lt-name-text', {
    duration: 0.2,
    opacity: 0,
    ease: 'power2.in',
  }, '-=0.1');

  timeline.to('#lt-name-group', {
    duration: 0.55,
    xPercent: -110,
    ease: 'power3.in',
  }, '-=0.1');
}

function handlePayload(payload) {
  try {
    if (!payload || payload.tipo !== 'LOWER_THIRD') return;
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
    }
  } catch (err) {
    console.error('[RENDER LOWER] Error:', err);
  }
}

// Demo state on load
showDefault();

// Always connect via Socket.IO
getAuthToken().then((token) => {
  const socket = io({ ...SOCKET_OPTIONS, auth: { token } });
  socket.on('connect_error', (err) => {
    console.error('[SOCKET LOWER] Error:', err.message);
  });

  socket.on('render-graphic', handlePayload);
});
