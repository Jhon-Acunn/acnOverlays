import { io } from 'socket.io-client';
import { getAuthToken } from '../../shared/auth-token.js';
import { SOCKET_OPTIONS } from '../../shared/socket-options.js';
import gsap from 'gsap';

/* ═══════════════════════════════════════════
   SPONSORS
   ═══════════════════════════════════════════ */
let spRotacionInterval = null;
let spIndiceActual = 0;
let spTimeline = null;
let spSponsorsData = [];
let spConfigActual = {};
let spVisible = false;

function spDetenerRotacion() {
  if (spRotacionInterval) {
    clearInterval(spRotacionInterval);
    spRotacionInterval = null;
  }
}

function spAplicarConfig(cfg) {
  if (!cfg) return;
  spConfigActual = cfg;
  const root = document.documentElement;
  const bar = document.getElementById('sponsors-bar');
  const container = document.getElementById('sponsors-container');
  if (cfg.barColor) root.style.setProperty('--sp-bar-bg', cfg.barColor);
  if (cfg.barTextColor) root.style.setProperty('--sp-bar-color', cfg.barTextColor);
  if (bar) bar.textContent = cfg.barText || 'PATROCINADO POR';
  if (cfg.fontFamily && container) container.style.fontFamily = cfg.fontFamily;
  if (cfg.barHeight) root.style.setProperty('--sp-bar-h', cfg.barHeight + 'px');
  const logosContainer = document.getElementById('sponsors-logos');
  if (cfg.bgGradientTop && cfg.bgGradientBottom) {
    logosContainer.style.background = `linear-gradient(180deg, ${cfg.bgGradientTop} 0%, ${cfg.bgGradientBottom} 100%)`;
  }
  // Scale + position (same as standalone sponsors template)
  if (container) {
    const escala = (cfg.escala !== undefined && !isNaN(cfg.escala)) ? cfg.escala : 1.0;
    const px = (cfg.posX !== undefined && !isNaN(cfg.posX)) ? cfg.posX : 0;
    const py = (cfg.posY !== undefined && !isNaN(cfg.posY)) ? cfg.posY : 0;
    container.style.transformOrigin = 'top left';
    container.style.transform = `translate(${px}px, ${py}px) scale(${escala})`;
  }
}

function spConstruirSponsors(lista) {
  spSponsorsData = lista || [];
  const container = document.getElementById('sponsors-logos-inner');
  container.innerHTML = '';
  if (!spSponsorsData.length) {
    const placeholder = document.createElement('div');
    placeholder.className = 'sp-logo';
    placeholder.textContent = 'SIN PATROCINADORES';
    placeholder.style.cssText = 'opacity:1;position:static;transform:none;display:flex;align-items:center;justify-content:center;width:100%;padding:0 1rem;font-weight:700;font-size:0.9rem;color:#888;text-align:center;';
    container.appendChild(placeholder);
    return;
  }
  spSponsorsData.forEach((sp, idx) => {
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

function spIniciarRotacion() {
  const logos = document.querySelectorAll('.sp-logo');
  if (logos.length <= 1) return;
  spDetenerRotacion();
  spIndiceActual = 0;
  spRotacionInterval = setInterval(() => {
    const prev = spIndiceActual;
    spIndiceActual = (spIndiceActual + 1) % logos.length;
    gsap.to(logos[prev], { duration: 0.5, opacity: 0, ease: 'power2.in' });
    gsap.to(logos[spIndiceActual], { duration: 0.5, opacity: 1, ease: 'power2.out' });
  }, spConfigActual.rotationSpeed || 5000);
}

function spAnimEntrada() {
  spDetenerRotacion();
  const container = document.getElementById('sponsors-container');
  const bar = document.getElementById('sponsors-bar');
  const logosContainer = document.getElementById('sponsors-logos');
  container.style.display = 'block';
  spVisible = true;
  if (spTimeline) spTimeline.kill();
  spTimeline = gsap.timeline({ onComplete: () => spIniciarRotacion() });
  gsap.set('.sp-logo', { opacity: 0 });
  if (document.querySelectorAll('.sp-logo').length > 0) {
    gsap.set(document.querySelectorAll('.sp-logo')[0], { opacity: 1 });
  }
  gsap.set(bar, { x: '-110%' });
  gsap.set(logosContainer, { scaleY: 0, transformOrigin: 'top' });
  spTimeline.to(bar, {
    duration: 0.6, x: '0%', ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  });
  spTimeline.to(logosContainer, {
    duration: 0.4, scaleY: 1, ease: 'power2.out',
  }, '-=0.1');
}

function spAnimSalida() {
  spDetenerRotacion();
  const bar = document.getElementById('sponsors-bar');
  const logosContainer = document.getElementById('sponsors-logos');
  if (spTimeline) spTimeline.kill();
  spTimeline = gsap.timeline({
    onComplete: () => {
      spVisible = false;
      const container = document.getElementById('sponsors-container');
      container.style.display = 'none';
    },
  });
  spTimeline.to(logosContainer, { duration: 0.3, scaleY: 0, ease: 'power2.in' });
  spTimeline.to(bar, { duration: 0.3, x: '-110%', ease: 'power2.in' }, '-=0.1');
}

function spMostrar(data) {
  if (!data) return;
  const { sponsors, config } = data;
  spConstruirSponsors(sponsors || []);
  spAplicarConfig(config);
  spAnimEntrada();
}

function spUpdate(data) {
  if (!spVisible || !data) return;
  const { sponsors, config } = data;
  if (sponsors) spConstruirSponsors(sponsors);
  if (config) spAplicarConfig(config);
  spDetenerRotacion();
  spIniciarRotacion();
}

/* ═══════════════════════════════════════════
   LOWER THIRD DUAL
   ═══════════════════════════════════════════ */
let ltTimeline = null;
let ltLeftVisible = false;
let ltRightVisible = false;

function ltAplicarEstilo(prefix, estilo) {
  if (!estilo || !prefix) return;
  const body = document.body;
  const nombreEl = document.getElementById(prefix + '-nombre');
  const apellidoEl = document.getElementById(prefix + '-apellido');
  const cargoEl = document.getElementById(prefix + '-cargo');
  const inner = document.getElementById(prefix + '-inner');
  const container = document.getElementById(prefix + '-container');
  if (!nombreEl) return;
  if (estilo.fontFamily) body.style.fontFamily = estilo.fontFamily;
  if (estilo.titleFontSize) {
    nombreEl.style.fontSize = estilo.titleFontSize;
    apellidoEl.style.fontSize = estilo.titleFontSize;
  }
  if (estilo.titleColor) {
    nombreEl.style.color = estilo.titleColor;
    apellidoEl.style.color = estilo.titleColor;
  }
  if (estilo.titleBg) document.getElementById(prefix + '-name-box').style.background = estilo.titleBg;
  if (estilo.subtitleFontSize) cargoEl.style.fontSize = estilo.subtitleFontSize;
  if (estilo.subtitleColor) cargoEl.style.color = estilo.subtitleColor;
  if (estilo.subtitleBg) {
    document.getElementById(prefix + '-title-box').style.background = estilo.subtitleBg;
    document.getElementById(prefix + '-name-ghost').style.background = estilo.subtitleBg;
  }
  if (estilo.escala) inner.style.transform = 'scale(' + estilo.escala + ')';
  if (estilo.posX !== undefined) {
    if (prefix === 'ltl') container.style.left = estilo.posX + 'px';
    else container.style.right = estilo.posX + 'px';
  }
  if (estilo.posY !== undefined) container.style.bottom = estilo.posY + 'px';
}

function ltSetTexts(prefix, data) {
  if (!data) return;
  if (data.nombre !== undefined) document.getElementById(prefix + '-nombre').textContent = data.nombre || '';
  if (data.apellido !== undefined) document.getElementById(prefix + '-apellido').textContent = data.apellido || '';
  if (data.cargo !== undefined) document.getElementById(prefix + '-cargo').textContent = (data.cargo || '').toUpperCase();
  if (data.estilo) ltAplicarEstilo(prefix, data.estilo);
}

function ltEntryLeft() {
  const tl = gsap.timeline();
  const container = document.getElementById('ltl-container');
  container.style.display = 'block';
  gsap.set('#ltl-name-group', { xPercent: -110 });
  gsap.set('#ltl-name-ghost', { scaleX: 0, transformOrigin: 'left' });
  gsap.set('#ltl-name-text', { opacity: 0 });
  gsap.set('#ltl-title-box', { scaleY: 0, transformOrigin: 'top' });
  tl.to('#ltl-name-group', { duration: 0.8, xPercent: 0, ease: 'power4.out' });
  tl.to('#ltl-name-ghost', { duration: 0.35, scaleX: 1, ease: 'power3.out', transformOrigin: 'left' }, '-=0.4');
  tl.to('#ltl-name-text', { duration: 0.3, opacity: 1, ease: 'power2.out' }, '-=0.3');
  tl.to('#ltl-title-box', { duration: 0.45, scaleY: 1, ease: 'back.out(1.6)', transformOrigin: 'top' }, '-=0.15');
  return tl;
}

function ltEntryRight() {
  const tl = gsap.timeline();
  const container = document.getElementById('ltr-container');
  container.style.display = 'block';
  gsap.set('#ltr-name-group', { xPercent: 110 });
  gsap.set('#ltr-name-ghost', { scaleX: 0, transformOrigin: 'right' });
  gsap.set('#ltr-name-text', { opacity: 0 });
  gsap.set('#ltr-title-box', { scaleY: 0, transformOrigin: 'top' });
  tl.to('#ltr-name-group', { duration: 0.8, xPercent: 0, ease: 'power4.out' });
  tl.to('#ltr-name-ghost', { duration: 0.35, scaleX: 1, ease: 'power3.out', transformOrigin: 'right' }, '-=0.4');
  tl.to('#ltr-name-text', { duration: 0.3, opacity: 1, ease: 'power2.out' }, '-=0.3');
  tl.to('#ltr-title-box', { duration: 0.45, scaleY: 1, ease: 'back.out(1.6)', transformOrigin: 'top' }, '-=0.15');
  return tl;
}

function ltExitLeft() {
  const tl = gsap.timeline({
    onComplete: () => {
      const c = document.getElementById('ltl-container');
      c.style.display = 'none';
      gsap.set('#ltl-name-group', { clearProps: 'xPercent' });
      gsap.set('#ltl-name-ghost', { clearProps: 'transform' });
      gsap.set('#ltl-title-box', { clearProps: 'transform' });
      gsap.set('#ltl-name-text', { opacity: 0 });
      ltLeftVisible = false;
    },
  });
  tl.to('#ltl-title-box', { duration: 0.2, scaleY: 0, ease: 'power2.in', transformOrigin: 'top' });
  tl.to('#ltl-name-text', { duration: 0.15, opacity: 0, ease: 'power2.in' }, '-=0.1');
  tl.to('#ltl-name-group', { duration: 0.45, xPercent: -110, ease: 'power3.in' }, '-=0.1');
  return tl;
}

function ltExitRight() {
  const tl = gsap.timeline({
    onComplete: () => {
      const c = document.getElementById('ltr-container');
      c.style.display = 'none';
      gsap.set('#ltr-name-group', { clearProps: 'xPercent' });
      gsap.set('#ltr-name-ghost', { clearProps: 'transform' });
      gsap.set('#ltr-title-box', { clearProps: 'transform' });
      gsap.set('#ltr-name-text', { opacity: 0 });
      ltRightVisible = false;
    },
  });
  tl.to('#ltr-title-box', { duration: 0.2, scaleY: 0, ease: 'power2.in', transformOrigin: 'top' });
  tl.to('#ltr-name-text', { duration: 0.15, opacity: 0, ease: 'power2.in' }, '-=0.1');
  tl.to('#ltr-name-group', { duration: 0.45, xPercent: 110, ease: 'power3.in' }, '-=0.1');
  return tl;
}

function ltMostrar(left, right) {
  if (ltTimeline) ltTimeline.kill();
  ltTimeline = gsap.timeline();
  if (left) {
    ltSetTexts('ltl', left);
    if (!ltLeftVisible) ltTimeline.add(ltEntryLeft(), 0);
  }
  if (right) {
    ltSetTexts('ltr', right);
    if (!ltRightVisible) ltTimeline.add(ltEntryRight(), 0);
  }
  if (left) ltLeftVisible = true;
  if (right) ltRightVisible = true;
}

function ltUpdate(left, right) {
  if (left && ltLeftVisible) ltSetTexts('ltl', left);
  if (right && ltRightVisible) ltSetTexts('ltr', right);
}

/* ═══════════════════════════════════════════
   TICKER
   ═══════════════════════════════════════════ */
let tkAnimacion = null;
let tkSpeed = 80;
let tkTimeline = null;
let tkAnimTimeline = null;
let tkVisible = false;

function tkrReset() {
  if (tkAnimacion) {
    cancelAnimationFrame(tkAnimacion);
    tkAnimacion = null;
  }
  if (tkTimeline) tkTimeline.kill();
  if (tkAnimTimeline) { tkAnimTimeline.kill(); tkAnimTimeline = null; }
  const track = document.getElementById('tkr-track');
  if (track) {
    gsap.set(track, { clearProps: 'all' });
  }
  const msg = document.getElementById('tkr-message');
  if (msg) {
    msg.style.transform = '';
    msg.innerHTML = '';
  }
}

// Reusable hidden measurer for ticker clone sizing
const tkrMeasurer = (() => {
  const el = document.createElement('div');
  el.style.cssText = 'display:flex;align-items:center;white-space:nowrap;height:100%;position:fixed;visibility:hidden;pointer-events:none;z-index:-1;';
  document.body.appendChild(el);
  return el;
})();

function tkrClonar(contenido) {
  // Guard: empty content
  if (!contenido) return { el: null, half: 0 };

  // Duplicate content N times until total width >= 2x track width, N always even
  const track = document.getElementById('tkr-track');
  const clone = document.createElement('div');
  clone.style.cssText = 'display:flex;align-items:center;white-space:nowrap;height:100%;';
  clone.innerHTML = contenido;
  const trackW = track.clientWidth || 1920;
  tkrMeasurer.innerHTML = contenido;
  const unitW = tkrMeasurer.offsetWidth || 400;
  tkrMeasurer.innerHTML = '';
  let copies = Math.ceil((trackW * 2) / unitW) + 1;
  if (copies % 2 !== 0) copies++;
  let html = '';
  for (let i = 0; i < copies; i++) html += contenido;
  clone.innerHTML = html;
  return { el: clone, half: (unitW * copies) / 2 };
}

function tkrIniciarAnimacion() {
  const track = document.getElementById('tkr-track');
  const msg = document.getElementById('tkr-message');
  if (!track || !msg) return;
  tkSpeed = parseFloat(document.documentElement.style.getPropertyValue('--tkr-speed')) || 80;
  const raw = msg.innerHTML;
  if (!raw) return;
  tkrReset();
  const { el, half } = tkrClonar(raw);
  if (!el) return; // empty content
  msg.innerHTML = '';
  msg.appendChild(el);
  msg.style.transform = 'translateX(0px)';
  const startX = 0 - (half / 2);
  const endX = startX - half;
  gsap.set(msg, { x: startX });
  const duration = half / tkSpeed;
  if (tkTimeline) tkTimeline.kill();
  tkTimeline = gsap.timeline({ repeat: -1 });
  tkTimeline.to(msg, { x: endX, duration, ease: 'none' });
}

function tkrAplicarConfig(data) {
  const container = document.getElementById('tkr-container');
  container.style.display = 'flex';
  const root = document.documentElement;
  if (data.fontFamily) root.style.setProperty('--tkr-font', data.fontFamily);
  if (data.title) document.getElementById('tkr-title').textContent = data.title;
  if (data.titleSize) root.style.setProperty('--tkr-title-size', data.titleSize + 'px');
  if (data.titleColor) root.style.setProperty('--tkr-title-color', data.titleColor);
  if (data.titleBg) root.style.setProperty('--tkr-bar-bg', data.titleBg);
  if (data.fontSize) root.style.setProperty('--tkr-font-size', data.fontSize + 'px');
  if (data.msgColor) root.style.setProperty('--tkr-msg-color', data.msgColor);
  if (data.msgBg) root.style.setProperty('--tkr-msg-bg', data.msgBg);
  if (data.speed) root.style.setProperty('--tkr-speed', String(data.speed));
  if (data.logoWidth) root.style.setProperty('--tkr-logo-w', data.logoWidth + '%');
  const msg = document.getElementById('tkr-message');
  if (data.message) {
    let html = '';
    if (data.logoUrl) {
      html += `<img id="tkr-logo-img" src="${data.logoUrl}" alt="" style="height:80%;width:auto;margin-right:16px;flex-shrink:0;object-fit:contain;">`;
    }
    html += `<span>${data.message}</span>`;
    msg.innerHTML = html;
  }
}

function tkrAnimSalida() {
  const container = document.getElementById('tkr-container');
  // Exit: slide out to the bottom. Keep the ticker scroll running so the
  // text slides out together with the container. Only reset content after.
  if (tkAnimTimeline) { tkAnimTimeline.kill(); tkAnimTimeline = null; }
  tkAnimTimeline = gsap.timeline({
    onComplete: () => {
      tkrReset();
      container.style.display = 'none';
      gsap.set(container, { clearProps: 'y' });
      tkVisible = false;
      tkAnimTimeline = null;
    },
  });
  tkAnimTimeline.to(container, {
    y: '100%',
    duration: 0.45,
    ease: 'power2.in',
  });
}

function tkrAnimEntrada(data) {
  const container = document.getElementById('tkr-container');
  tkVisible = true;
  tkrAplicarConfig(data);
  // Entrance: slide in from the bottom. Start the ticker scroll immediately
  // so the text slides in together with the container, not after it.
  container.style.display = 'flex';
  gsap.set(container, { y: '100%' });
  tkrIniciarAnimacion();
  if (tkAnimTimeline) { tkAnimTimeline.kill(); tkAnimTimeline = null; }
  tkAnimTimeline = gsap.timeline({
    onComplete: () => { tkAnimTimeline = null; },
  });
  tkAnimTimeline.to(container, {
    y: '0%',
    duration: 0.6,
    ease: 'power3.out',
  });
}

function tkrUpdate(data) {
  if (!tkVisible || !data) return;
  tkrAplicarConfig(data);
  tkrIniciarAnimacion();
}

/* ═══════════════════════════════════════════
   LIVE BUG
   ═══════════════════════════════════════════ */
const WEATHER_API = 'https://wttr.in';

let lbTimeline = null;
let lbVisible = false;
let lbTempInterval = null;
let lbCurrentCity = '';

function lbAplicarEstilo(estilo) {
  if (!estilo) return;
  const body = document.body;
  const lugarEl = document.getElementById('lb-lugar');
  const ciudadTempEl = document.getElementById('lb-ciudad-temp');
  const inner = document.getElementById('lb-inner');
  const container = document.getElementById('lb-container');
  if (estilo.fontFamily) body.style.fontFamily = estilo.fontFamily;
  if (estilo.titleFontSize) lugarEl.style.fontSize = estilo.titleFontSize;
  if (estilo.titleColor) lugarEl.style.color = estilo.titleColor;
  if (estilo.titleBg) document.getElementById('lb-name-box').style.background = estilo.titleBg;
  if (estilo.subtitleFontSize) ciudadTempEl.style.fontSize = estilo.subtitleFontSize;
  if (estilo.subtitleColor) ciudadTempEl.style.color = estilo.subtitleColor;
  if (estilo.subtitleBg) {
    document.getElementById('lb-title-box').style.background = estilo.subtitleBg;
    document.getElementById('lb-name-ghost').style.background = estilo.subtitleBg;
  }
  if (estilo.escala) inner.style.transform = 'scale(' + estilo.escala + ')';
  if (estilo.posX !== undefined) container.style.left = estilo.posX + 'px';
  if (estilo.posY !== undefined) container.style.top = estilo.posY + 'px';
}

async function lbFetchTemp(ciudad) {
  if (!ciudad) return null;
  try {
    const url = `${WEATHER_API}/${encodeURIComponent(ciudad)}?format=j1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const cc = json.current_condition?.[0];
    if (!cc) return null;
    return cc.temp_C || null;
  } catch {
    return null;
  }
}

function lbRenderCiudadTemp(ciudad, temp) {
  const t = temp != null ? `${temp}°C` : '--°C';
  document.getElementById('lb-ciudad-temp').textContent = `${(ciudad || '').toUpperCase()} ${t}`;
}

function lbUpdateData(data) {
  if (!data) return;
  const { lugar, ciudad, refreshInterval, estilo } = data;
  if (lugar !== undefined)
    document.getElementById('lb-lugar').textContent = (lugar || '').toUpperCase();
  if (estilo) lbAplicarEstilo(estilo);
  if (ciudad !== undefined && ciudad !== lbCurrentCity) {
    lbCurrentCity = ciudad;
    if (lbTempInterval) {
      clearInterval(lbTempInterval);
      lbTempInterval = null;
    }
    if (ciudad) {
      lbFetchTemp(ciudad).then((t) => lbRenderCiudadTemp(ciudad, t));
      lbTempInterval = setInterval(() => {
        lbFetchTemp(lbCurrentCity).then((t) => lbRenderCiudadTemp(lbCurrentCity, t));
      }, refreshInterval || 1800000);
    } else {
      lbRenderCiudadTemp('', null);
    }
  } else if (ciudad !== undefined && refreshInterval) {
    if (lbTempInterval) {
      clearInterval(lbTempInterval);
      lbTempInterval = null;
    }
    if (lbCurrentCity) {
      lbTempInterval = setInterval(() => {
        lbFetchTemp(lbCurrentCity).then((t) => lbRenderCiudadTemp(lbCurrentCity, t));
      }, refreshInterval);
    }
  }
}

function lbAnimEntrada() {
  if (lbTimeline) lbTimeline.kill();
  const container = document.getElementById('lb-container');
  container.style.display = 'block';
  lbVisible = true;
  gsap.set('#lb-name-group', { xPercent: -110 });
  gsap.set('#lb-name-ghost', { scaleX: 0, transformOrigin: 'left' });
  gsap.set('#lb-name-text', { opacity: 0 });
  gsap.set('#lb-title-box', { scaleY: 0, transformOrigin: 'top' });
  lbTimeline = gsap.timeline();
  lbTimeline.to('#lb-name-group', { duration: 1.0, xPercent: 0, ease: 'power4.out' });
  lbTimeline.to('#lb-name-ghost', { duration: 0.4, scaleX: 1, ease: 'power3.out', transformOrigin: 'left' }, '-=0.5');
  lbTimeline.to('#lb-name-text', { duration: 0.35, opacity: 1, ease: 'power2.out' }, '-=0.35');
  lbTimeline.to('#lb-title-box', { duration: 0.55, scaleY: 1, ease: 'back.out(1.6)', transformOrigin: 'top' }, '-=0.2');
}

function lbAnimSalida() {
  if (lbTimeline) lbTimeline.kill();
  lbTimeline = gsap.timeline({
    onComplete: () => {
      const container = document.getElementById('lb-container');
      container.style.display = 'none';
      lbVisible = false;
      gsap.set('#lb-name-group', { clearProps: 'xPercent' });
      gsap.set('#lb-name-ghost', { clearProps: 'transform' });
      gsap.set('#lb-title-box', { clearProps: 'transform' });
      gsap.set('#lb-name-text', { opacity: 0 });
    },
  });
  lbTimeline.to('#lb-title-box', { duration: 0.25, scaleY: 0, ease: 'power2.in', transformOrigin: 'top' });
  lbTimeline.to('#lb-name-text', { duration: 0.2, opacity: 0, ease: 'power2.in' }, '-=0.1');
  lbTimeline.to('#lb-name-group', { duration: 0.55, xPercent: -110, ease: 'power3.in' }, '-=0.1');
}

/* ═══════════════════════════════════════════
   DEFAULT DEMO STATE
   ═══════════════════════════════════════════ */
function showDefault() {
  spMostrar({
    sponsors: [
      { name: 'Sponsor A', logoUrl: null },
      { name: 'Sponsor B', logoUrl: null },
      { name: 'Sponsor C', logoUrl: null },
    ],
    config: {
      barText: 'PATROCINADO POR', barColor: '#e53935', barTextColor: '#ffffff',
      fontFamily: 'Montserrat, sans-serif', barHeight: 44,
      bgGradientTop: '#3a3a3a', bgGradientBottom: '#555', rotationSpeed: 5000,
    },
  });

  ltMostrar({
    nombre: 'Juan', apellido: 'Pérez', cargo: 'INVITADO',
    estilo: {
      fontFamily: 'Montserrat, sans-serif',
      titleFontSize: '3.0rem', subtitleFontSize: '2.5rem',
      titleColor: '#ffffff', titleBg: '#06155A',
      subtitleColor: '#111111', subtitleBg: '#ffffff',
      escala: 1.0, posX: 100, posY: 90,
    },
  }, {
    nombre: 'María', apellido: 'García', cargo: 'CONDUCTORA',
    estilo: {
      fontFamily: 'Montserrat, sans-serif',
      titleFontSize: '3.0rem', subtitleFontSize: '2.5rem',
      titleColor: '#ffffff', titleBg: '#06155A',
      subtitleColor: '#111111', subtitleBg: '#ffffff',
      escala: 1.0, posX: 100, posY: 90,
    },
  });

  tkrAnimEntrada({
    title: 'LIVE', message: 'Bienvenidos a la transmisión • Gracias por acompañarnos',
    titleSize: 44, titleColor: '#ffffff', titleBg: '#071041',
    fontSize: 33, msgColor: '#111111', msgBg: '#ffffff',
    speed: 80, fontFamily: 'Montserrat, sans-serif', logoUrl: null, logoWidth: 4,
  });

  lbUpdateData({
    lugar: 'C.C VIVA',
    ciudad: 'TUNJA',
    refreshInterval: 1800000,
    estilo: {
      fontFamily: 'Montserrat, sans-serif',
      titleFontSize: '3.0rem',
      subtitleFontSize: '2.5rem',
      titleColor: '#ffffff',
      titleBg: '#06155A',
      subtitleColor: '#111111',
      subtitleBg: '#ffffff',
      escala: 1.0,
      posX: 100,
      posY: 32,
    },
  });
  lbAnimEntrada();
}

/* ═══════════════════════════════════════════
   SOCKET
   ═══════════════════════════════════════════ */
function handlePayload(payload) {
  try {
    if (!payload || !payload.tipo || !payload.data) return;
    const { tipo, data } = payload;

    /* ── SPONSORS ── */
    if (tipo === 'SPONSORS') {
      const { accion, sponsors, config } = data;
      if (!accion) return;
      if (accion === 'SHOW') {
        if (spVisible) {
          spUpdate({ sponsors, config });
        } else {
          spMostrar({ sponsors, config });
        }
      } else if (accion === 'UPDATE') {
        spUpdate({ sponsors, config });
      } else if (accion === 'HIDE') {
        spAnimSalida();
      }
      return;
    }

    /* ── LOWER DUAL ── */
    if (tipo === 'LOWER_DUAL') {
      const { accion, left, right } = data;
      if (!accion) return;
      switch (accion) {
        case 'SHOW':
          ltMostrar(left, right);
          break;
        case 'SHOW_LEFT':
          if (left) {
            ltSetTexts('ltl', left);
            if (!ltLeftVisible) {
              if (ltTimeline) ltTimeline.kill();
              ltTimeline = ltEntryLeft();
            }
          }
          break;
        case 'SHOW_RIGHT':
          if (right) {
            ltSetTexts('ltr', right);
            if (!ltRightVisible) {
              if (ltTimeline) ltTimeline.kill();
              ltTimeline = ltEntryRight();
            }
          }
          break;
        case 'HIDE':
          if (ltTimeline) ltTimeline.kill();
          ltTimeline = gsap.timeline();
          ltTimeline.add(ltExitLeft(), 0);
          ltTimeline.add(ltExitRight(), 0);
          break;
        case 'HIDE_LEFT':
          if (ltTimeline) ltTimeline.kill();
          ltTimeline = ltExitLeft();
          break;
        case 'HIDE_RIGHT':
          if (ltTimeline) ltTimeline.kill();
          ltTimeline = ltExitRight();
          break;
        case 'UPDATE':
          ltUpdate(left, right);
          break;
      }
      return;
    }

    /* ── TICKER ── */
    if (tipo === 'TICKER') {
      const { accion } = data;
      if (accion === 'SHOW') {
        if (tkVisible) {
          tkrUpdate(data);
        } else {
          tkrAnimEntrada(data);
        }
      } else if (accion === 'UPDATE') {
        tkrUpdate(data);
      } else if (accion === 'HIDE') {
        tkrAnimSalida();
      }
      return;
    }

    /* ── LIVEBUG ── */
    if (tipo === 'LIVEBUG') {
      const { accion } = data;
      if (accion === 'SHOW') {
        lbUpdateData(data);
        if (!lbVisible) lbAnimEntrada();
      } else if (accion === 'HIDE') {
        lbAnimSalida();
      } else if (accion === 'UPDATE') {
        if (!lbVisible) return;
        lbUpdateData(data);
      } else if (accion === 'REFRESH_TEMP') {
        if (lbCurrentCity) {
          lbFetchTemp(lbCurrentCity).then((t) => lbRenderCiudadTemp(lbCurrentCity, t));
        }
      }
      return;
    }
  } catch (err) {
    console.error('[COMBO RENDER] Error:', err);
  }
}

// Demo state on load
showDefault();

// Always connect via Socket.IO
getAuthToken().then((token) => {
  const socket = io({ ...SOCKET_OPTIONS, auth: { token } });
  socket.on('connect_error', (err) => {
    console.error('[COMBO SOCKET] Error:', err.message);
  });

  socket.on('render-graphic', handlePayload);
});
