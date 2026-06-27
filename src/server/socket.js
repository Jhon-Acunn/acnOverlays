'use strict';

const config = require('./config');
const logger = require('./logger');
const { socketAuth } = require('./auth');
const { validateUpdateGraphic } = require('./validation');

const EMIT_INTERVAL_MS = config.rate.socketMinIntervalMs;

function isHideAction(accion) {
  return typeof accion === 'string' && /^HIDE/i.test(accion);
}

function attach(io) {
  const socketLastEmit = new Map();
  const currentState = new Map();
  const dashboardSettings = new Map();

  function sendStateTo(socket) {
    for (const [tipo, data] of currentState.entries()) {
      socket.emit('render-graphic', { tipo, data });
    }
  }

  function sendSettingsTo(socket) {
    for (const [key, value] of dashboardSettings.entries()) {
      socket.emit('dashboard-settings', { key, value });
    }
  }

  function applyUpdate(payload) {
    const previous = currentState.get(payload.tipo);
    let merged;
    if (isHideAction(payload.data.accion) && previous) {
      // HIDE actions: preserve the previously-known data so the next SHOW
      // (or a reconnecting client) still has the text/style/position.
      merged = { ...previous, accion: payload.data.accion };
    } else {
      merged = payload.data;
    }
    currentState.set(payload.tipo, merged);
    io.emit('render-graphic', { tipo: payload.tipo, data: merged });
  }

  io.use(socketAuth);

  io.on('connection', (socket) => {
    logger.info({ id: socket.id }, 'socket connected');
    sendStateTo(socket);
    sendSettingsTo(socket);

    socket.on('update-graphic', (payload) => {
      const now = Date.now();
      const last = socketLastEmit.get(socket.id) || 0;
      if (now - last < EMIT_INTERVAL_MS) return; // rate limit
      socketLastEmit.set(socket.id, now);

      const result = validateUpdateGraphic(payload);
      if (!result.ok) {
        logger.warn({ id: socket.id, reason: result.reason }, 'invalid payload');
        return;
      }
      applyUpdate(result.payload);
    });

    socket.on('request-state', () => {
      sendStateTo(socket);
    });

    socket.on('save-dashboard-settings', ({ key, value }) => {
      dashboardSettings.set(key, value);
      socket.broadcast.emit('dashboard-settings-updated', { key, value });
    });

    socket.on('request-dashboard-settings', () => {
      sendSettingsTo(socket);
    });

    socket.on('disconnect', (reason) => {
      socketLastEmit.delete(socket.id);
      logger.info({ id: socket.id, reason }, 'socket disconnected');
    });
  });
}

module.exports = { attach };
