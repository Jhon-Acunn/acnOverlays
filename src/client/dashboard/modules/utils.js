import { isApplyingRemote } from './storage.js';

export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    // Skip scheduling when a remote settings round-trip is being applied.
    // Without this, the synthetic input events dispatched by the remote
    // handler would re-trigger the debounced save and create a sync loop
    // where settings bounce back and forth between devices every ~600ms.
    if (isApplyingRemote()) return;
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function hexToRgba(hex, opacity) {
  hex = String(hex || '').replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0,0,0,${opacity})`;
  return `rgba(${r},${g},${b},${opacity})`;
}

export function colorWithOpacity(color, opacity) {
  if (!color) return `rgba(0,0,0,${opacity})`;
  const trimmed = String(color).trim();
  if (trimmed.startsWith('rgba')) return trimmed.replace(/[\d.]+\)$/, opacity + ')');
  if (trimmed.startsWith('rgb'))
    return trimmed.replace('rgb', 'rgba').replace(')', ', ' + opacity + ')');
  return hexToRgba(trimmed, opacity);
}

export function ajustarEscalas() {
  document.querySelectorAll('.preview-scene').forEach((scene) => {
    const w = scene.clientWidth || scene.offsetWidth;
    if (w === 0) return;
    const stage = scene.querySelector('.preview-stage');
    if (!stage) return;
    stage.style.transform = `scale(${w / 1920})`;
  });
}

export function copiarURL(url) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(url);
  }
  return new Promise((resolve) => {
    const ta = document.createElement('textarea');
    ta.value = url;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch {
      /* noop */
    }
    document.body.removeChild(ta);
    resolve();
  });
}

export function initURLCopy() {
  document.querySelectorAll('.url-row').forEach((row) => {
    const url = window.location.origin + row.dataset.path;
    row.innerHTML = `
      <code class="url-text">${url}</code>
      <button class="url-copy" data-url="${url}" title="Copy URL">📋</button>
    `;
  });
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.url-copy');
    if (!btn) return;
    copiarURL(btn.dataset.url).catch(() => {});
    const origText = btn.textContent;
    btn.textContent = '✓';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = origText;
      btn.classList.remove('copied');
    }, 1500);
  });
}

export function bindFontPicker(btnId, inputId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const input = document.getElementById(inputId);
    if (!input) return;
    const prev = input.value;
    input.value = '';
    if (typeof input.showPicker === 'function') input.showPicker();
    requestAnimationFrame(() => {
      input.addEventListener(
        'blur',
        function restore() {
          if (!input.value) input.value = prev;
          input.removeEventListener('blur', restore);
        },
        { once: true }
      );
    });
  });
}

export function preventEnterOnDatalist() {
  document
    .querySelectorAll('input[list="fontList"], input[list="spFontList"], input[list="tkrFontList"]')
    .forEach((inp) => {
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          inp.blur();
        }
      });
    });
}

export function setVal(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

export function val(id, fallback = 0) {
  const el = document.getElementById(id);
  if (!el) return fallback;
  const v = el.value;
  return v === '' || v === null ? fallback : v;
}

export function initSpinButtons() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-spin]');
    if (!btn) return;
    const id = btn.dataset.spin;
    const dir = btn.dataset.dir;
    const input = document.getElementById(id);
    if (!input) return;

    const step = parseFloat(input.step) || 1;
    const min = input.min === '' ? -Infinity : parseFloat(input.min);
    const max = input.max === '' ? Infinity : parseFloat(input.max);
    const current = parseFloat(input.value) || 0;
    const next = dir === 'up' ? current + step : current - step;
    const clamped = Math.min(max, Math.max(min, parseFloat(next.toFixed(10))));

    input.value = String(clamped);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
