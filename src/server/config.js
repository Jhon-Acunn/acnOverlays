'use strict';

const path = require('path');

const env = process.env.NODE_ENV || 'development';
const isProd = env === 'production';

const config = {
  env,
  isProd,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  authToken: process.env.AUTH_TOKEN || '',
  paths: {
    root: path.resolve(__dirname, '..', '..'),
    srcClient: path.resolve(__dirname, '..', '..', 'src', 'client'),
    assets: path.resolve(__dirname, '..', 'client', 'assets'),
    logos: path.resolve(__dirname, '..', 'client', 'assets', 'logos'),
    dist: path.resolve(__dirname, '..', '..', 'dist', 'client'),
    data: path.resolve(__dirname, '..', '..', 'data'),
  },
  limits: {
    jsonBody: '10mb',
    uploadBytes: 5 * 1024 * 1024,
  },
  rate: {
    socketMinIntervalMs: 150,
    apiPerMinute: 120,
  },
  // CORS allowed origins. In production we default to same-origin (no CORS).
  // In dev we allow the Vite port. Override with CORS_ORIGIN as comma-separated list.
  corsOrigins: (process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
    : isProd
      ? []
      : ['http://localhost:5173']),
};

if (!Number.isFinite(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error(`Invalid PORT: ${process.env.PORT}`);
}

module.exports = config;
