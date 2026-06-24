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
  // Current state per graphic tipo. This is the single source of truth so
  // that any new client (OBS browser source, dashboard, second operator) can
  // request and receive the latest known state on connect.
  const currentState = new Map();

  function sendStateTo(socket) {
    for (const [tipo, data] of currentState.entries()) {
      socket.emit('render-graphic', { tipo, data });
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
    // Send full current state so the new client mirrors OBS without having
    // to wait for the next manual update.
    sendStateTo(socket);

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

    socket.on('disconnect', (reason) => {
      socketLastEmit.delete(socket.id);
      logger.info({ id: socket.id, reason }, 'socket disconnected');
    });
  });
}

module.exports = { attach };
