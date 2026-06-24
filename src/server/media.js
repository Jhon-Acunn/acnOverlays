'use strict';

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const logger = require('./logger');
const { httpAuth } = require('./auth');

const router = express.Router();

const VALID_EXT = /\.(png|jpg|jpeg|gif|svg|webp)$/i;

async function ensureLogosDir() {
  await fsp.mkdir(config.paths.logos, { recursive: true });
}

function safeDest(filename) {
  const safe = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  const dest = path.join(config.paths.logos, safe);
  if (!dest.startsWith(config.paths.logos + path.sep)) return null;
  return dest;
}

const listLimiter = rateLimit({ windowMs: 60 * 1000, max: config.rate.apiPerMinute });
const uploadLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });
const deleteLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });

router.get('/', listLimiter, async (_req, res) => {
  try {
    try {
      await fsp.access(config.paths.logos);
    } catch {
      return res.json([]);
    }
    const files = await fsp.readdir(config.paths.logos);
    const out = files
      .filter((f) => VALID_EXT.test(f))
      .map((f) => ({ name: f, url: '/assets/logos/' + f }));
    res.json(out);
  } catch (err) {
    logger.error({ err }, 'media list error');
    res.status(500).json({ error: 'Error al listar archivos' });
  }
});

router.post('/upload', httpAuth, uploadLimiter, async (req, res) => {
  try {
    const { name, data } = req.body || {};
    if (!name || !data) return res.status(400).json({ error: 'name y data requeridos' });

    const approxBytes = Buffer.byteLength(data, 'utf8') * 0.75;
    if (approxBytes > config.limits.uploadBytes) {
      return res
        .status(413)
        .json({ error: `Archivo demasiado grande (máx ${config.limits.uploadBytes / 1024 / 1024}MB)` });
    }

    const dest = safeDest(name);
    if (!dest) return res.status(400).json({ error: 'Nombre de archivo inválido' });

    await ensureLogosDir();
    const buffer = Buffer.from(data, 'base64');
    await fsp.writeFile(dest, buffer);
    res.json({ name: path.basename(dest), url: '/assets/logos/' + path.basename(dest) });
  } catch (err) {
    logger.error({ err }, 'media upload error');
    res.status(500).json({ error: 'Error al subir archivo' });
  }
});

router.delete('/:name', httpAuth, deleteLimiter, async (req, res) => {
  try {
    const dest = safeDest(req.params.name);
    if (!dest) return res.status(400).json({ error: 'Nombre de archivo inválido' });
    await fsp.rm(dest, { force: true });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'media delete error');
    res.status(500).json({ error: 'Error al eliminar archivo' });
  }
});

// Keep legacy sync helpers exported for tests/back-compat
function existsSync(p) {
  return fs.existsSync(p);
}

module.exports = { router, existsSync };
