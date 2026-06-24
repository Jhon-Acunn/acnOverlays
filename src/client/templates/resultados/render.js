import { io } from 'socket.io-client';
import { getAuthToken } from '../../shared/auth-token.js';
import { SOCKET_OPTIONS } from '../../shared/socket-options.js';
import gsap from 'gsap';

const COLORS = {
  defA: '#3b82f6',
  defB: '#ef4444',
};

let tickerInterval = null;
let clockInterval = null;
let appVisible = false;

function formatNumber(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('es-CO');
}

function formatPercent(n) {
  if (n == null) return '—';
  return Number(n).toFixed(1) + '%';
}

function formatVotes(n) {
  if (n == null) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return formatNumber(n);
}

function updateClock() {
  const now = new Date();
  const opts = { timeZone: 'America/Bogota', hour: 'numeric', minute: '2-digit', hour12: true };
  document.getElementById('header-time').textContent = now.toLocaleTimeString('es-CO', opts);
}

function aplicarDatos(data) {
  if (!data) return;

  const { candidateA, candidateB, center, header } = data;

  if (header) {
    if (header.logo) {
      const logo = document.getElementById('logo-canal');
      logo.src = header.logo;
      logo.style.display = 'block';
    }
    if (header.date) document.getElementById('header-date').textContent = header.date;
    if (header.escrutinio !== undefined) {
      document.getElementById('header-escrutinio').textContent = formatPercent(header.escrutinio) + ' MESAS INFORMADAS';
    }
  }

  const aColor = candidateA?.color || COLORS.defA;
  const bColor = candidateB?.color || COLORS.defB;

  if (candidateA) {
    if (candidateA.photo) {
      document.getElementById('candidateA-photo').style.backgroundImage = 'url(' + candidateA.photo + ')';
    }
    if (candidateA.name) document.getElementById('candidateA-name').textContent = candidateA.name;
    if (candidateA.party) document.getElementById('candidateA-party').textContent = candidateA.party;
    if (candidateA.percent !== undefined) document.getElementById('candidateA-percent').textContent = formatPercent(candidateA.percent);
    if (candidateA.totalVotes !== undefined) document.getElementById('candidateA-votes').textContent = formatVotes(candidateA.totalVotes);

    document.getElementById('candidateA-name').style.color = aColor;
    document.getElementById('candidateA-percent').style.color = aColor;
    document.getElementById('candidateA-votes').style.color = aColor;
    document.getElementById('candidateA-bar').style.color = aColor;
    const wrapA = document.querySelector('#left-zone .candidate-photo-wrap');
    if (wrapA) wrapA.style.setProperty('--glow-color', aColor);
  }

  if (candidateB) {
    if (candidateB.photo) {
      document.getElementById('candidateB-photo').style.backgroundImage = 'url(' + candidateB.photo + ')';
    }
    if (candidateB.name) document.getElementById('candidateB-name').textContent = candidateB.name;
    if (candidateB.party) document.getElementById('candidateB-party').textContent = candidateB.party;
    if (candidateB.percent !== undefined) document.getElementById('candidateB-percent').textContent = formatPercent(candidateB.percent);
    if (candidateB.totalVotes !== undefined) document.getElementById('candidateB-votes').textContent = formatVotes(candidateB.totalVotes);

    document.getElementById('candidateB-name').style.color = bColor;
    document.getElementById('candidateB-percent').style.color = bColor;
    document.getElementById('candidateB-votes').style.color = bColor;
    document.getElementById('candidateB-bar').style.color = bColor;
    const wrapB = document.querySelector('#right-zone .candidate-photo-wrap');
    if (wrapB) wrapB.style.setProperty('--glow-color', bColor);
  }

  const pA = candidateA?.percent || 0;
  const pB = candidateB?.percent || 0;
  const total = pA + pB || 1;

  document.getElementById('candidateA-bar').style.width = (pA / total * 100) + '%';
  document.getElementById('candidateB-bar').style.width = (pB / total * 100) + '%';
  document.getElementById('comp-bar-A').style.width = (pA / 100 * 100) + '%';
  document.getElementById('comp-bar-B').style.width = (pB / 100 * 100) + '%';

  if (center) {
    if (center.participation !== undefined) {
      document.getElementById('comp-participation').textContent = formatPercent(center.participation);
    }
    if (center.topDepartment) {
      document.getElementById('comp-top-dept').textContent = center.topDepartment;
    }
    if (center.tendency) {
      document.getElementById('comp-tendency').textContent = center.tendency;
    }
    if (center.difference !== undefined) {
      document.getElementById('comp-diff').textContent = formatPercent(Math.abs(center.difference));
    }
  }

  const totalVotes = (candidateA?.totalVotes || 0) + (candidateB?.totalVotes || 0);
  document.getElementById('comp-total-votes').textContent = formatNumber(totalVotes);
}

function initTicker(messages) {
  const track = document.getElementById('ticker-track');
  const content = document.getElementById('ticker-content');
  const defaultMsgs = [
    'Registraduría Nacional actualiza resultados',
    'Participación nacional supera el 62%',
    'Boyacá reporta 98% de mesas escrutadas',
  ];
  const msgs = messages && messages.length ? messages : defaultMsgs;

  if (tickerInterval) clearInterval(tickerInterval);

  let idx = 0;
  function updateTicker() {
    content.textContent = '✦  ' + msgs[idx] + '  ✦';
    idx = (idx + 1) % msgs.length;

    gsap.set(track, { x: 1920 });
    gsap.to(track, {
      x: -track.offsetWidth,
      duration: 12,
      ease: 'none',
      onComplete: () => {
        gsap.set(track, { x: 1920 });
        updateTicker();
      },
    });
  }

  updateTicker();
  tickerInterval = setInterval(updateTicker, 12000);
}

function mostrar(data) {
  if (!data) return;
  aplicarDatos(data);
  if (data.ticker) initTicker(data.ticker.messages);

  if (appVisible) return;

  appVisible = true;
  gsap.fromTo('#app', { opacity: 0 }, { duration: 0.6, opacity: 1, ease: 'power2.out' });
  gsap.fromTo('#top-bar', { y: -60 }, { duration: 0.5, y: 0, ease: 'power3.out' });
  gsap.fromTo('#bottom-ticker', { y: 40 }, { duration: 0.5, y: 0, ease: 'power3.out' });
  gsap.fromTo('.candidate-zone', { opacity: 0, y: 30 }, { duration: 0.5, y: 0, opacity: 1, ease: 'power2.out', stagger: 0.1 });
  gsap.fromTo('#center-zone', { opacity: 0, scale: 0.95 }, { duration: 0.5, opacity: 1, scale: 1, ease: 'power2.out' });
}

function showDefault() {
  mostrar({
    candidateA: {
      name: 'Candidato A',
      party: 'Partido Ejemplo',
      color: '#3b82f6',
      percent: 45.2,
      totalVotes: 1234567,
    },
    candidateB: {
      name: 'Candidato B',
      party: 'Partido Ejemplo',
      color: '#ef4444',
      percent: 42.8,
      totalVotes: 1198765,
    },
    center: {
      participation: 62.5,
      topDepartment: 'Boyacá',
      tendency: '↑ Estable',
      difference: 2.4,
    },
    header: {
      date: '21 JUNIO 2026',
      escrutinio: 94.72,
    },
    ticker: {
      messages: [
        'Registraduría Nacional actualiza resultados',
        'Participación nacional supera el 62%',
        'Boyacá reporta 98% de mesas escrutadas',
      ],
    },
  });
}

function handlePayload(payload) {
  try {
    if (!payload || payload.tipo !== 'RESULTADOS') return;
    if (!payload.data || typeof payload.data !== 'object') return;

    const { accion, data } = payload.data;

    if (accion === 'SHOW') {
      if (data) aplicarDatos(data);
      if (data?.ticker) initTicker(data.ticker.messages);
      mostrar(data);
    } else if (accion === 'UPDATE') {
      if (!appVisible) return;
      if (data) aplicarDatos(data);
      if (data?.ticker) initTicker(data.ticker.messages);
    } else if (accion === 'HIDE') {
      appVisible = false;
      gsap.to('#app', { duration: 0.3, opacity: 0, ease: 'power2.in' });
      if (tickerInterval) clearInterval(tickerInterval);
    }
  } catch (err) {
    console.error('[RENDER RESULTADOS] Error:', err);
  }
}

if (clockInterval) clearInterval(clockInterval);
clockInterval = setInterval(updateClock, 1000);
updateClock();

// Demo state on load
showDefault();

// Always connect via Socket.IO
getAuthToken().then((token) => {
  const socket = io({ ...SOCKET_OPTIONS, auth: { token } });
  socket.on('connect_error', (err) => {
    console.error('[SOCKET RESULTADOS] Error:', err.message);
  });

  socket.on('render-graphic', handlePayload);
});
