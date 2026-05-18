import { io } from 'socket.io-client';
import gsap from 'gsap';

const isPreview = window.location.search.includes('preview=1');

let lastLStyle = {};
let lastRStyle = {};
let timeline = null;
let leftVisible = false;
let rightVisible = false;

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
  const leftC = document.getElementById('ltl-container');
  const rightC = document.getElementById('ltr-container');
  if (data.left) {
    leftC.style.display = 'block';
    gsap.set('#ltl-name-group', { xPercent: 0 });
    gsap.set('#ltl-name-text', { opacity: 1 });
    gsap.set('#ltl-title-box', { scaleY: 1, transformOrigin: 'top' });
  }
  if (data.right) {
    rightC.style.display = 'block';
    gsap.set('#ltr-name-group', { xPercent: 0 });
    gsap.set('#ltr-name-text', { opacity: 1 });
    gsap.set('#ltr-title-box', { scaleY: 1, transformOrigin: 'top' });
  }
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

function animarEntrada() {
  if (timeline) timeline.kill();
  timeline = gsap.timeline({ onComplete: () => { leftVisible = true; rightVisible = true; } });
  entryLeft();
  entryRight();
  // Combine into one timeline for compatibility
  timeline.add(entryLeft(), 0);
  timeline.add(entryRight(), 0);
}

function animarSalida() {
  if (timeline) timeline.kill();
  timeline = gsap.timeline({ onComplete: () => { leftVisible = false; rightVisible = false; } });
  timeline.add(exitLeft(), 0);
  timeline.add(exitRight(), 0);
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

      switch (accion) {
        case 'SHOW':
          if (left) {
            document.getElementById('ltl-nombre').textContent = left.nombre || '';
            document.getElementById('ltl-apellido').textContent = left.apellido || '';
            document.getElementById('ltl-cargo').textContent = (left.cargo || '').toUpperCase();
            if (left.estilo) aplicarEstilo('ltl', left.estilo);
          }
          if (right) {
            document.getElementById('ltr-nombre').textContent = right.nombre || '';
            document.getElementById('ltr-apellido').textContent = right.apellido || '';
            document.getElementById('ltr-cargo').textContent = (right.cargo || '').toUpperCase();
            if (right.estilo) aplicarEstilo('ltr', right.estilo);
          }
          animarEntrada();
          break;

        case 'SHOW_LEFT':
          if (!left) break;
          document.getElementById('ltl-nombre').textContent = left.nombre || '';
          document.getElementById('ltl-apellido').textContent = left.apellido || '';
          document.getElementById('ltl-cargo').textContent = (left.cargo || '').toUpperCase();
          if (left.estilo) aplicarEstilo('ltl', left.estilo);
          if (timeline) timeline.kill();
          timeline = entryLeft();
          break;

        case 'SHOW_RIGHT':
          if (!right) break;
          document.getElementById('ltr-nombre').textContent = right.nombre || '';
          document.getElementById('ltr-apellido').textContent = right.apellido || '';
          document.getElementById('ltr-cargo').textContent = (right.cargo || '').toUpperCase();
          if (right.estilo) aplicarEstilo('ltr', right.estilo);
          if (timeline) timeline.kill();
          timeline = entryRight();
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
      }
    } catch (err) {
      console.error('[RENDER DUAL LOWER] Error:', err);
    }
  });
}
