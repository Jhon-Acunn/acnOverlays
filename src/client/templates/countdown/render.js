import { io } from 'socket.io-client';
import gsap from 'gsap';

const isPreview = window.location.search.includes('preview=1');

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

function formatTimeMs(diff) {
  if (diff <= 0) return '00:00:00.0';
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = Math.floor(diff % 60);
  const ms = Math.floor((diff % 1) * 10);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
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
  if (estilo.showMs) {
    // dynamic format with ms would need a faster interval
  }
}

// ── Animations ──

function animEntradaCD() {
  const container = document.getElementById('countdown-container');
  container.style.display = 'flex';
  if (cdTimeline) cdTimeline.kill();
  gsap.set(container, { opacity: 0, y: 20 });
  cdTimeline = gsap.timeline()
    .to(container, { duration: 0.4, opacity: 1, y: 0, ease: 'power3.out' });
  cdVisible = true;
}

function animSalidaCD() {
  const container = document.getElementById('countdown-container');
  if (cdTimeline) cdTimeline.kill();
  cdTimeline = gsap.timeline({
    onComplete: () => {
      container.style.display = 'none';
      gsap.set(container, { clearProps: 'opacity,y' });
      cdVisible = false;
    }
  })
    .to(container, { duration: 0.3, opacity: 0, y: 20, ease: 'power2.in' });
}

// ── Main ──

function mostrarCountdown(cfg) {
  const { target, label, mode, estilo } = cfg;
  cdMode = mode || 'countdown';
  cdTargetTime = parseTarget(target);
  if (label !== undefined) document.getElementById('countdown-label').textContent = label || '';
  aplicarEstiloCD(estilo);
  iniciarTick();
  animEntradaCD();
}

function ocultarCountdown() {
  detenerTick();
  cdTargetTime = null;
  animSalidaCD();
}

// ── Preview ──

if (isPreview) {
  window.addEventListener('message', (e) => {
    if (e.source !== window.parent) return;
    try {
      const msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (!msg || !msg.tipo) return;
      if (msg.tipo === 'PREVIEW_COUNTDOWN') {
        document.getElementById('countdown-container').style.display = 'none';
        gsap.set(document.getElementById('countdown-container'), { clearProps: 'all' });
        mostrarCountdown(msg.data);
      }
    } catch (_) { /* ignore */ }
  });

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
    }
  });
}

// ── Socket ──

if (!isPreview) {
  const socket = io({
    reconnectionDelay: 1000,
    reconnectionAttempts: 10
  });

  socket.on('connect_error', (err) => {
    console.error('[SOCKET CD] Error:', err.message);
  });

  socket.on('render-graphic', (payload) => {
    try {
      if (!payload || payload.tipo !== 'COUNTDOWN') return;
      const { accion, target, label, mode, estilo } = payload.data || {};
      if (accion === 'SHOW') {
        mostrarCountdown({ target, label, mode, estilo });
      } else if (accion === 'HIDE') {
        ocultarCountdown();
      }
    } catch (err) {
      console.error('[RENDER CD] Error:', err);
    }
  });
}
