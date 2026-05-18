import { io } from 'socket.io-client';
import gsap from 'gsap';

const isPreview = window.location.search.includes('preview=1');

let lastStyle = {};
let timeline = null;

function mostrarPreview(data) {
  if (!data) return;
  const { nombre, apellido, cargo, estilo } = data;
  document.getElementById('lt-nombre').textContent = nombre || '';
  document.getElementById('lt-apellido').textContent = apellido || '';
  document.getElementById('lt-cargo').textContent = (cargo || '').toUpperCase();
  if (estilo) aplicarEstilo(estilo);
  const container = document.getElementById('lt-container');
  container.style.display = 'block';
  gsap.set('#lt-name-group', { xPercent: 0 });
  gsap.set('#lt-name-text', { opacity: 1 });
  gsap.set('#lt-title-box', { scaleY: 1, transformOrigin: 'top' });
}

if (isPreview) {
  window.addEventListener('message', (e) => {
    if (e.source !== window.parent) return;
    try {
      const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (data && data.tipo === 'PREVIEW_LOWER') {
        mostrarPreview(data.data);
      }
    } catch (_) { /* ignore */ }
  });
  mostrarPreview({
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
      posY: 90
    }
  });
}

function aplicarEstilo(estilo) {
  if (!estilo) return;
  lastStyle = estilo;

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

function animarEntrada() {
  if (timeline) timeline.kill();

  const container = document.getElementById('lt-container');
  container.style.display = 'block';

  gsap.set('#lt-name-group', { xPercent: -110 });
  gsap.set('#lt-name-ghost', { scaleX: 0, transformOrigin: 'left' });
  gsap.set('#lt-name-text', { opacity: 0 });
  gsap.set('#lt-title-box', { scaleY: 0, transformOrigin: 'top' });

  timeline = gsap.timeline();

  timeline.to('#lt-name-group', {
    duration: 1.0,
    xPercent: 0,
    ease: 'power4.out'
  });

  timeline.to('#lt-name-ghost', {
    duration: 0.4,
    scaleX: 1,
    ease: 'power3.out',
    transformOrigin: 'left'
  }, '-=0.5');

  timeline.to('#lt-name-text', {
    duration: 0.35,
    opacity: 1,
    ease: 'power2.out'
  }, '-=0.35');

  timeline.to('#lt-title-box', {
    duration: 0.55,
    scaleY: 1,
    ease: 'back.out(1.6)',
    transformOrigin: 'top'
  }, '-=0.2');
}

function animarSalida() {
  if (timeline) timeline.kill();

  timeline = gsap.timeline({
    onComplete: () => {
      const container = document.getElementById('lt-container');
      container.style.display = 'none';
      gsap.set('#lt-name-group', { clearProps: 'xPercent' });
      gsap.set('#lt-name-ghost', { clearProps: 'transform' });
      gsap.set('#lt-title-box', { clearProps: 'transform' });
      gsap.set('#lt-name-text', { opacity: 0 });
    }
  });

  timeline.to('#lt-title-box', {
    duration: 0.25,
    scaleY: 0,
    ease: 'power2.in',
    transformOrigin: 'top'
  });

  timeline.to('#lt-name-text', {
    duration: 0.2,
    opacity: 0,
    ease: 'power2.in'
  }, '-=0.1');

  timeline.to('#lt-name-group', {
    duration: 0.55,
    xPercent: -110,
    ease: 'power3.in'
  }, '-=0.1');
}

if (!isPreview) {
  const socket = io({
    reconnectionDelay: 1000,
    reconnectionAttempts: 10
  });

  socket.on('connect_error', (err) => {
    console.error('[SOCKET LOWER] Error:', err.message);
  });

  socket.on('render-graphic', (payload) => {
    try {
      if (!payload || payload.tipo !== 'LOWER_THIRD') return;
      if (!payload.data || typeof payload.data !== 'object') return;

      const { accion, nombre, apellido, cargo, estilo } = payload.data;
      if (accion !== 'SHOW' && accion !== 'HIDE') return;

      if (accion === 'SHOW') {
        document.getElementById('lt-nombre').textContent = nombre || '';
        document.getElementById('lt-apellido').textContent = apellido || '';
        document.getElementById('lt-cargo').textContent = (cargo || '').toUpperCase();

        if (estilo) aplicarEstilo(estilo);

        animarEntrada();
      } else if (accion === 'HIDE') {
        animarSalida();
      }
    } catch (err) {
      console.error('[RENDER LOWER] Error:', err);
    }
  });
}
