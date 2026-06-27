'use strict';

const config = require('./config');
const logger = require('./logger');
const { socketAuth } = require('./auth');
const { validateUpdateGraphic } = require('./validation');
const db = require('./db');

const EMIT_INTERVAL_MS = config.rate.socketMinIntervalMs;

function isHideAction(accion) {
  return typeof accion === 'string' && /^HIDE/i.test(accion);
}

function attach(io) {
  const socketLastEmit = new Map();
  const currentState = db.loadAllGraphicState();
  const dashboardSettings = db.loadAllSettings();

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
      merged = { ...previous, accion: payload.data.accion };
    } else {
      merged = payload.data;
    }
    currentState.set(payload.tipo, merged);
    db.saveGraphicState(payload.tipo, merged);
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
      if (now - last < EMIT_INTERVAL_MS) return;
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
      db.saveSetting(key, value);
      socket.broadcast.emit('dashboard-settings-updated', { key, value });
    });

    socket.on('request-dashboard-settings', () => {
      sendSettingsTo(socket);
    });

    // ── Guest slot sync ──
    socket.on('save-guest-slot', ({ storageKey, slot, data }) => {
      db.saveGuestSlot(storageKey, slot, data);
      socket.broadcast.emit('guest-slot-updated', { storageKey });
    });

    socket.on('delete-guest-slot', ({ storageKey, slot }) => {
      db.deleteGuestSlot(storageKey, slot);
      socket.broadcast.emit('guest-slot-updated', { storageKey });
    });

    socket.on('request-guest-slots', ({ storageKey }) => {
      const slots = db.loadGuestSlots(storageKey);
      socket.emit('guest-slots-data', { storageKey, slots });
    });

    // ── Preset API ──
    socket.on('preset:save', ({ name, tipo, data }, ack) => {
      const result = db.savePreset(name, tipo, data);
      if (ack) ack({ ok: true, ...result });
    });

    socket.on('preset:load-all', ({ tipo }, ack) => {
      const presets = db.loadPresets(tipo || null);
      if (ack) ack({ ok: true, presets });
    });

    socket.on('preset:load', ({ id }, ack) => {
      const preset = db.loadPreset(id);
      if (ack) ack(preset ? { ok: true, preset } : { ok: false, error: 'not found' });
    });

    socket.on('preset:update', ({ id, name, data }, ack) => {
      db.updatePreset(id, name, data);
      if (ack) ack({ ok: true });
    });

    socket.on('preset:duplicate', ({ id, name }, ack) => {
      const result = db.duplicatePreset(id, name);
      if (ack) ack(result ? { ok: true, ...result } : { ok: false, error: 'not found' });
    });

    socket.on('preset:delete', ({ id }, ack) => {
      db.deletePreset(id);
      if (ack) ack({ ok: true });
    });

    socket.on('disconnect', (reason) => {
      socketLastEmit.delete(socket.id);
      logger.info({ id: socket.id, reason }, 'socket disconnected');
    });
  });
}

module.exports = { attach };
