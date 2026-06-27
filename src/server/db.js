'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const config = require('./config');
const logger = require('./logger');

const DB_PATH = path.join(config.paths.data, 'overlays.db');

let db = null;

function open() {
  if (db) return db;
  const fs = require('fs');
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  ensureSchema();
  logger.info({ path: DB_PATH }, 'database opened');
  return db;
}

function ensureSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS graphic_state (
      tipo        TEXT PRIMARY KEY,
      data        TEXT NOT NULL,
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dashboard_settings (
      key         TEXT PRIMARY KEY,
      value       TEXT NOT NULL,
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS presets (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      tipo        TEXT NOT NULL,
      data        TEXT NOT NULL,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS guest_slots (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      storage_key TEXT NOT NULL,
      slot        INTEGER NOT NULL,
      data        TEXT NOT NULL,
      UNIQUE(storage_key, slot)
    );
  `);
}

// ── Graphic State ────────────────────────────────

function saveGraphicState(tipo, data) {
  const stmt = get().prepare(`
    INSERT INTO graphic_state (tipo, data, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(tipo) DO UPDATE SET data = excluded.data, updated_at = datetime('now')
  `);
  stmt.run(tipo, JSON.stringify(data));
}

function loadGraphicState(tipo) {
  const row = get().prepare('SELECT data FROM graphic_state WHERE tipo = ?').get(tipo);
  return row ? JSON.parse(row.data) : null;
}

function loadAllGraphicState() {
  const rows = get().prepare('SELECT tipo, data FROM graphic_state').all();
  const map = new Map();
  for (const row of rows) map.set(row.tipo, JSON.parse(row.data));
  return map;
}

// ── Dashboard Settings ───────────────────────────

function saveSetting(key, value) {
  const stmt = get().prepare(`
    INSERT INTO dashboard_settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `);
  stmt.run(key, JSON.stringify(value));
}

function loadSetting(key) {
  const row = get().prepare('SELECT value FROM dashboard_settings WHERE key = ?').get(key);
  return row ? JSON.parse(row.value) : null;
}

function loadAllSettings() {
  const rows = get().prepare('SELECT key, value FROM dashboard_settings').all();
  const map = new Map();
  for (const row of rows) map.set(row.key, JSON.parse(row.value));
  return map;
}

// ── Presets ──────────────────────────────────────

function savePreset(name, tipo, data) {
  const stmt = get().prepare(`
    INSERT INTO presets (name, tipo, data) VALUES (?, ?, ?)
  `);
  const result = stmt.run(name, tipo, JSON.stringify(data));
  return { id: result.lastInsertRowid };
}

function loadPresets(tipo) {
  const rows = tipo
    ? get().prepare('SELECT * FROM presets WHERE tipo = ? ORDER BY updated_at DESC').all(tipo)
    : get().prepare('SELECT * FROM presets ORDER BY tipo, updated_at DESC').all();
  return rows.map((r) => ({ ...r, data: JSON.parse(r.data) }));
}

function loadPreset(id) {
  const row = get().prepare('SELECT * FROM presets WHERE id = ?').get(id);
  return row ? { ...row, data: JSON.parse(row.data) } : null;
}

function updatePreset(id, name, data) {
  get().prepare('UPDATE presets SET name = ?, data = ?, updated_at = datetime(\'now\') WHERE id = ?').run(name, JSON.stringify(data), id);
}

function duplicatePreset(id, newName) {
  const original = loadPreset(id);
  if (!original) return null;
  return savePreset(newName || original.name + ' (copy)', original.tipo, original.data);
}

function deletePreset(id) {
  get().prepare('DELETE FROM presets WHERE id = ?').run(id);
}

// ── Guest Slots ──────────────────────────────────

function saveGuestSlot(storageKey, slot, data) {
  const stmt = get().prepare(`
    INSERT INTO guest_slots (storage_key, slot, data)
    VALUES (?, ?, ?)
    ON CONFLICT(storage_key, slot) DO UPDATE SET data = excluded.data
  `);
  stmt.run(storageKey, slot, JSON.stringify(data));
}

function loadGuestSlots(storageKey) {
  const rows = get().prepare('SELECT slot, data FROM guest_slots WHERE storage_key = ?').all(storageKey);
  const obj = {};
  for (const row of rows) obj[row.slot] = JSON.parse(row.data);
  return obj;
}

function deleteGuestSlot(storageKey, slot) {
  get().prepare('DELETE FROM guest_slots WHERE storage_key = ? AND slot = ?').run(storageKey, slot);
}

// ── Core ─────────────────────────────────────────

function get() {
  if (!db) open();
  return db;
}

function close() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  open,
  close,
  get,
  saveGraphicState,
  loadGraphicState,
  loadAllGraphicState,
  saveSetting,
  loadSetting,
  loadAllSettings,
  savePreset,
  loadPresets,
  loadPreset,
  updatePreset,
  duplicatePreset,
  deletePreset,
  saveGuestSlot,
  loadGuestSlots,
  deleteGuestSlot,
};
