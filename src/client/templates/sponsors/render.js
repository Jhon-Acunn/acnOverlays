import { io } from 'socket.io-client';
import gsap from 'gsap';

const socket = io({
  reconnectionDelay: 1000,
  reconnectionAttempts: 10
});

socket.on('connect_error', (err) => {
  console.error('[SOCKET SPONSORS] Error:', err.message);
});

let rotacionInterval = null;
let indiceActual = 0;
let timeline = null;

function iniciarRotacion() {
  const logos = document.querySelectorAll('.sponsor-logo');
  if (logos.length === 0) return;

  detenerRotacion();

  gsap.set(logos, { opacity: 0 });
  gsap.set(logos[0], { opacity: 1 });
  indiceActual = 0;

  rotacionInterval = setInterval(() => {
    const prev = indiceActual;
    indiceActual = (indiceActual + 1) % logos.length;

    gsap.to(logos[prev], { duration: 0.8, opacity: 0, ease: 'power2.in' });
    gsap.to(logos[indiceActual], { duration: 0.8, opacity: 1, ease: 'power2.out' });
  }, 5000);
}

function detenerRotacion() {
  if (rotacionInterval) {
    clearInterval(rotacionInterval);
    rotacionInterval = null;
  }
}

function animarEntrada() {
  const bar = document.getElementById('sponsors-bar');
  const logosContainer = document.getElementById('sponsors-logos');

  if (timeline) timeline.kill();

  timeline = gsap.timeline({
    onComplete: () => iniciarRotacion()
  });

  timeline.to(bar, {
    duration: 0.6,
    x: '0%',
    ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  });

  timeline.to(logosContainer, {
    duration: 0.4,
    scaleY: 1,
    ease: 'power2.out'
  }, '-=0.1');
}

function animarSalida() {
  const bar = document.getElementById('sponsors-bar');
  const logosContainer = document.getElementById('sponsors-logos');

  detenerRotacion();

  if (timeline) timeline.kill();

  timeline = gsap.timeline();

  timeline.to(logosContainer, {
    duration: 0.3,
    scaleY: 0,
    ease: 'power2.in'
  });

  timeline.to(bar, {
    duration: 0.3,
    x: '-110%',
    ease: 'power2.in'
  }, '-=0.1');

  timeline.set('#sponsors-container', { clearProps: 'all' });
}

socket.on('render-graphic', (payload) => {
  try {
    if (!payload || payload.tipo !== 'SPONSORS') return;
    if (!payload.data || typeof payload.data !== 'object') return;

    const { accion } = payload.data;
    if (accion !== 'SHOW' && accion !== 'HIDE') return;

    if (accion === 'SHOW') {
      animarEntrada();
    } else if (accion === 'HIDE') {
      animarSalida();
    }
  } catch (err) {
    console.error('[RENDER SPONSORS] Error:', err);
  }
});
