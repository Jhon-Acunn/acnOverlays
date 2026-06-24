import { io } from 'socket.io-client';
import { getAuthToken } from '../../shared/auth-token.js';
import { SOCKET_OPTIONS } from '../../shared/socket-options.js';
import gsap from 'gsap';

let cdTimeline = null;
let cdInterval = null;
let cdVisible = false;
let cdTargetTime = null;
let cdMode = 'countdown'; // 'countdown' | 'countup'

// ── Format time ──

function formatTime(diff) {
  if (diff <= 0) return '00:00:00';
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = Math.floor(diff % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Tick update ──

function actualizarCountdown() {
  const display = document.getElementById('countdown-display');
  if (!cdTargetTime) return;
  const now = Date.now();
  let diff;
  if (cdMode === 'countdown') {
    diff = Math.max(0, (cdTargetTime - now) / 1000);
  } else {
    diff = Math.max(0, (now - cdTargetTime) / 1000);
  }
  if (diff <= 0 && cdMode === 'countdown') {
    display.textContent = '00:00:00';
    detenerTick();
    return;
  }
  display.textContent = formatTime(diff);
}

// ── Tick control ──

function iniciarTick() {
  detenerTick();
  actualizarCountdown();
  cdInterval = setInterval(actualizarCountdown, 1000);
}

function detenerTick() {
  if (cdInterval) {
    clearInterval(cdInterval);
    cdInterval = null;
  }
}

// ── Parse target ──

function parseTarget(target) {
  // target can be:
  // - ISO string: "2026-12-31T23:59:59"
  // - Unix ms: 1700000000000
  // - Duration in seconds: 3600 (from now)
  if (typeof target === 'number' || !isNaN(Number(target))) {
    const seconds = Number(target);
    if (seconds > 1000000000000) return seconds; // already unix ms
    return Date.now() + seconds * 1000; // duration from now
  }
  // ISO string
  const ts = Date.parse(target);
  if (!isNaN(ts)) return ts;
  return Date.now() + 3600000; // fallback 1h
}

// ── Style ──

function aplicarEstiloCD(estilo) {
  if (!estilo) return;
  const container = document.getElementById('countdown-container');
  const label = document.getElementById('countdown-label');
  const display = document.getElementById('countdown-display');
  if (estilo.fontFamily) container.style.fontFamily = estilo.fontFamily;
  if (estilo.labelSize) label.style.fontSize = estilo.labelSize;
  if (estilo.labelColor) label.style.color = estilo.labelColor;
  if (estilo.displaySize) display.style.fontSize = estilo.displaySize;
  if (estilo.displayColor) display.style.color = estilo.displayColor;
  if (estilo.displayFont) display.style.fontFamily = estilo.displayFont;
  if (estilo.bgColor) container.style.background = estilo.bgColor;
  if (estilo.borderRadius) container.style.borderRadius = estilo.borderRadius + 'px';
  if (estilo.opacity !== undefined) container.style.opacity = estilo.opacity;
  if (estilo.posX !== undefined) container.style.right = estilo.posX + 'px';
  if (estilo.posY !== undefined) container.style.bottom = estilo.posY + 'px';
}

// ── Animations ──

function animEntradaCD() {
  const container = document.getElementById('countdown-container');
  container.style.display = 'flex';
  cdVisible = true;
  if (cdTimeline) cdTimeline.kill();
  gsap.set(container, { opacity: 0, y: 20 });
  cdTimeline = gsap.timeline()
    .to(container, { duration: 0.4, opacity: 1, y: 0, ease: 'power3.out' });
}

function animSalidaCD() {
  const container = document.getElementById('countdown-container');
  if (cdTimeline) cdTimeline.kill();
  cdTimeline = gsap.timeline({
    onComplete: () => {
      container.style.display = 'none';
      gsap.set(container, { clearProps: 'opacity,y' });
      cdVisible = false;
    },
  })
    .to(container, { duration: 0.3, opacity: 0, y: 20, ease: 'power2.in' });
}

// ── Main ──

function updateCountdown(cfg) {
  const { target, label, mode, estilo } = cfg;
  cdMode = mode || 'countdown';
  cdTargetTime = parseTarget(target);
  if (label !== undefined) document.getElementById('countdown-label').textContent = label || '';
  aplicarEstiloCD(estilo);
  iniciarTick();
}

function mostrarCountdown(cfg) {
  updateCountdown(cfg);
  animEntradaCD();
}

function ocultarCountdown() {
  detenerTick();
  cdTargetTime = null;
  animSalidaCD();
}

function showDefault() {
  mostrarCountdown({
    target: 3600, // 1 hour from now
    label: 'PRÓXIMO INICIO',
    mode: 'countdown',
    estilo: {
      fontFamily: 'Inter, sans-serif',
      labelSize: '0.6rem',
      labelColor: 'rgba(255,255,255,0.45)',
      displaySize: '2.8rem',
      displayColor: '#ffffff',
      displayFont: 'Bebas Neue, Inter, sans-serif',
      bgColor: 'rgba(0,0,0,0.6)',
      borderRadius: 10,
      opacity: 1,
      posX: 32,
      posY: 96,
    },
  });
}

function handlePayload(payload) {
  try {
    if (!payload || payload.tipo !== 'COUNTDOWN') return;
    const { accion, target, label, mode, estilo } = payload.data || {};
      if (accion === 'SHOW') {
        updateCountdown({ target, label, mode, estilo });
        if (!cdVisible) animEntradaCD();
      } else if (accion === 'HIDE') {
      ocultarCountdown();
    } else if (accion === 'UPDATE') {
      if (!cdVisible) return;
      updateCountdown({ target, label, mode, estilo });
    }
  } catch (err) {
    console.error('[RENDER CD] Error:', err);
  }
}

// Demo state on load
showDefault();

// Always connect via Socket.IO
getAuthToken().then((token) => {
  const socket = io({ ...SOCKET_OPTIONS, auth: { token } });
  socket.on('connect_error', (err) => {
    console.error('[SOCKET CD] Error:', err.message);
  });

  socket.on('render-graphic', handlePayload);
});
