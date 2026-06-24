import { io } from 'socket.io-client';
import { getAuthToken } from '../../shared/auth-token.js';
import { SOCKET_OPTIONS } from '../../shared/socket-options.js';
import gsap from 'gsap';

let timeline = null;
let leftVisible = false;
let rightVisible = false;

function setTexts(data) {
  if (data.left) {
    if (data.left.nombre !== undefined) document.getElementById('ltl-nombre').textContent = data.left.nombre || '';
    if (data.left.apellido !== undefined) document.getElementById('ltl-apellido').textContent = data.left.apellido || '';
    if (data.left.cargo !== undefined) document.getElementById('ltl-cargo').textContent = (data.left.cargo || '').toUpperCase();
    if (data.left.estilo) aplicarEstilo('ltl', data.left.estilo);
  }
  if (data.right) {
    if (data.right.nombre !== undefined) document.getElementById('ltr-nombre').textContent = data.right.nombre || '';
    if (data.right.apellido !== undefined) document.getElementById('ltr-apellido').textContent = data.right.apellido || '';
    if (data.right.cargo !== undefined) document.getElementById('ltr-cargo').textContent = (data.right.cargo || '').toUpperCase();
    if (data.right.estilo) aplicarEstilo('ltr', data.right.estilo);
  }
}

function showDefault() {
  setTexts({
    left: {
      nombre: 'ANA',
      apellido: 'GARCÍA',
      cargo: 'CEO',
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
    },
    right: {
      nombre: 'LUIS',
      apellido: 'MARTÍNEZ',
      cargo: 'CTO',
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
    },
  });
}

function aplicarEstilo(side, estilo) {
  if (!estilo) return;
  const isLeft = side === 'ltl';

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

// ── Individual entry/exit helpers ─────────────────

function entryLeft() {
  const c = document.getElementById('ltl-container');
  c.style.display = 'block';
  gsap.set('#ltl-name-group', { xPercent: -110 });
  gsap.set('#ltl-name-ghost', { scaleX: 0, transformOrigin: 'left' });
  gsap.set('#ltl-name-text', { opacity: 0 });
  gsap.set('#ltl-title-box', { scaleY: 0, transformOrigin: 'top' });
  const tl = gsap.timeline({ onComplete: () => { leftVisible = true; } });
  tl.to('#ltl-name-group', { duration: 1.0, xPercent: 0, ease: 'power4.out' }, 0);
  tl.to('#ltl-name-ghost', { duration: 0.4, scaleX: 1, ease: 'power3.out', transformOrigin: 'left' }, '-=0.5');
  tl.to('#ltl-name-text', { duration: 0.35, opacity: 1, ease: 'power2.out' }, '-=0.35');
  tl.to('#ltl-title-box', { duration: 0.55, scaleY: 1, ease: 'back.out(1.6)', transformOrigin: 'top' }, '-=0.2');
  return tl;
}

function entryRight() {
  const c = document.getElementById('ltr-container');
  c.style.display = 'block';
  gsap.set('#ltr-name-group', { xPercent: 110 });
  gsap.set('#ltr-name-ghost', { scaleX: 0, transformOrigin: 'right' });
  gsap.set('#ltr-name-text', { opacity: 0 });
  gsap.set('#ltr-title-box', { scaleY: 0, transformOrigin: 'top' });
  const tl = gsap.timeline({ onComplete: () => { rightVisible = true; } });
  tl.to('#ltr-name-group', { duration: 1.0, xPercent: 0, ease: 'power4.out' }, 0);
  tl.to('#ltr-name-ghost', { duration: 0.4, scaleX: 1, ease: 'power3.out', transformOrigin: 'right' }, '-=0.5');
  tl.to('#ltr-name-text', { duration: 0.35, opacity: 1, ease: 'power2.out' }, '-=0.35');
  tl.to('#ltr-title-box', { duration: 0.55, scaleY: 1, ease: 'back.out(1.6)', transformOrigin: 'top' }, '-=0.2');
  return tl;
}

function exitLeft(onDone) {
  const c = document.getElementById('ltl-container');
  gsap.set('#ltl-title-box', { clearProps: 'transform' });
  const tl = gsap.timeline({ onComplete: () => {
    c.style.display = 'none';
    gsap.set('#ltl-name-group', { clearProps: 'xPercent' });
    gsap.set('#ltl-name-ghost', { clearProps: 'transform' });
    gsap.set('#ltl-title-box', { clearProps: 'transform' });
    gsap.set('#ltl-name-text', { opacity: 0 });
    leftVisible = false;
    if (onDone) onDone();
  }});
  tl.to('#ltl-title-box', { duration: 0.25, scaleY: 0, ease: 'power2.in', transformOrigin: 'top' }, 0);
  tl.to('#ltl-name-text', { duration: 0.2, opacity: 0, ease: 'power2.in' }, '-=0.1');
  tl.to('#ltl-name-group', { duration: 0.55, xPercent: -110, ease: 'power3.in' }, '-=0.1');
  return tl;
}

function exitRight(onDone) {
  const c = document.getElementById('ltr-container');
  const tl = gsap.timeline({ onComplete: () => {
    c.style.display = 'none';
    gsap.set('#ltr-name-group', { clearProps: 'xPercent' });
    gsap.set('#ltr-name-ghost', { clearProps: 'transform' });
    gsap.set('#ltr-title-box', { clearProps: 'transform' });
    gsap.set('#ltr-name-text', { opacity: 0 });
    rightVisible = false;
    if (onDone) onDone();
  }});
  tl.to('#ltr-title-box', { duration: 0.25, scaleY: 0, ease: 'power2.in', transformOrigin: 'top' }, 0);
  tl.to('#ltr-name-text', { duration: 0.2, opacity: 0, ease: 'power2.in' }, '-=0.1');
  tl.to('#ltr-name-group', { duration: 0.55, xPercent: 110, ease: 'power3.in' }, '-=0.1');
  return tl;
}

function animarSalida() {
  if (timeline) timeline.kill();
  timeline = gsap.timeline({ onComplete: () => { leftVisible = false; rightVisible = false; } });
  timeline.add(exitLeft(), 0);
  timeline.add(exitRight(), 0);
}

function updateVisibleSides(data) {
  if (data.left && leftVisible) setTexts({ left: data.left });
  if (data.right && rightVisible) setTexts({ right: data.right });
}

function handlePayload(payload) {
  try {
    if (!payload || payload.tipo !== 'LOWER_DUAL') return;
    if (!payload.data || typeof payload.data !== 'object') return;

    const { accion, left, right } = payload.data;

    switch (accion) {
      case 'SHOW':
        if (left) setTexts({ left });
        if (right) setTexts({ right });
        if (timeline) timeline.kill();
        timeline = gsap.timeline();
        if (!leftVisible) timeline.add(entryLeft(), 0);
        if (!rightVisible) timeline.add(entryRight(), 0);
        if (leftVisible && rightVisible) { leftVisible = true; rightVisible = true; }
        break;

      case 'SHOW_LEFT':
        if (left) setTexts({ left });
        if (timeline) timeline.kill();
        if (!leftVisible) {
          timeline = entryLeft();
        }
        break;

      case 'SHOW_RIGHT':
        if (right) setTexts({ right });
        if (timeline) timeline.kill();
        if (!rightVisible) {
          timeline = entryRight();
        }
        break;

      case 'HIDE':
        animarSalida();
        break;

      case 'HIDE_LEFT':
        if (leftVisible) { if (timeline) timeline.kill(); timeline = exitLeft(); }
        break;

      case 'HIDE_RIGHT':
        if (rightVisible) { if (timeline) timeline.kill(); timeline = exitRight(); }
        break;

      case 'UPDATE':
        updateVisibleSides({ left, right });
        break;
    }
  } catch (err) {
    console.error('[RENDER DUAL LOWER] Error:', err);
  }
}

// Demo state on load
showDefault();

// Always connect via Socket.IO
getAuthToken().then((token) => {
  const socket = io({ ...SOCKET_OPTIONS, auth: { token } });
  socket.on('connect_error', (err) => {
    console.error('[SOCKET DUAL LOWER] Error:', err.message);
  });

  socket.on('render-graphic', handlePayload);
});
