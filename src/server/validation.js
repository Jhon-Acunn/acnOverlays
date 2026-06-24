'use strict';

const VALID_TIPOS = new Set([
  'SCOREBOARD',
  'LOWER_THIRD',
  'LOWER_DUAL',
  'SPONSORS',
  'TICKER',
  'COMBO',
  'WEATHER',
  'COUNTDOWN',
  'NOWPLAYING',
  'RESULTADOS',
]);

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function safeString(v, max = 500) {
  if (typeof v !== 'string') return undefined;
  return v.slice(0, max);
}

function validateUpdateGraphic(payload) {
  if (!isPlainObject(payload)) return { ok: false, reason: 'payload-not-object' };
  const tipo = payload.tipo;
  if (typeof tipo !== 'string' || !VALID_TIPOS.has(tipo)) {
    return { ok: false, reason: 'invalid-tipo' };
  }
  if (!isPlainObject(payload.data)) return { ok: false, reason: 'data-not-object' };
  // Cap payload size: keep first 50 keys with shallow strings only.
  const data = {};
  const keys = Object.keys(payload.data).slice(0, 50);
  for (const k of keys) {
    const v = payload.data[k];
    if (typeof v === 'string') {
      data[k] = safeString(v, 2000);
    } else if (typeof v === 'number' || typeof v === 'boolean' || v === null) {
      data[k] = v;
    } else if (isPlainObject(v)) {
      data[k] = v;
    } else if (Array.isArray(v) && v.length < 200) {
      data[k] = v;
    }
  }
  return { ok: true, payload: { tipo, data } };
}

module.exports = { validateUpdateGraphic, VALID_TIPOS };
