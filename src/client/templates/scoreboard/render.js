import { io } from 'socket.io-client';
import gsap from 'gsap';

const socket = io({
  reconnectionDelay: 1000,
  reconnectionAttempts: 10
});

socket.on('connect_error', (err) => {
  console.error('[SOCKET SCORE] Error:', err.message);
});

socket.on('render-graphic', (payload) => {
  try {
    if (!payload || payload.tipo !== 'SCOREBOARD') return;
    if (!payload.data || typeof payload.data !== 'object') return;

    const { txtEquipoA, puntosA, txtEquipoB, puntosB } = payload.data;

    const elTeamA = document.getElementById('teamNameA');
    const elScoreA = document.getElementById('scoreA');
    const elTeamB = document.getElementById('teamNameB');
    const elScoreB = document.getElementById('scoreB');
    if (!elTeamA || !elScoreA || !elTeamB || !elScoreB) return;

    elTeamA.innerText = typeof txtEquipoA === 'string' ? txtEquipoA : 'LOCAL';
    elScoreA.innerText = typeof puntosA === 'number' ? String(puntosA) : '0';
    elTeamB.innerText = typeof txtEquipoB === 'string' ? txtEquipoB : 'VISITANTE';
    elScoreB.innerText = typeof puntosB === 'number' ? String(puntosB) : '0';

    const container = document.getElementById('scoreboard-container');
    if (!container) return;

    if (window.__scoreTL) window.__scoreTL.kill();
    window.__scoreTL = gsap.timeline()
      .set(container, { xPercent: -50, y: -20 })
      .to(container, { duration: 0.3, xPercent: -50, y: 0, ease: 'power2.out' });
  } catch (err) {
    console.error('[RENDER SCORE] Error:', err);
  }
});
