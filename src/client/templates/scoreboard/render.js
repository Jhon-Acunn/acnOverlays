import { io } from 'socket.io-client';
import gsap from 'gsap';
import { getAuthToken } from '../../shared/auth-token.js';
import { SOCKET_OPTIONS } from '../../shared/socket-options.js';

let timeline = null;
let visible = false;

function aplicarEstilo(estilo) {
  if (!estilo) return;
  const root = document.documentElement;
  if (estilo.fontFamily) root.style.setProperty('--sc-font', estilo.fontFamily);
  if (estilo.scoreSize) root.style.setProperty('--sc-score-size', estilo.scoreSize);
  if (estilo.teamSize) root.style.setProperty('--sc-team-size', estilo.teamSize);
  if (estilo.scoreColor) root.style.setProperty('--sc-score-color', estilo.scoreColor);
  if (estilo.teamColor) root.style.setProperty('--sc-team-color', estilo.teamColor);
  if (estilo.bgColor) root.style.setProperty('--sc-bg', estilo.bgColor);
  if (estilo.borderRadius !== undefined) root.style.setProperty('--sc-radius', estilo.borderRadius + 'px');
  if (estilo.teamABg) root.style.setProperty('--sc-teamA-bg', estilo.teamABg);
  if (estilo.teamBBg) root.style.setProperty('--sc-teamB-bg', estilo.teamBBg);
  if (estilo.dividerColor) root.style.setProperty('--sc-divider-color', estilo.dividerColor);
  if (estilo.escala !== undefined) root.style.setProperty('--sc-scale', String(estilo.escala));
  if (estilo.posY !== undefined) root.style.setProperty('--sc-posY', estilo.posY + 'px');
}

function updateData(data) {
  if (!data) return;
  const { txtEquipoA, puntosA, txtEquipoB, puntosB, estilo } = data;
  if (txtEquipoA !== undefined) document.getElementById('teamNameA').textContent = txtEquipoA || 'LOCAL';
  if (puntosA !== undefined) document.getElementById('scoreA').textContent = typeof puntosA === 'number' ? String(puntosA) : '0';
  if (txtEquipoB !== undefined) document.getElementById('teamNameB').textContent = txtEquipoB || 'VISITANTE';
  if (puntosB !== undefined) document.getElementById('scoreB').textContent = typeof puntosB === 'number' ? String(puntosB) : '0';
  if (estilo) aplicarEstilo(estilo);
}

function showDefault() {
  updateData({
    txtEquipoA: 'LOCAL',
    puntosA: 0,
    txtEquipoB: 'VISITANTE',
    puntosB: 0,
    estilo: {
      fontFamily: 'Montserrat, sans-serif',
      scoreSize: '3.5rem',
      teamSize: '1rem',
      scoreColor: '#ffffff',
      teamColor: '#aaaaaa',
      bgColor: 'rgba(0, 0, 0, 0.75)',
      borderRadius: 12,
      teamABg: 'rgba(30, 80, 200, 0.3)',
      teamBBg: 'rgba(200, 50, 50, 0.3)',
      dividerColor: '#555555',
      escala: 1.0,
      posY: 40,
    },
  });
  animarEntrada();
}

function animarEntrada() {
  const container = document.getElementById('scoreboard-container');
  if (timeline) timeline.kill();

  container.style.display = 'flex';
  visible = true;

  // Initial state: keep the centered offset (translateX -50%) intact, scale in and slide down
  gsap.set(container, {
    xPercent: -50,
    y: -40,
    opacity: 0,
    scale: 0.85,
    transformOrigin: 'center center',
  });

  const teams = container.querySelectorAll('.team');
  gsap.set(teams, { clearProps: 'opacity', opacity: 0 });

  timeline = gsap.timeline();

  // Main container entry
  timeline.to(container, {
    duration: 0.6,
    xPercent: -50,
    y: 0,
    opacity: 1,
    scale: 1,
    ease: 'power3.out',
  }, 0);

  // Each team fades in slightly staggered
  timeline.to(teams, {
    duration: 0.35,
    opacity: 1,
    ease: 'power2.out',
    stagger: 0.05,
  }, '-=0.35');
}

function animarSalida() {
  const container = document.getElementById('scoreboard-container');
  if (timeline) timeline.kill();
  visible = false;
  timeline = gsap.timeline({
    onComplete: () => {
      container.style.display = 'none';
      gsap.set(container, { clearProps: 'opacity,scale,y,xPercent' });
      const teams = container.querySelectorAll('.team');
      gsap.set(teams, { clearProps: 'opacity' });
    },
  });
  timeline.to(container, {
    duration: 0.3,
    opacity: 0,
    scale: 0.9,
    y: -20,
    ease: 'power2.in',
  });
}

function pulseUpdate() {
  const container = document.getElementById('scoreboard-container');
  if (!visible) return;
  if (timeline) timeline.kill();
  timeline = gsap.timeline();
  timeline.to(container, {
    duration: 0.12,
    scale: 1.03,
    ease: 'power2.out',
    transformOrigin: 'center center',
  });
  timeline.to(container, {
    duration: 0.2,
    scale: 1,
    ease: 'power2.inOut',
    transformOrigin: 'center center',
  });
}

function handlePayload(payload) {
  try {
    if (!payload || payload.tipo !== 'SCOREBOARD') return;
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
      pulseUpdate();
    }
  } catch (err) {
    console.error('[RENDER SCORE] Error:', err);
  }
}

// Demo state on load
showDefault();

// Always connect via Socket.IO
getAuthToken().then((token) => {
  const socket = io({ ...SOCKET_OPTIONS, auth: { token } });

  socket.on('connect_error', (err) => {
    console.error('[SOCKET SCORE] Error:', err.message);
  });

  socket.on('render-graphic', handlePayload);
});
