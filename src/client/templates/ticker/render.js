import { io } from 'socket.io-client';
import { getAuthToken } from '../../shared/auth-token.js';
import { SOCKET_OPTIONS } from '../../shared/socket-options.js';
import gsap from 'gsap';

let tkrTimeline = null;
let animTimeline = null;
let tkrRunning = false;
let visible = false;

function armarContenido(message, logoUrl, logoWidth) {
  const msgEl = document.getElementById('tkr-message');
  msgEl.innerHTML = '';

  const unit = document.createElement('div');
  unit.style.cssText = 'display:flex;align-items:center;gap:16px;flex-shrink:0;';

  const txt = document.createElement('span');
  txt.textContent = message || '';
  unit.appendChild(txt);

  const img = document.createElement('img');
  img.className = 'tkr-logo';
  if (logoUrl) {
    img.src = logoUrl;
    img.style.display = '';
    const track = document.getElementById('tkr-track');
    if (logoWidth > 0) {
      img.style.width = Math.round(track.clientWidth * logoWidth / 100) + 'px';
    }
  } else {
    img.style.display = 'none';
  }
  unit.appendChild(img);

  msgEl.appendChild(unit);

  // Force layout to ensure measurements are correct
  void msgEl.offsetHeight;

  const unitWidth = unit.offsetWidth;
  const track = document.getElementById('tkr-track');
  const trackWidth = track.clientWidth;
  if (unitWidth === 0 || trackWidth === 0) return;

  let needed = Math.ceil((trackWidth * 2) / unitWidth) + 2;
  if (needed % 2 !== 0) needed++;

  for (let i = 1; i < needed; i++) {
    msgEl.appendChild(unit.cloneNode(true));
  }
}

function aplicarEstilo(cfg) {
  const body = document.body;
  const titleEl = document.getElementById('tkr-title');
  const msgEl = document.getElementById('tkr-message');
  const track = document.getElementById('tkr-track');

  if (cfg.fontFamily) body.style.fontFamily = cfg.fontFamily;
  if (cfg.titleSize) titleEl.style.fontSize = cfg.titleSize + 'px';
  if (cfg.titleColor) titleEl.style.color = cfg.titleColor;
  if (cfg.titleBg) titleEl.style.background = cfg.titleBg;
  if (cfg.msgColor) msgEl.style.color = cfg.msgColor;
  if (cfg.msgBg) track.style.background = cfg.msgBg;
}

function aplicarConfig(cfg) {
  const titleEl = document.getElementById('tkr-title');
  if (cfg.title !== undefined) titleEl.textContent = cfg.title;
  const fontSize = cfg.fontSize || 33;
  const logoWidth = cfg.logoWidth || 4;
  document.getElementById('tkr-message').style.fontSize = fontSize + 'px';
  armarContenido(cfg.message, cfg.logoUrl, logoWidth);
  aplicarEstilo(cfg);
}

function iniciarTicker(speed) {
  if (tkrRunning) return; // guard: prevent double-start
  if (tkrTimeline) { tkrTimeline.kill(); tkrTimeline = null; }

  // Force layout before measuring
  void document.getElementById('tkr-track').offsetHeight;

  const msgEl = document.getElementById('tkr-message');
  const track = document.getElementById('tkr-track');
  if (!msgEl || !track) return;

  const trackWidth = track.clientWidth;
  const totalWidth = msgEl.scrollWidth;
  if (trackWidth === 0 || totalWidth === 0) return;

  const half = totalWidth / 2;
  const pps = speed || 80;

  // Start at the right edge of the visible track and scroll left
  gsap.set(msgEl, { x: 0 });

  tkrRunning = true;
  tkrTimeline = gsap.timeline({ repeat: -1 });
  tkrTimeline.to(msgEl, {
    x: -half,
    duration: half / pps,
    ease: 'none',
  });
}

function mostrar(cfg) {
  const container = document.getElementById('tkr-container');

  // Kill any ongoing exit animation and release ticker guard
  tkrRunning = false;
  if (animTimeline) { animTimeline.kill(); animTimeline = null; }
  if (tkrTimeline) { tkrTimeline.kill(); tkrTimeline = null; }

  container.style.display = 'flex';
  visible = true;
  aplicarConfig(cfg);

  // Slide in from the right. Set the initial offset first, then animate
  // back to the resting position. We avoid clearProps:'all' because it can
  // wipe out the inline display:flex we just set, leaving the preview
  // black until the animation starts.
  gsap.set(container, { x: '100%' });
  gsap.set('#tkr-title', { x: '0%' });
  gsap.set('#tkr-track', { x: '0%' });

  const speed = cfg.speed || 80;

  animTimeline = gsap.timeline({
    onComplete: () => {
      animTimeline = null;
      iniciarTicker(speed);
    },
  });
  animTimeline.to(container, {
    x: '0%',
    duration: 0.6,
    ease: 'power3.out',
  });
}

function updateWhileVisible(cfg) {
  const container = document.getElementById('tkr-container');
  if (container.style.display === 'none' || container.style.display === '') return;

  tkrRunning = false;
  if (tkrTimeline) { tkrTimeline.kill(); tkrTimeline = null; }

  aplicarConfig(cfg);
  iniciarTicker(cfg.speed || 80);
}

function ocultar() {
  const container = document.getElementById('tkr-container');
  tkrRunning = false;
  visible = false;
  if (animTimeline) { animTimeline.kill(); animTimeline = null; }
  if (tkrTimeline) { tkrTimeline.kill(); tkrTimeline = null; }

  animTimeline = gsap.timeline({
    onComplete: () => {
      animTimeline = null;
      container.style.display = 'none';
      gsap.set(container, { clearProps: 'x' });
    },
  });

  // Slide the whole bar out to the left with easing
  animTimeline.to(container, {
    x: '-100%',
    duration: 0.45,
    ease: 'power2.in',
  });
}

function showDefault() {
  mostrar({
    title: 'LIVE',
    message: 'ticker de prueba — masterización profesional',
    logoUrl: null,
    speed: 80,
    logoWidth: 4,
    fontSize: 33,
    fontFamily: 'Montserrat, sans-serif',
    titleSize: 44,
    titleColor: '#ffffff',
    titleBg: '#071041',
    msgColor: '#111111',
    msgBg: '#ffffff',
  });
}

function handlePayload(payload) {
  try {
    if (!payload || payload.tipo !== 'TICKER') return;
    if (!payload.data || typeof payload.data !== 'object') return;

    const { accion, title, message, logoUrl, speed, logoWidth, fontSize, fontFamily, titleSize, titleColor, titleBg, msgColor, msgBg } = payload.data;
    const cfg = { title, message, logoUrl, speed, logoWidth, fontSize, fontFamily, titleSize, titleColor, titleBg, msgColor, msgBg };

      if (accion === 'SHOW') {
        if (visible) {
          updateWhileVisible(cfg);
        } else {
          mostrar(cfg);
        }
      } else if (accion === 'HIDE') {
      ocultar();
    } else if (accion === 'UPDATE') {
      if (!visible) return;
      updateWhileVisible(cfg);
    }
  } catch (err) {
    console.error('[RENDER TICKER] Error:', err);
  }
}

// Demo state on load
showDefault();

// Always connect via Socket.IO
getAuthToken().then((token) => {
  const socket = io({ ...SOCKET_OPTIONS, auth: { token } });
  socket.on('connect_error', (err) => {
    console.error('[SOCKET TICKER] Error:', err.message);
  });

  socket.on('render-graphic', handlePayload);
});
