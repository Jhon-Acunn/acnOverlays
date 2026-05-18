import { io } from 'socket.io-client';
import gsap from 'gsap';

const isPreview = window.location.search.includes('preview=1');

let lastLStyle = {};
let lastRStyle = {};
let timeline = null;

function setTexts(data) {
  if (data.left) {
    document.getElementById('ltl-nombre').textContent = data.left.nombre || '';
    document.getElementById('ltl-apellido').textContent = data.left.apellido || '';
    document.getElementById('ltl-cargo').textContent = (data.left.cargo || '').toUpperCase();
    if (data.left.estilo) aplicarEstilo('ltl', data.left.estilo);
  }
  if (data.right) {
    document.getElementById('ltr-nombre').textContent = data.right.nombre || '';
    document.getElementById('ltr-apellido').textContent = data.right.apellido || '';
    document.getElementById('ltr-cargo').textContent = (data.right.cargo || '').toUpperCase();
    if (data.right.estilo) aplicarEstilo('ltr', data.right.estilo);
  }
}

function mostrarPreview(data) {
  if (!data) return;
  setTexts(data);
  const leftContainer = document.getElementById('ltl-container');
  const rightContainer = document.getElementById('ltr-container');
  leftContainer.style.display = 'block';
  rightContainer.style.display = 'block';
  gsap.set('#ltl-name-group', { xPercent: 0 });
  gsap.set('#ltl-name-text', { opacity: 1 });
  gsap.set('#ltl-title-box', { scaleY: 1, transformOrigin: 'top' });
  gsap.set('#ltr-name-group', { xPercent: 0 });
  gsap.set('#ltr-name-text', { opacity: 1 });
  gsap.set('#ltr-title-box', { scaleY: 1, transformOrigin: 'top' });
}

if (isPreview) {
  window.addEventListener('message', (e) => {
    if (e.source !== window.parent) return;
    try {
      const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (data && data.tipo === 'PREVIEW_LOWER_DUAL') {
        mostrarPreview(data.data);
      }
    } catch (_) { /* ignore */ }
  });
  mostrarPreview({
    left: { nombre: 'ANA', apellido: 'GARCÍA', cargo: 'CEO', estilo: null },
    right: { nombre: 'LUIS', apellido: 'MARTÍNEZ', cargo: 'CTO', estilo: null }
  });
}

function aplicarEstilo(side, estilo) {
  if (!estilo) return;
  const isLeft = side === 'ltl';
  if (isLeft) lastLStyle = estilo; else lastRStyle = estilo;

  const body = document.body;
  const nombreEl = document.getElementById(side + '-nombre');
  const apellidoEl = document.getElementById(side + '-apellido');
  const cargoEl = document.getElementById(side + '-cargo');
  const inner = document.getElementById(side + '-inner');
  const container = document.getElementById(side + '-container');

  if (estilo.fontFamily) body.style.fontFamily = estilo.fontFamily;
  if (estilo.titleFontSize) {
    nombreEl.style.fontSize = estilo.titleFontSize;
    apellidoEl.style.fontSize = estilo.titleFontSize;
  }
  if (estilo.titleColor) {
    nombreEl.style.color = estilo.titleColor;
    apellidoEl.style.color = estilo.titleColor;
  }
  if (estilo.titleBg) document.getElementById(side + '-name-box').style.background = estilo.titleBg;
  if (estilo.subtitleFontSize) cargoEl.style.fontSize = estilo.subtitleFontSize;
  if (estilo.subtitleColor) cargoEl.style.color = estilo.subtitleColor;
  if (estilo.subtitleBg) {
    document.getElementById(side + '-title-box').style.background = estilo.subtitleBg;
    document.getElementById(side + '-name-ghost').style.background = estilo.subtitleBg;
  }
  if (estilo.escala) inner.style.transform = 'scale(' + estilo.escala + ')';
  if (estilo.posX !== undefined) {
    if (isLeft) container.style.left = estilo.posX + 'px';
    else container.style.right = estilo.posX + 'px';
  }
  if (estilo.posY !== undefined) container.style.bottom = estilo.posY + 'px';
}

function animarEntrada() {
  if (timeline) timeline.kill();

  const leftContainer = document.getElementById('ltl-container');
  const rightContainer = document.getElementById('ltr-container');
  leftContainer.style.display = 'block';
  rightContainer.style.display = 'block';

  // Left — slide from left
  gsap.set('#ltl-name-group', { xPercent: -110 });
  gsap.set('#ltl-name-ghost', { scaleX: 0, transformOrigin: 'left' });
  gsap.set('#ltl-name-text', { opacity: 0 });
  gsap.set('#ltl-title-box', { scaleY: 0, transformOrigin: 'top' });

  // Right — slide from right
  gsap.set('#ltr-name-group', { xPercent: 110 });
  gsap.set('#ltr-name-ghost', { scaleX: 0, transformOrigin: 'right' });
  gsap.set('#ltr-name-text', { opacity: 0 });
  gsap.set('#ltr-title-box', { scaleY: 0, transformOrigin: 'top' });

  timeline = gsap.timeline();

  // Left name group slides in
  timeline.to('#ltl-name-group', { duration: 1.0, xPercent: 0, ease: 'power4.out' }, 0);
  timeline.to('#ltl-name-ghost', { duration: 0.4, scaleX: 1, ease: 'power3.out', transformOrigin: 'left' }, '-=0.5');
  timeline.to('#ltl-name-text', { duration: 0.35, opacity: 1, ease: 'power2.out' }, '-=0.35');
  timeline.to('#ltl-title-box', { duration: 0.55, scaleY: 1, ease: 'back.out(1.6)', transformOrigin: 'top' }, '-=0.2');

  // Right name group slides in (same timing)
  timeline.to('#ltr-name-group', { duration: 1.0, xPercent: 0, ease: 'power4.out' }, 0);
  timeline.to('#ltr-name-ghost', { duration: 0.4, scaleX: 1, ease: 'power3.out', transformOrigin: 'right' }, '-=0.5');
  timeline.to('#ltr-name-text', { duration: 0.35, opacity: 1, ease: 'power2.out' }, '-=0.35');
  timeline.to('#ltr-title-box', { duration: 0.55, scaleY: 1, ease: 'back.out(1.6)', transformOrigin: 'top' }, '-=0.2');
}

function animarSalida() {
  if (timeline) timeline.kill();

  timeline = gsap.timeline({
    onComplete: () => {
      document.getElementById('ltl-container').style.display = 'none';
      document.getElementById('ltr-container').style.display = 'none';
      gsap.set('#ltl-name-group', { clearProps: 'xPercent' });
      gsap.set('#ltl-name-ghost', { clearProps: 'transform' });
      gsap.set('#ltl-title-box', { clearProps: 'transform' });
      gsap.set('#ltl-name-text', { opacity: 0 });
      gsap.set('#ltr-name-group', { clearProps: 'xPercent' });
      gsap.set('#ltr-name-ghost', { clearProps: 'transform' });
      gsap.set('#ltr-title-box', { clearProps: 'transform' });
      gsap.set('#ltr-name-text', { opacity: 0 });
    }
  });

  timeline.to('#ltl-title-box', { duration: 0.25, scaleY: 0, ease: 'power2.in', transformOrigin: 'top' }, 0);
  timeline.to('#ltl-name-text', { duration: 0.2, opacity: 0, ease: 'power2.in' }, '-=0.1');
  timeline.to('#ltl-name-group', { duration: 0.55, xPercent: -110, ease: 'power3.in' }, '-=0.1');

  timeline.to('#ltr-title-box', { duration: 0.25, scaleY: 0, ease: 'power2.in', transformOrigin: 'top' }, 0);
  timeline.to('#ltr-name-text', { duration: 0.2, opacity: 0, ease: 'power2.in' }, '-=0.1');
  timeline.to('#ltr-name-group', { duration: 0.55, xPercent: 110, ease: 'power3.in' }, '-=0.1');
}

if (!isPreview) {
  const socket = io({
    reconnectionDelay: 1000,
    reconnectionAttempts: 10
  });

  socket.on('connect_error', (err) => {
    console.error('[SOCKET DUAL LOWER] Error:', err.message);
  });

  socket.on('render-graphic', (payload) => {
    try {
      if (!payload || payload.tipo !== 'LOWER_DUAL') return;
      if (!payload.data || typeof payload.data !== 'object') return;

      const { accion, left, right } = payload.data;
      if (accion !== 'SHOW' && accion !== 'HIDE') return;

      if (accion === 'SHOW') {
        document.getElementById('ltl-nombre').textContent = (left && left.nombre) || '';
        document.getElementById('ltl-apellido').textContent = (left && left.apellido) || '';
        document.getElementById('ltl-cargo').textContent = ((left && left.cargo) || '').toUpperCase();
        if (left && left.estilo) aplicarEstilo('ltl', left.estilo);

        document.getElementById('ltr-nombre').textContent = (right && right.nombre) || '';
        document.getElementById('ltr-apellido').textContent = (right && right.apellido) || '';
        document.getElementById('ltr-cargo').textContent = ((right && right.cargo) || '').toUpperCase();
        if (right && right.estilo) aplicarEstilo('ltr', right.estilo);

        animarEntrada();
      } else if (accion === 'HIDE') {
        animarSalida();
      }
    } catch (err) {
      console.error('[RENDER DUAL LOWER] Error:', err);
    }
  });
}
