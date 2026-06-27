import { getLatency } from './socket.js';

let pill = null;
let dot = null;
let labelEl = null;
let latencyEl = null;
let currentState = 'disconnected';
let currentDetail = '';
let lastLatencyMs = null;
let latencyTimer = null;

const STATE_CONFIG = {
  connected: 'ONLINE',
  reconnecting: 'RECONNECTING...',
  disconnected: 'DISCONNECTED',
  error: 'AUTH ERROR',
};

const ALL_STATES = Object.keys(STATE_CONFIG);

function renderPill() {
  if (!pill) return;
  ALL_STATES.forEach((s) => pill.classList.remove(s));
  pill.classList.add(currentState);
  if (labelEl) labelEl.textContent = STATE_CONFIG[currentState] || currentState;
  if (latencyEl) {
    if (currentState === 'connected' && lastLatencyMs != null) {
      latencyEl.textContent = `${lastLatencyMs}ms`;
      latencyEl.style.display = '';
    } else {
      latencyEl.textContent = '';
      latencyEl.style.display = 'none';
    }
  }
  pill.setAttribute('data-tooltip', buildTooltip());
  pill.setAttribute('title', buildTooltip());
}

function buildTooltip() {
  const base = STATE_CONFIG[currentState] || currentState;
  if (currentState === 'connected' && lastLatencyMs != null) {
    return currentDetail
      ? `${base} · ${lastLatencyMs}ms · ${currentDetail}`
      : `${base} · ${lastLatencyMs}ms`;
  }
  if (currentDetail) return `${base} · ${currentDetail}`;
  return base;
}

export function initConnectionStatus() {
  if (pill) return;
  pill = document.createElement('div');
  pill.className = 'conn-pill disconnected';
  pill.setAttribute('role', 'status');
  pill.setAttribute('aria-live', 'polite');

  dot = document.createElement('span');
  dot.className = 'conn-dot';

  labelEl = document.createElement('span');
  labelEl.className = 'conn-label';
  labelEl.textContent = STATE_CONFIG.disconnected;

  latencyEl = document.createElement('span');
  latencyEl.className = 'conn-latency';
  latencyEl.style.display = 'none';

  pill.appendChild(dot);
  pill.appendChild(labelEl);
  pill.appendChild(latencyEl);
  document.body.appendChild(pill);

  renderPill();
}

export function setStatus(state, detail = '') {
  if (!STATE_CONFIG[state]) return;
  currentState = state;
  currentDetail = detail || '';
  renderPill();
}

export function updateStatus(state, detail = '') {
  setStatus(state, detail);
}

export function getStatus() {
  return {
    state: currentState,
    detail: currentDetail,
    latencyMs: lastLatencyMs,
  };
}

export function attachSocket(socket) {
  if (!socket) return;

  socket.on('connect', () => {
    setStatus('connected');
  });

  socket.on('disconnect', (reason) => {
    setStatus('disconnected', reason ? String(reason) : 'Disconnected');
  });

  socket.on('connect_error', (err) => {
    const message = err && err.message ? err.message : 'Auth';
    setStatus('error', message);
  });

  socket.on('reconnect_attempt', (attempt) => {
    const detail = typeof attempt === 'number' ? `Attempt ${attempt}` : '';
    setStatus('reconnecting', detail);
  });

  if (latencyTimer) clearInterval(latencyTimer);
  latencyTimer = setInterval(() => {
    const ms = getLatency();
    if (typeof ms === 'number' && ms >= 0) {
      lastLatencyMs = ms;
      if (currentState === 'connected') renderPill();
    }
  }, 1000);
}
