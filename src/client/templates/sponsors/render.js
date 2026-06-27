import { io } from 'socket.io-client';
import { getAuthToken } from '../../shared/auth-token.js';
import { SOCKET_OPTIONS } from '../../shared/socket-options.js';
import gsap from 'gsap';

/* ---------- state ---------- */
let rotacionInterval = null;
let indiceActual = 0;
let timeline = null;
let sponsorsData = [];
let configActual = {};
let visible = false;

/* ---------- helpers ---------- */
function detenerRotacion() {
  if (rotacionInterval) {
    clearInterval(rotacionInterval);
    rotacionInterval = null;
  }
}

function aplicarConfig(cfg) {
  if (!cfg) return;
  configActual = cfg;
  const root = document.documentElement;
  const bar = document.getElementById('sponsors-bar');
  if (cfg.barColor) root.style.setProperty('--sp-bar-bg', cfg.barColor);
  if (cfg.barTextColor) root.style.setProperty('--sp-bar-color', cfg.barTextColor);
  if (bar) bar.textContent = cfg.barText || 'PATROCINADO POR';
  if (cfg.fontFamily) document.getElementById('sponsors-container').style.fontFamily = cfg.fontFamily;
  if (cfg.barHeight) root.style.setProperty('--sp-bar-h', cfg.barHeight + 'px');
  const logosContainer = document.getElementById('sponsors-logos');
  if (cfg.bgGradientTop && cfg.bgGradientBottom) {
    logosContainer.style.background = `linear-gradient(180deg, ${cfg.bgGradientTop} 0%, ${cfg.bgGradientBottom} 100%)`;
  }
}

function construirSponsors(lista) {
  sponsorsData = lista || [];
  const container = document.getElementById('sponsors-logos-inner');
  container.innerHTML = '';
  if (!sponsorsData.length) {
    const placeholder = document.createElement('div');
    placeholder.className = 'sp-logo';
    placeholder.textContent = 'SIN PATROCINADORES';
    placeholder.style.cssText = 'opacity:1;position:static;transform:none;display:flex;align-items:center;justify-content:center;width:100%;padding:0 1rem;font-weight:700;font-size:0.9rem;color:#888;text-align:center;';
    container.appendChild(placeholder);
    return;
  }
  sponsorsData.forEach((sp, idx) => {
    const div = document.createElement('div');
    div.className = 'sp-logo';
    div.dataset.index = idx;
    if (sp.logoUrl) {
      const img = document.createElement('img');
      img.src = sp.logoUrl;
      img.alt = sp.name || '';
      img.style.cssText = 'max-height:80px;max-width:260px;display:block;';
      div.appendChild(img);
    } else {
      div.textContent = sp.name || 'SPONSOR';
      div.style.cssText = 'display:flex;align-items:center;justify-content:center;min-width:0;padding:0 1rem;font-weight:700;font-size:1.1rem;color:#fff;text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;';
    }
    container.appendChild(div);
  });
}

function iniciarRotacion() {
  const logos = document.querySelectorAll('.sp-logo');
  if (logos.length <= 1) return;
  detenerRotacion();
  indiceActual = 0;
  rotacionInterval = setInterval(() => {
    const prev = indiceActual;
    indiceActual = (indiceActual + 1) % logos.length;
    gsap.to(logos[prev], { duration: 0.5, opacity: 0, ease: 'power2.in' });
    gsap.to(logos[indiceActual], { duration: 0.5, opacity: 1, ease: 'power2.out' });
  }, configActual.rotationSpeed || 5000);
}

function animarEntrada() {
  detenerRotacion();
  const container = document.getElementById('sponsors-container');
  const bar = document.getElementById('sponsors-bar');
  const logosContainer = document.getElementById('sponsors-logos');
  if (timeline) timeline.kill();

  container.style.display = 'block';
  visible = true;

  // Initial state: reset any leftover transforms, then set the starting values
  gsap.set(bar, { clearProps: 'transform', x: '-110%' });
  gsap.set(logosContainer, { clearProps: 'transform', scaleY: 0, transformOrigin: 'top' });
  const logos = document.querySelectorAll('.sp-logo');
  gsap.set(logos, { clearProps: 'opacity', opacity: 0 });

  timeline = gsap.timeline({ onComplete: () => iniciarRotacion() });

  // Bar slides in from left over 0.5s with power3.out
  timeline.to(bar, {
    duration: 0.5,
    x: '0%',
    ease: 'power3.out',
  }, 0);

  // Logos container grows down 0.1s after bar starts
  timeline.to(logosContainer, {
    duration: 0.4,
    scaleY: 1,
    ease: 'power3.out',
    transformOrigin: 'top',
  }, 0.1);

  // First logo fades in 0.2s after bar started
  if (logos.length > 0) {
    timeline.to(logos[0], {
      duration: 0.3,
      opacity: 1,
      ease: 'power2.out',
    }, 0.2);
  }
}

function animarSalida() {
  detenerRotacion();
  const container = document.getElementById('sponsors-container');
  const bar = document.getElementById('sponsors-bar');
  const logosContainer = document.getElementById('sponsors-logos');
  if (timeline) timeline.kill();
  timeline = gsap.timeline({
    onComplete: () => {
      visible = false;
      container.style.display = 'none';
      // Reset all transforms so the next SHOW starts fresh
      gsap.set(bar, { clearProps: 'transform' });
      gsap.set(logosContainer, { clearProps: 'transform' });
      const logos = document.querySelectorAll('.sp-logo');
      gsap.set(logos, { clearProps: 'opacity' });
    },
  });

  // Logos container collapses over 0.25s
  timeline.to(logosContainer, {
    duration: 0.25,
    scaleY: 0,
    ease: 'power2.in',
    transformOrigin: 'top',
  }, 0);

  // Bar slides out over 0.3s, started 0.05s after logos start collapsing
  timeline.to(bar, {
    duration: 0.3,
    x: '-110%',
    ease: 'power2.in',
  }, 0.05);
}

function showDefault() {
  construirSponsors([
    { name: 'Sponsor A', logoUrl: null },
    { name: 'Sponsor B', logoUrl: null },
    { name: 'Sponsor C', logoUrl: null },
  ]);
  aplicarConfig({
    barText: 'PATROCINADO POR',
    barColor: '#e53935',
    barTextColor: '#ffffff',
    fontFamily: 'Inter, sans-serif',
    barHeight: 44,
    bgGradientTop: '#3a3a3a',
    bgGradientBottom: '#555',
    rotationSpeed: 5000,
  });
  animarEntrada();
}

function handlePayload(payload) {
  try {
    if (!payload || payload.tipo !== 'SPONSORS') return;
    if (!payload.data || typeof payload.data !== 'object') return;

    const { accion, sponsors, config } = payload.data;

    if (accion === 'SHOW') {
      if (sponsors) construirSponsors(sponsors);
      if (config) aplicarConfig(config);
      if (visible) {
        detenerRotacion();
        iniciarRotacion();
      } else {
        animarEntrada();
      }
    } else if (accion === 'UPDATE') {
      if (!visible) return;
      if (sponsors) construirSponsors(sponsors);
      if (config) aplicarConfig(config);
      detenerRotacion();
      iniciarRotacion();
    } else if (accion === 'HIDE') {
      animarSalida();
    }
  } catch (err) {
    console.error('[RENDER SPONSORS] Error:', err);
  }
}

// Demo state on load
showDefault();

// Always connect via Socket.IO
getAuthToken().then((token) => {
  const socket = io({ ...SOCKET_OPTIONS, auth: { token } });
  socket.on('connect_error', (err) => {
    console.error('[SOCKET SPONSORS] Error:', err.message);
  });

  socket.on('render-graphic', handlePayload);
});
