'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');

const config = require('./config');
const logger = require('./logger');
const db = require('./db');
const media = require('./media');
const socket = require('./socket');

// ── Open database ──────────────────────────────────────────
db.open();

// ── Process-level crash protection ────────────────────────────
// After an uncaught error the process is in an unknown state; let the
// orchestrator (Docker / PM2) restart it. Exit with failure code.
function fatal(err, type) {
  logger.fatal({ err, type }, 'unhandled error - exiting');
  // Give the logger a moment to flush.
  setTimeout(() => process.exit(1), 100).unref();
}
process.on('uncaughtException', (err) => fatal(err, 'uncaughtException'));
process.on('unhandledRejection', (reason) => fatal(reason, 'unhandledRejection'));

const app = express();
const httpServer = http.createServer(app);

// ── Socket.IO ────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigins.length ? config.corsOrigins : false,
    methods: ['GET', 'POST'],
  },
});
socket.attach(io);

// ── HTTP middleware ──────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(compression());
app.use(express.json({ limit: config.limits.jsonBody }));

// CORS for dev (Vite on a different port)
if (!config.isProd && config.corsOrigins.length) {
  app.use((req, res, next) => {
    const origin = req.get('origin');
    if (origin && config.corsOrigins.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Vary', 'Origin');
    }
    next();
  });
}

app.use('/assets', express.static(config.paths.assets));
app.use('/api/media', media.router);

// Health
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', uptime: process.uptime(), env: config.env })
);

// Expose the auth token to the dashboard so it can self-authenticate when
// loaded from the same origin. The token is short and the dashboard is served
// from the same server. In dev (no AUTH_TOKEN) this returns empty string.
app.get('/api/config', (_req, res) => {
  res.json({ authToken: config.authToken });
});

// Production: serve built static files
if (config.isProd) {
  app.use(express.static(config.paths.dist));
  app.get('/', (_req, res) => res.redirect('/dashboard/'));
  // SPA-ish: send index.html for unknown routes under /templates/* and /dashboard/*
  app.get(/^\/(dashboard|templates)\/.*$/, (_req, res) =>
    res.sendFile(require('path').join(config.paths.dist, 'index.html'))
  );
}

httpServer.listen(config.port, '0.0.0.0', () => {
  logger.info(
    {
      port: config.port,
      env: config.env,
      auth: !!config.authToken,
      cors: config.corsOrigins,
    },
    `Overlays server listening on :${config.port}`
  );
  if (!config.isProd) {
    logger.info('Dev dashboard: http://localhost:5173/dashboard/');
  }
});

module.exports = { app, io, httpServer };
