import { io } from 'socket.io-client';
import { getAuthToken } from '../../shared/auth-token.js';
import { onServerSave } from './storage.js';

let socket = null;
let authToken = '';
let lastLatency = -1;
let pingSentAt = 0;

// Map OBS graphic tipo → dashboard toggle(s) so the UI stays in sync with
// the actual state broadcast by the server.
const TOGGLE_MAP = {
  SCOREBOARD: { id: 'scoreToggle' },
  LOWER_THIRD: { id: 'lowerToggle' },
  SPONSORS: { id: 'sponsorToggle' },
  TICKER: { id: 'tkrToggle' },
  WEATHER: { id: 'weatherToggle' },
  COUNTDOWN: { id: 'countdownToggle' },
  NOWPLAYING: { id: 'nowplayingToggle' },
  RESULTADOS: { id: 'resultadosToggle' },
  LIVEBUG: { id: 'livebugToggle' },
  LOWER_DUAL: {
    left: { id: 'dualLToggle' },
    right: { id: 'dualRToggle' },
    both: { id: 'dualBothToggle' },
  },
};

const debounceTimers = new Map();

export function getSocket() {
  return socket;
}

export function getLatency() {
  return lastLatency;
}

export function requestState() {
  if (socket && socket.connected) {
    socket.emit('request-state');
  }
}

function getToggleAccion(toggleId) {
  const el = document.getElementById(toggleId);
  return el?.checked ? 'SHOW' : 'HIDE';
}

function setToggle(id, checked) {
  const el = document.getElementById(id);
  if (!el) return;
  el.checked = checked;
}

function syncTogglesFromServer(tipo, data) {
  const accion = data?.accion;
  if (!accion) return;

  const mapping = TOGGLE_MAP[tipo];
  if (!mapping) return;

  if (tipo === 'LOWER_DUAL') {
    if (accion === 'SHOW') {
      setToggle(mapping.left.id, true);
      setToggle(mapping.right.id, true);
      setToggle(mapping.both.id, true);
    } else if (accion === 'HIDE') {
      setToggle(mapping.left.id, false);
      setToggle(mapping.right.id, false);
      setToggle(mapping.both.id, false);
    } else if (accion === 'SHOW_LEFT' || accion === 'HIDE_LEFT') {
      setToggle(mapping.left.id, accion === 'SHOW_LEFT');
      const bothOn =
        document.getElementById(mapping.left.id)?.checked &&
        document.getElementById(mapping.right.id)?.checked;
      setToggle(mapping.both.id, bothOn);
    } else if (accion === 'SHOW_RIGHT' || accion === 'HIDE_RIGHT') {
      setToggle(mapping.right.id, accion === 'SHOW_RIGHT');
      const bothOn =
        document.getElementById(mapping.left.id)?.checked &&
        document.getElementById(mapping.right.id)?.checked;
      setToggle(mapping.both.id, bothOn);
    }
    return;
  }

  if (accion === 'SHOW' || accion === 'HIDE') {
    setToggle(mapping.id, accion === 'SHOW');
  }
}

function clearDebounce(tipo) {
  const t = debounceTimers.get(tipo);
  if (t) clearTimeout(t);
  debounceTimers.delete(tipo);
}

/**
 * Send a graphic update to the server. The broadcast is debounced so rapid
 * input changes don't hit the rate limiter. When the toggle is ON the action
 * is 'UPDATE' so visible overlays refresh without replaying the entrance
 * animation; when OFF it sends 'HIDE'.
 */
export function emitGraphic({
  tipo,
  tab: _tab,
  previewTipo: _previewTipo,
  getData,
  toggleId,
  customAccion,
  debounceMs = 250,
  wrap,
}) {
  const toggleAccion = toggleId ? getToggleAccion(toggleId) : 'SHOW';
  const accion = customAccion ?? (toggleAccion === 'SHOW' ? 'UPDATE' : 'HIDE');
  const raw = getData();
  const data = wrap ? wrap(accion, raw) : { ...raw, accion };

  clearDebounce(tipo);
  const timer = setTimeout(() => {
    if (socket) socket.emit('update-graphic', { tipo, data });
    debounceTimers.delete(tipo);
  }, debounceMs);
  debounceTimers.set(tipo, timer);
}

/**
 * Same as emitGraphic but sends to the server immediately. Use this for
 * toggle changes and other actions that must not be delayed. Sends explicit
 * SHOW/HIDE based on the toggle state or the provided accion.
 */
export function emitGraphicNow({
  tipo,
  tab: _tab,
  previewTipo: _previewTipo,
  getData,
  toggleId,
  accion: customAccion,
  wrap,
}) {
  const accion = customAccion ?? (toggleId ? getToggleAccion(toggleId) : 'SHOW');
  const raw = getData();
  const data = wrap ? wrap(accion, raw) : { ...raw, accion };

  clearDebounce(tipo);
  if (socket) socket.emit('update-graphic', { tipo, data });
}

export async function initSocket() {
  authToken = await getAuthToken();
  socket = io({
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    auth: { token: authToken },
  });
  socket.on('connect_error', (err) => console.error('[SOCKET] Error de conexión:', err.message));
  socket.on('disconnect', (reason) => console.warn('[SOCKET] Desconectado:', reason));

  // Whenever the server broadcasts (from any operator or OBS), update the
  // dashboard toggles so the UI stays in lockstep with what OBS is rendering.
  socket.on('render-graphic', (payload) => {
    if (!payload || !payload.tipo) return;
    syncTogglesFromServer(payload.tipo, payload.data);
  });

  const engine = socket.io && socket.io.engine;
  if (engine) {
    engine.on('packetCreate', (packet) => {
      if (packet && packet.type === 'ping') {
        pingSentAt = Date.now();
      }
    });
    engine.on('packet', (packet) => {
      if (packet && packet.type === 'pong' && pingSentAt) {
        lastLatency = Date.now() - pingSentAt;
        pingSentAt = 0;
      }
    });
  }

  // ── Dashboard settings server sync ──
  // Receive settings from server on connect
  socket.on('dashboard-settings', ({ key, value }) => {
    if (key && value !== undefined) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  });

  // Receive live updates from other clients
  socket.on('dashboard-settings-updated', ({ key, value }) => {
    if (key && value !== undefined) {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(value) }));
    }
  });

  onServerSave((e) => {
    if (socket && socket.connected && e.detail) {
      socket.emit('save-dashboard-settings', e.detail);
    }
  });

  return socket;
}
