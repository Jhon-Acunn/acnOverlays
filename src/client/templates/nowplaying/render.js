import { io } from 'socket.io-client';
import gsap from 'gsap';

const isPreview = window.location.search.includes('preview=1');

let npTimeline = null;
let npVisible = false;

// ── Style ──

function aplicarEstiloNP(estilo) {
  if (!estilo) return;
  const container = document.getElementById('np-container');
  const bar = document.getElementById('np-bar');
  const song = document.getElementById('np-song');
  const artist = document.getElementById('np-artist');
  const cover = document.getElementById('np-cover-container');
  if (estilo.fontFamily) container.style.fontFamily = estilo.fontFamily;
  if (estilo.barText) bar.textContent = estilo.barText;
  if (estilo.barBg) bar.style.background = estilo.barBg;
  if (estilo.barColor) bar.style.color = estilo.barColor;
  if (estilo.barSize) bar.style.fontSize = estilo.barSize;
  if (estilo.songSize) song.style.fontSize = estilo.songSize;
  if (estilo.songColor) song.style.color = estilo.songColor;
  if (estilo.artistSize) artist.style.fontSize = estilo.artistSize;
  if (estilo.artistColor) artist.style.color = estilo.artistColor;
  if (estilo.bgColor) container.style.background = estilo.bgColor;
  if (estilo.borderRadius) container.style.borderRadius = estilo.borderRadius + 'px';
  if (estilo.opacity !== undefined) container.style.opacity = estilo.opacity;
  if (estilo.posX !== undefined) container.style.left = estilo.posX + 'px';
  if (estilo.posY !== undefined) container.style.bottom = estilo.posY + 'px';
  if (estilo.showCover !== undefined) cover.style.display = estilo.showCover ? '' : 'none';
  if (estilo.maxWidth) container.style.maxWidth = estilo.maxWidth;
}

// ── UI Update ──

function actualizarNPUI(data) {
  if (!data) return;
  document.getElementById('np-song').textContent = data.song || '';
  document.getElementById('np-artist').textContent = data.artist || '';
  const coverImg = document.getElementById('np-cover');
  const coverContainer = document.getElementById('np-cover-container');
  if (data.coverUrl) {
    coverImg.src = data.coverUrl;
    coverContainer.style.display = '';
  } else {
    coverImg.src = '';
    coverContainer.style.display = 'none';
  }
}

// ── Animations ──

function animEntradaNP() {
  const container = document.getElementById('np-container');
  container.style.display = 'flex';
  if (npTimeline) npTimeline.kill();
  gsap.set(container, { opacity: 0, x: -30 });
  npTimeline = gsap.timeline()
    .to(container, { duration: 0.4, opacity: 1, x: 0, ease: 'power3.out' });
  npVisible = true;
}

function animSalidaNP() {
  const container = document.getElementById('np-container');
  if (npTimeline) npTimeline.kill();
  npTimeline = gsap.timeline({
    onComplete: () => {
      container.style.display = 'none';
      gsap.set(container, { clearProps: 'opacity,x' });
      npVisible = false;
    }
  })
    .to(container, { duration: 0.3, opacity: 0, x: -30, ease: 'power2.in' });
}

// ── Main ──

function mostrarNowPlaying(cfg) {
  const { song, artist, coverUrl, estilo } = cfg;
  actualizarNPUI({ song, artist, coverUrl });
  aplicarEstiloNP(estilo);
  animEntradaNP();
}

function ocultarNowPlaying() {
  animSalidaNP();
}

// ── Preview ──

if (isPreview) {
  window.addEventListener('message', (e) => {
    if (e.source !== window.parent) return;
    try {
      const msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (!msg || !msg.tipo) return;
      if (msg.tipo === 'PREVIEW_NOWPLAYING') {
        document.getElementById('np-container').style.display = 'none';
        gsap.set(document.getElementById('np-container'), { clearProps: 'all' });
        mostrarNowPlaying(msg.data);
      }
    } catch (_) { /* ignore */ }
  });

  mostrarNowPlaying({
    song: 'Blinding Lights',
    artist: 'The Weeknd',
    coverUrl: null,
    estilo: {
      fontFamily: 'Inter, sans-serif',
      barText: 'NOW PLAYING',
      barBg: '#1db954',
      barColor: '#ffffff',
      barSize: '0.6rem',
      songSize: '1rem',
      songColor: '#ffffff',
      artistSize: '0.75rem',
      artistColor: 'rgba(255,255,255,0.6)',
      bgColor: 'rgba(0,0,0,0.65)',
      borderRadius: 12,
      opacity: 1,
      posX: 32,
      posY: 96,
      showCover: false,
      maxWidth: '320px',
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
    console.error('[SOCKET NP] Error:', err.message);
  });

  socket.on('render-graphic', (payload) => {
    try {
      if (!payload || payload.tipo !== 'NOWPLAYING') return;
      const { accion, song, artist, coverUrl, estilo } = payload.data || {};
      if (accion === 'SHOW') {
        mostrarNowPlaying({ song, artist, coverUrl, estilo });
      } else if (accion === 'HIDE') {
        ocultarNowPlaying();
      } else if (accion === 'UPDATE' && npVisible) {
        actualizarNPUI({ song, artist, coverUrl });
        if (estilo) aplicarEstiloNP(estilo);
      }
    } catch (err) {
      console.error('[RENDER NP] Error:', err);
    }
  });
}
